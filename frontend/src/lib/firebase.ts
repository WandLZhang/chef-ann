/**
 * @file firebase.ts
 * @brief Firebase initialization and configuration for the Chef Ann Commodity Planner.
 *
 * @details Initializes the Firebase app, Auth, and Firestore services using
 * the wz-chef-ann project configuration. Exports initialized service instances
 * for use throughout the application.
 *
 * @author Willis Zhang
 * @date 2026-03-10
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBhS0Y5y4afNxrGVEg4L26qDqOw0UShNq0",
  authDomain: "wz-chef-ann.firebaseapp.com",
  projectId: "wz-chef-ann",
  storageBucket: "wz-chef-ann.firebasestorage.app",
  messagingSenderId: "1087454707032",
  appId: "1:1087454707032:web:d1e7090da7120fd605792d",
};

// Prevent re-initialization during hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
