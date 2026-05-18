/**
 * @file AuthContext.tsx
 * @brief Authentication context providing user state and auth methods to the entire app.
 *
 * Open registration: anyone can create an account with email + password.
 * Pre-provisioned TX accounts continue to work alongside self-registered users.
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { hydrateFromFirestore } from '@/lib/firestore';

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
  /** Create a new account with email and password */
  signUp: (email: string, password: string) => Promise<void>;
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
  signUp: async () => {},
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

  const signIn = async (email: string, password: string): Promise<void> => {
    setAuthError(null);
    const normalizedEmail = email.toLowerCase().trim();
    console.log('[auth] Sign-in attempt for:', normalizedEmail);

    try {
      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      console.log('[auth] Sign-in successful for:', credential.user.email);
      console.log('[auth] User UID:', credential.user.uid);
    } catch (err: unknown) {
      let message = 'Sign-in failed. Please check your credentials.';
      if (err instanceof Error) {
        console.error('[auth] Sign-in error:', err.message);
        if (err.message.includes('user-not-found') || err.message.includes('invalid-credential')) {
          message = 'No account found with that email. Try creating one instead.';
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

  const signUp = async (email: string, password: string): Promise<void> => {
    setAuthError(null);
    const normalizedEmail = email.toLowerCase().trim();
    console.log('[auth] Sign-up attempt for:', normalizedEmail);

    try {
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      console.log('[auth] Sign-up successful for:', credential.user.email);
      console.log('[auth] New user UID:', credential.user.uid);
    } catch (err: unknown) {
      let message = 'Could not create account. Please try again.';
      if (err instanceof Error) {
        console.error('[auth] Sign-up error:', err.message);
        if (err.message.includes('email-already-in-use')) {
          message = 'An account with that email already exists. Try signing in instead.';
        } else if (err.message.includes('weak-password')) {
          message = 'Password is too weak. Use at least 6 characters.';
        } else if (err.message.includes('invalid-email')) {
          message = 'That email address is not valid.';
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
        signUp,
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
