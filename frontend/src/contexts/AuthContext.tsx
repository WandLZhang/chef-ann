/**
 * @file AuthContext.tsx
 * @brief Authentication context providing user state and auth methods to the entire app.
 *
 * @details Uses Firebase Auth with email/password sign-in. On login, hydrates
 * localStorage from Firestore so the user's saved data is immediately available.
 * On logout, clears localStorage so the next user gets a clean slate.
 *
 * Approved users are checked against a hardcoded allowlist.
 *
 * @author Willis Zhang
 * @date 2026-03-10
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { hydrateFromFirestore } from '@/lib/firestore';

/** Approved user emails — only these accounts can log in */
const APPROVED_USERS = [
  'williszhang@google.com',
  'ngoren@google.com',
  'lori.nelson@chefannfoundation.org',
];

interface AuthContextType {
  /** The currently authenticated Firebase user, or null */
  user: User | null;
  /** True while Firebase is initializing auth state */
  loading: boolean;
  /** True if the user is authenticated (not anonymous) */
  isAuthenticated: boolean;
  /** True if the user has existing data in Firestore (skip onboarding) */
  hasExistingData: boolean;
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<void>;
  /** Sign out and clear local data */
  signOut: () => Promise<void>;
  /** Error message from the last sign-in attempt */
  authError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  hasExistingData: false,
  signIn: async () => {},
  signOut: async () => {},
  authError: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    console.log('[auth] Setting up onAuthStateChanged listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[auth] Auth state changed:', firebaseUser?.email || 'no user');

      if (firebaseUser && firebaseUser.email) {
        setUser(firebaseUser);
        setIsAuthenticated(true);

        // Hydrate localStorage from Firestore
        const hasData = await hydrateFromFirestore(firebaseUser.uid);
        setHasExistingData(hasData);
        console.log('[auth] User has existing data:', hasData);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setHasExistingData(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * @brief Sign in with email and password.
   *
   * @details Validates that the email is in the approved users list before
   * attempting Firebase Auth sign-in.
   *
   * @param email The user's email address.
   * @param password The shared password.
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    setAuthError(null);
    console.log('[auth] Sign-in attempt for:', email);

    // Check if user is approved
    const normalizedEmail = email.toLowerCase().trim();
    if (!APPROVED_USERS.includes(normalizedEmail)) {
      const error = 'This email is not authorized. Please contact your administrator.';
      console.log('[auth] Rejected — email not in approved list:', normalizedEmail);
      setAuthError(error);
      throw new Error(error);
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      console.log('[auth] Sign-in successful for:', credential.user.email);
      console.log('[auth] User UID:', credential.user.uid);
    } catch (err: unknown) {
      let message = 'Sign-in failed. Please check your credentials.';
      if (err instanceof Error) {
        console.error('[auth] Sign-in error:', err.message);
        if (err.message.includes('user-not-found') || err.message.includes('invalid-credential')) {
          message = 'Account not found. Please contact your administrator.';
        } else if (err.message.includes('wrong-password')) {
          message = 'Incorrect password. Please try again.';
        } else if (err.message.includes('too-many-requests')) {
          message = 'Too many failed attempts. Please try again later.';
        }
      }
      setAuthError(message);
      throw new Error(message);
    }
  };

  /**
   * @brief Sign out and clear local cached data.
   */
  const signOut = async (): Promise<void> => {
    console.log('[auth] Signing out user:', user?.email);

    // Clear localStorage so next user gets clean slate
    localStorage.removeItem('districtProfile');
    localStorage.removeItem('commodityAllocations');

    await firebaseSignOut(auth);
    console.log('[auth] Sign-out complete');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        hasExistingData,
        signIn,
        signOut,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * @brief Hook to access auth state from any component.
 * @return The AuthContextType with user, loading, signIn, signOut, etc.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
