/**
 * @file firestore.ts
 * @brief Firestore persistence layer for per-user data (district profile & allocations).
 *
 * @details Provides save/load functions that write to Firestore keyed by the
 * authenticated user's UID. Also syncs to localStorage as a fast cache layer
 * so existing page code can continue reading from localStorage without changes.
 *
 * @author Willis Zhang
 * @date 2026-03-10
 */

import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * @brief Save the district profile to Firestore and localStorage.
 *
 * @param userId The Firebase Auth UID of the current user.
 * @param profile The district profile object from onboarding.
 */
export async function saveDistrictProfile(userId: string, profile: Record<string, unknown>): Promise<void> {
  console.log('[firestore] saveDistrictProfile called for user:', userId);
  console.log('[firestore] profile payload:', JSON.stringify(profile));

  // Write to localStorage for fast local reads
  localStorage.setItem('districtProfile', JSON.stringify(profile));

  // Write to Firestore
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    districtProfile: profile,
    lastUpdated: serverTimestamp(),
  }, { merge: true });

  console.log('[firestore] districtProfile saved successfully');
}

/**
 * @brief Load the district profile from Firestore (falls back to localStorage).
 *
 * @param userId The Firebase Auth UID of the current user.
 * @return The district profile object, or null if none exists.
 */
export async function loadDistrictProfile(userId: string): Promise<Record<string, unknown> | null> {
  console.log('[firestore] loadDistrictProfile called for user:', userId);

  try {
    const userRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists() && snapshot.data()?.districtProfile) {
      const profile = snapshot.data().districtProfile;
      console.log('[firestore] loaded districtProfile from Firestore:', JSON.stringify(profile));

      // Sync to localStorage for fast access by other pages
      localStorage.setItem('districtProfile', JSON.stringify(profile));
      return profile;
    }
  } catch (err) {
    console.error('[firestore] Error loading districtProfile from Firestore:', err);
  }

  // Fallback to localStorage
  const local = localStorage.getItem('districtProfile');
  if (local) {
    console.log('[firestore] falling back to localStorage for districtProfile');
    return JSON.parse(local);
  }

  console.log('[firestore] no districtProfile found');
  return null;
}

/**
 * @brief Save commodity allocations to Firestore and localStorage.
 *
 * @param userId The Firebase Auth UID of the current user.
 * @param allocations The commodity allocations object.
 */
export async function saveAllocations(userId: string, allocations: Record<string, unknown>): Promise<void> {
  console.log('[firestore] saveAllocations called for user:', userId);
  console.log('[firestore] allocations payload size:', JSON.stringify(allocations).length, 'bytes');

  // Write to localStorage for fast local reads
  localStorage.setItem('commodityAllocations', JSON.stringify(allocations));

  // Write to Firestore
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    allocations: allocations,
    lastUpdated: serverTimestamp(),
  }, { merge: true });

  console.log('[firestore] allocations saved successfully');
}

/**
 * @brief Load commodity allocations from Firestore (falls back to localStorage).
 *
 * @param userId The Firebase Auth UID of the current user.
 * @return The allocations object, or null if none exists.
 */
export async function loadAllocations(userId: string): Promise<Record<string, unknown> | null> {
  console.log('[firestore] loadAllocations called for user:', userId);

  try {
    const userRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists() && snapshot.data()?.allocations) {
      const allocations = snapshot.data().allocations;
      console.log('[firestore] loaded allocations from Firestore, size:', JSON.stringify(allocations).length, 'bytes');

      // Sync to localStorage for fast access by other pages
      localStorage.setItem('commodityAllocations', JSON.stringify(allocations));
      return allocations;
    }
  } catch (err) {
    console.error('[firestore] Error loading allocations from Firestore:', err);
  }

  // Fallback to localStorage
  const local = localStorage.getItem('commodityAllocations');
  if (local) {
    console.log('[firestore] falling back to localStorage for allocations');
    return JSON.parse(local);
  }

  console.log('[firestore] no allocations found');
  return null;
}

/**
 * @brief Hydrate localStorage from Firestore on login.
 *
 * @details Called after successful authentication to pull the user's saved data
 * from Firestore and populate localStorage so all existing pages work seamlessly.
 *
 * @param userId The Firebase Auth UID of the current user.
 * @return True if user has existing data (should skip onboarding).
 */
export async function hydrateFromFirestore(userId: string): Promise<boolean> {
  console.log('[firestore] hydrateFromFirestore called for user:', userId);

  let hasData = false;

  try {
    const userRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      const data = snapshot.data();

      if (data.districtProfile) {
        localStorage.setItem('districtProfile', JSON.stringify(data.districtProfile));
        hasData = true;
        console.log('[firestore] hydrated districtProfile to localStorage');
      }

      if (data.allocations) {
        localStorage.setItem('commodityAllocations', JSON.stringify(data.allocations));
        console.log('[firestore] hydrated allocations to localStorage');
      }
    }
  } catch (err) {
    console.error('[firestore] Error during hydration:', err);
  }

  return hasData;
}
