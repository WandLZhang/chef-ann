#!/usr/bin/env python3
"""
@file extract_usda_pdf_data.py
@brief Extracts comprehensive structured data from USDA Product Information Sheet PDFs.

@details Reads all PDFs from context/usda_info_sheets/, sends each to Gemini to extract
the complete product schema including:
- Full identity and USDA classification (category, subgroup)
- App-level grouping for frontend routing
- Complete CN crediting info (amount, unit, component, statement)
- Scratch cooking classification and additive detection
- Allergen information
- Full nutrition facts (calories, fat, sodium, fiber, sugar, protein)
- Pack size details and serving info

Outputs timestamped JSON to functions/data/ — does NOT overwrite previous versions.

@author Willis Zhang
@date 2026-03-10
"""

import os
import json
import re
import time
import logging
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables from .env file
load_dotenv(Path(__file__).parent.parent / ".env")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
MODEL = "gemini-3.1-pro-preview"
PDF_DIR = Path(__file__).parent.parent / "context" / "usda_info_sheets"
OUTPUT_DIR = Path(__file__).parent.parent / "functions" / "data"
URL_MAPPING_FILE = Path(__file__).parent.parent / "context" / "usda_pdf_url_mapping.txt"
USDA_BASE_URL = "https://www.fns.usda.gov"

# ============================================================================
# EXTRACTION PROMPT — The one prompt that extracts everything from each PDF.
#
# This prompt is designed to capture every field available in USDA Product
# Information Sheets, with explicit guidance for tricky fields like CN credits
# (which use different units for different categories), scratch cooking
# classification (CAF definition, not just "raw vs processed"), and allergens.
# ============================================================================
EXTRACTION_PROMPT = """Analyze this USDA Product Information Sheet PDF and extract ALL data into the JSON schema below.
Return ONLY valid JSON with no markdown formatting, no code blocks, just the raw JSON object.

IMPORTANT INSTRUCTIONS:
- Extract exactly what the PDF says. Do not invent data.
- For numeric fields, return the number only (no units in the value).
- If a field cannot be determined from the PDF, use null.
- For the CN crediting section, pay very careful attention to the exact credit amount, unit, and component.

{
  "wbscm_id": "<6-digit ID from the title line, e.g., '100158'>",
  "description": "<full product name from title, e.g., 'Beef, Fine Ground, 85/15, Raw, Frozen'>",

  "usda_category": "<exact Category line from PDF, e.g., 'Meat/Meat Alternate', 'Fruit', 'Vegetables', 'Grains (Whole Grain)'>",
  "usda_subgroup": "<exact Subgroup line if present, e.g., 'Dark Green', 'Red/Orange', 'Starchy', 'Beans/Peas', 'Other'. null if no Subgroup line exists>",

  "app_category": "<one of: beef, poultry, pork, fish, cheese, beans, dairy, eggs, vegetables, fruits, grains, other. Rules: all beef products→'beef', chicken/turkey→'poultry', pork/ham→'pork', fish/salmon/pollock/catfish→'fish', cheese/mozzarella/cheddar→'cheese', yogurt→'dairy', eggs→'eggs', beans/pinto/kidney/garbanzo/black bean/refried/chickpea→'beans', peanut butter/sunflower butter→'beans', vegetables/tomato/potato/corn/pea/carrot/broccoli/spinach/pepper/onion/salsa/sweet potato→'vegetables', fruits/apple/orange/peach/pear/berry/cherry/raisin/cranberry/apricot/applesauce/juice→'fruits', pasta/rice/oat/flour/tortilla/pancake/oil→'grains', anything else→'other'>",

  "case_weight_lbs": "<numeric weight per case in lbs. Extract from Product Description or pack info. null if not stated as a weight>",
  "pack_size_description": "<full pack description from Product Description, e.g., 'four 10-pound vacuum-sealed packages', '6/#10 cans', 'eight 3-pound packages'>",
  "items_per_case": "<numeric count of individual items per case if applicable, e.g., 225 for patties, 100-150 for fresh apples. null if not countable>",

  "servings_per_case": "<numeric total servings per case from Crediting/Yield section, e.g., 478>",
  "serving_size": "<numeric serving size amount, e.g., 1.34 or 0.5>",
  "serving_size_unit": "<unit of serving size: 'oz', 'cup', 'tbsp', 'each', 'patty'. Use what the PDF states>",

  "cn_credit_amount": "<numeric CN credit amount per serving. e.g., 1.0 for '1 ounce equivalent', 0.5 for '1/2 cup fruit'>",
  "cn_credit_unit": "<unit of CN credit: 'oz_eq' for ounce equivalents (meats, grains), 'cup' for fruits/vegetables>",
  "cn_credit_component": "<USDA meal component this credits toward. One of: 'meat_alternate', 'grain', 'fruit', 'dark_green_veg', 'red_orange_veg', 'starchy_veg', 'beans_peas_veg', 'other_veg'. For vegetables, use the specific subgroup from the CN Crediting statement. For fruits, use 'fruit'. For meats/cheese/eggs/yogurt/beans/peanut butter, use 'meat_alternate'. For grains, use 'grain'>",
  "cn_credit_statement": "<full CN Crediting sentence verbatim from the PDF, e.g., 'One 1.34-ounce portion of 85/15 raw ground beef credits as 1 ounce equivalent meat/meat alternate'>",

  "is_scratch_cooking": "<true if this product is suitable for scratch cooking (Chef Ann Foundation definition). true for: whole/raw meats (ground beef, roasts, cut-up chicken, raw patties WITHOUT soy/SPP), whole frozen fruits and vegetables (IQF, no sauce, no syrup, plain frozen), fresh fruits, plain grains (rice, oats, flour, plain pasta), cheese (blocks, shredded, sliced), raw eggs, plain beans (canned or dried, no refried). false for: pre-cooked/formed items (cooked patties, crumbles, pulled/cooked meat, chicken strips, fillet-style), items containing SPP/TVP/soy protein, items in syrup, fries, pancakes, applesauce, juice, refried beans, sauces, salsa, oil>",
  "has_additives": "<true if product contains SPP, TVP, soy protein product, or other filler ingredients mentioned in the Product Description or title. false otherwise>",
  "additive_list": "<array of additive codes found, e.g., ['SPP'] or ['TVP']. Empty array [] if none>",
  "product_form": "<one of: 'raw_whole', 'raw_ground', 'raw_patty', 'raw_roast', 'raw_cut', 'whole_frozen', 'sliced', 'diced', 'shredded', 'cooked_frozen', 'cooked_canned', 'canned', 'dried', 'fresh', 'juice', 'paste', 'sauce', 'spread', 'formed_patty', 'fries', 'cups'. Pick the most specific match>",
  "storage_state": "<one of: 'frozen', 'canned', 'shelf_stable', 'fresh', 'refrigerated'>",

  "allergens": "<array of specific allergens mentioned in the Allergen Information section. e.g., ['soy'], ['peanuts'], ['wheat', 'milk']. Use lowercase. Empty array [] if no specific allergens mentioned or if it says product does not contain major allergens>",
  "allergen_free": "<true if the Allergen Information section explicitly states 'not permitted to contain any of the 8 major allergens' or 'does not contain any of the 8 major allergens'. false otherwise>",

  "calories_per_serving": "<numeric calories from Nutrition Facts>",
  "total_fat_g": "<numeric total fat grams>",
  "saturated_fat_g": "<numeric saturated fat grams>",
  "trans_fat_g": "<numeric trans fat grams>",
  "cholesterol_mg": "<numeric cholesterol mg>",
  "sodium_mg": "<numeric sodium mg>",
  "total_carb_g": "<numeric total carbohydrate grams>",
  "dietary_fiber_g": "<numeric dietary fiber grams>",
  "sugars_g": "<numeric sugars grams>",
  "added_sugars_g": "<numeric added sugars grams. null if not listed>",
  "protein_g": "<numeric protein grams>",

  "pdf_date": "<date shown on the PDF, e.g., 'December 2024', 'February 2020'>",
  "culinary_tips": "<brief culinary tips text from the Culinary Tips section. Keep it concise, 1-2 sentences max>"
}
"""


