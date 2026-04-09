"""
@file create_firebase_auth_users.py
@brief Batch-create Firebase Auth accounts for all authorized district users.

@details Reads authorized_emails.json and district_lookup.json, then creates
Firebase Auth email/password accounts for each user. Uses a shared password.
Also stores district info in Firestore for server-side lookup on login.

Skips accounts that already exist.

@author Willis Zhang
@date 2026-04-09
"""

import json
import os
import sys
import time

# Firebase Admin SDK
try:
    import firebase_admin
    from firebase_admin import credentials, auth, firestore
except ImportError:
    print("Installing firebase-admin...")
    os.system(
        f"{sys.executable} -m pip install firebase-admin --index-url https://pypi.org/simple/"
    )
    import firebase_admin
    from firebase_admin import credentials, auth, firestore

# Configuration
PROJECT_ID = "wz-chef-ann"
SHARED_PASSWORD = os.environ.get("CHEF_ANN_SHARED_PASSWORD")
if not SHARED_PASSWORD:
    print("ERROR: Set CHEF_ANN_SHARED_PASSWORD environment variable first.")
    print("  export CHEF_ANN_SHARED_PASSWORD='your_password_here'")
    sys.exit(1)
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "functions", "data")


def init_firebase():
    """Initialize Firebase Admin SDK using application default credentials."""
    if not firebase_admin._apps:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {"projectId": PROJECT_ID})
    return firestore.client()


def load_data():
    """Load authorized emails and district lookup."""
    with open(os.path.join(DATA_DIR, "authorized_emails.json")) as f:
        emails = json.load(f)

    with open(os.path.join(DATA_DIR, "district_lookup.json")) as f:
        lookup = json.load(f)

    return emails, lookup


def build_district_profile(district_info):
    """Build a districtProfile object matching the frontend DistrictProfile shape.

    Pre-populates fields we know from the xlsx data so the user sees them
    filled in on onboarding (districtName, enrollment, entitlement).
    Fields we DON'T know (grade breakdown, participation rate, equipment, allergens)
    are left empty for the user to fill in.
    """
    enrollment = int(district_info.get("enrollment") or 0)
    entitlement = district_info.get("entitlement_amount") or 0
    dod_fresh = district_info.get("dod_fresh_amount") or 0
    num_schools = int(district_info.get("num_schools") or 0)
    ce_id_raw = str(district_info.get("ce_id", ""))
    ce_id = ce_id_raw.replace(".0", "") if ce_id_raw.endswith(".0") else ce_id_raw

    return {
        # Pre-filled from xlsx data — user sees these on onboarding
        "districtName": district_info.get("ce_name", ""),
        "totalEnrollment": enrollment,
        "knownEnrollment": enrollment,  # Preserved for validation (totalEnrollment gets recalculated)
        "sites": f"{num_schools} schools",
        # Entitlement from real WBSCM data (replaces hardcoded $485K)
        "entitlementAmount": entitlement,
        "dodFreshAmount": dod_fresh,
        "totalOrdered": district_info.get("total_ordered") or 0,
        # District metadata
        "ceId": ce_id,
        "county": district_info.get("county", ""),
        "soldToParty": district_info.get("sold_to_party", ""),
        # Pre-filled from Master District List grade columns
        "gradeLevels": district_info.get("grade_bands", []),
        "enrollmentByGrade": {},
        "servingDays": 180,
        "participationRate": "",
        "demographics": {"freeRate": "", "reducedRate": "", "paidRate": ""},
        "adpByGrade": {},
        "totalAdp": 0,
        "totalAnnualMeals": 0,
        "foodCostPercentage": "",
        "commodityValuePerMeal": 0.45,
        "equipment": [],
        "allergens": [],
    }


def create_auth_accounts(emails, lookup, db):
    """Create Firebase Auth accounts and pre-populate districtProfile in Firestore.

    Writes to users/{uid}.districtProfile — the same path the app reads from
    via hydrateFromFirestore(). This means on first login the user sees their
    district name and entitlement pre-filled.
    """
    created = 0
    skipped = 0
    errors = 0

    total = len(emails)
    print(f"\nCreating {total} Firebase Auth accounts...")
    print(
        f"Using shared password: {SHARED_PASSWORD[:3]}{'*' * (len(SHARED_PASSWORD) - 3)}"
    )

    for i, email in enumerate(emails):
        if (i + 1) % 100 == 0:
            print(
                f"  Progress: {i + 1}/{total} (created={created}, skipped={skipped}, errors={errors})"
            )

        district_info = lookup.get(email, {})
        profile = build_district_profile(district_info) if district_info else None

        try:
            # Check if user already exists
            try:
                existing = auth.get_user_by_email(email)
                skipped += 1

                # Still update district profile in Firestore (in case data changed)
                if profile:
                    db.collection("users").document(existing.uid).set(
                        {
                            "districtProfile": profile,
                            "userEmail": email,
                        },
                        merge=True,
                    )

                continue
            except auth.UserNotFoundError:
                pass  # User doesn't exist, create it

            # Create the account
            user = auth.create_user(
                email=email,
                password=SHARED_PASSWORD,
                email_verified=True,
            )
            created += 1

            # Write pre-populated districtProfile to users/{uid}
            if profile:
                db.collection("users").document(user.uid).set(
                    {
                        "districtProfile": profile,
                        "userEmail": email,
                    }
                )

        except Exception as e:
            errors += 1
            print(f"  ERROR creating {email}: {e}")

            # Rate limiting — Firebase Auth has limits
            if "QUOTA" in str(e).upper() or "rate" in str(e).lower():
                print("  Rate limited, waiting 60 seconds...")
                time.sleep(60)

    print("\n=== RESULTS ===")
    print(f"Total emails: {total}")
    print(f"Created: {created}")
    print(f"Skipped (already exist): {skipped}")
    print(f"Errors: {errors}")


def main():
    print("=" * 60)
    print("CREATING FIREBASE AUTH ACCOUNTS FOR DISTRICT USERS")
    print(f"Project: {PROJECT_ID}")
    print("=" * 60)

    # Initialize
    db = init_firebase()
    emails, lookup = load_data()

    print(f"Loaded {len(emails)} emails and {len(lookup)} district lookups")

    # Confirm before proceeding (skip with --yes flag)
    print(f"\nThis will create up to {len(emails)} Firebase Auth accounts.")
    if "--yes" not in sys.argv:
        response = input("Continue? (y/n): ").strip().lower()
        if response != "y":
            print("Aborted.")
            return

    # Create accounts
    create_auth_accounts(emails, lookup, db)

    print("\nDone! Users can now sign in with their email and the shared password.")


if __name__ == "__main__":
    main()