def get_client():
    """Create Gemini client using API key from environment."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")
    return genai.Client(api_key=api_key)


def load_url_mapping() -> dict:
    """
    Load URL mapping from file and build WBSCM ID to full URL mapping.

    @return: Dict mapping WBSCM ID to full USDA URL
    """
    url_map = {}

    if not URL_MAPPING_FILE.exists():
        logger.warning(f"URL mapping file not found: {URL_MAPPING_FILE}")
        return url_map

    with open(URL_MAPPING_FILE, 'r') as f:
        for line in f:
            url_path = line.strip()
            if not url_path:
                continue

            # Extract WBSCM ID from the URL path (first 5-6 digits of filename)
            filename = url_path.split('/')[-1]
            match = re.match(r'^(\d{5,6})', filename)
            if match:
                wbscm_id = match.group(1)
                full_url = USDA_BASE_URL + url_path
                url_map[wbscm_id] = full_url

    logger.info(f"Loaded {len(url_map)} URL mappings")
    return url_map


def extract_wbscm_id_from_filename(filename: str) -> str:
    """Extract WBSCM ID from PDF filename."""
    match = re.match(r'^(\d{5,6})', filename)
    if match:
        return match.group(1)
    return None


def extract_data_from_pdf(client, pdf_path: Path) -> dict:
    """
    Send PDF to Gemini and extract structured data using the comprehensive schema.

    @param client: Gemini client
    @param pdf_path: Path to PDF file
    @return: Extracted data dictionary
    """
    try:
        # Upload file to Gemini using file path
        uploaded_file = client.files.upload(file=str(pdf_path))

        # Generate content with the PDF
        response = client.models.generate_content(
            model=MODEL,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_uri(
                            file_uri=uploaded_file.uri,
                            mime_type="application/pdf"
                        ),
                        types.Part.from_text(text=EXTRACTION_PROMPT)
                    ]
                )
            ]
        )

        # Parse JSON from response
        response_text = response.text.strip()

        # Clean up response - remove markdown code blocks if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])

        data = json.loads(response_text)

        # Ensure wbscm_id is set from filename if not in response
        if not data.get("wbscm_id"):
            data["wbscm_id"] = extract_wbscm_id_from_filename(pdf_path.name)

        # Log the full extracted payload for debugging
        logger.info(f"  Extracted: {data.get('description', 'Unknown')} | "
                     f"app_cat={data.get('app_category')} | "
                     f"scratch={data.get('is_scratch_cooking')} | "
                     f"cn={data.get('cn_credit_amount')} {data.get('cn_credit_unit')} → {data.get('cn_credit_component')} | "
                     f"allergens={data.get('allergens')}")

        return data

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error for {pdf_path.name}: {e}")
        logger.error(f"Response was: {response_text[:500]}...")
        return {
            "wbscm_id": extract_wbscm_id_from_filename(pdf_path.name),
            "error": f"JSON parse error: {str(e)}",
            "raw_response": response_text[:500]
        }
    except Exception as e:
        logger.error(f"Error processing {pdf_path.name}: {e}")
        return {
            "wbscm_id": extract_wbscm_id_from_filename(pdf_path.name),
            "error": str(e)
        }


def main():
    """Main extraction function."""
    logger.info("=" * 70)
    logger.info("USDA Product Info Sheet Extraction v2 — Comprehensive Schema")
    logger.info("=" * 70)

    # Load URL mapping for source citations
    url_map = load_url_mapping()

    # Get all PDF files
    pdf_files = sorted(PDF_DIR.glob("*.pdf"))
    logger.info(f"Found {len(pdf_files)} PDF files in {PDF_DIR}")

    # Initialize client
    client = get_client()

    # Process each PDF
    results = []
    errors = []

    for i, pdf_path in enumerate(pdf_files):
        logger.info(f"[{i+1}/{len(pdf_files)}] Processing: {pdf_path.name}")

        data = extract_data_from_pdf(client, pdf_path)

        if data.get("error"):
            errors.append({"file": pdf_path.name, "error": data.get("error")})
            logger.error(f"  ❌ FAILED: {data.get('error')}")
        else:
            # Add source URL for citation
            wbscm_id = data.get("wbscm_id")
            if wbscm_id and wbscm_id in url_map:
                data["source_url"] = url_map[wbscm_id]
            else:
                data["source_url"] = None
                logger.warning(f"  No URL mapping found for WBSCM ID: {wbscm_id}")

            # Add extraction timestamp per product
            data["extraction_timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%S")

            results.append(data)

        # Rate limiting — 1 second delay between requests
        if i < len(pdf_files) - 1:
            time.sleep(1)

    # Organize results by app_category
    organized = {}
    for item in results:
        category = item.get("app_category", "other")
        if category not in organized:
            organized[category] = []
        organized[category].append(item)

    # Build timestamped output filename
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    output_file = OUTPUT_DIR / f"usda_foods_v2_{timestamp}.json"

    # Also write to the canonical name that the backend reads
    canonical_file = OUTPUT_DIR / "usda_foods_comprehensive.json"

    # Output comprehensive JSON
    output = {
        "metadata": {
            "source": "USDA FNS Product Information Sheets",
            "url": "https://www.fns.usda.gov/usda-fis/product-information-sheets",
            "extracted_date": time.strftime("%Y-%m-%d"),
            "extraction_version": "v2",
            "schema_version": "2.0",
            "model_used": MODEL,
            "total_products": len(results),
            "total_errors": len(errors),
            "categories": {cat: len(items) for cat, items in organized.items()}
        },
        "products_by_category": organized,
        "all_products": results,
        "extraction_errors": errors
    }

    # Write timestamped version (archive)
    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2)
    logger.info(f"✅ Timestamped output written to {output_file}")

    # Write canonical version (what the backend reads)
    with open(canonical_file, 'w') as f:
        json.dump(output, f, indent=2)
    logger.info(f"✅ Canonical output written to {canonical_file}")

    # Summary
    logger.info("")
    logger.info("=" * 70)
    logger.info(f"EXTRACTION COMPLETE: {len(results)} products, {len(errors)} errors")
    logger.info("=" * 70)
    logger.info("Products by app_category:")
    for cat, items in sorted(organized.items()):
        logger.info(f"  {cat}: {len(items)}")

    # Data quality report
    logger.info("")
    logger.info("DATA QUALITY REPORT:")
    quality_fields = [
        'cn_credit_amount', 'cn_credit_unit', 'cn_credit_component', 'cn_credit_statement',
        'is_scratch_cooking', 'has_additives', 'usda_subgroup',
        'allergens', 'sodium_mg', 'dietary_fiber_g',
        'case_weight_lbs', 'servings_per_case'
    ]
    for field in quality_fields:
        non_null = sum(1 for p in results if p.get(field) is not None)
        logger.info(f"  {field}: {non_null}/{len(results)} have values")

    if errors:
        logger.warning("")
        logger.warning(f"ERRORS ({len(errors)}):")
        for err in errors:
            logger.warning(f"  {err['file']}: {err['error']}")


if __name__ == "__main__":
    main()
