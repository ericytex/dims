import { useState, useEffect } from 'react';
import { FirebaseAuthService, AuthUser, DEMO_ACCOUNTS } from '../services/firebaseAuth';

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = FirebaseAuthService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const authUser = await FirebaseAuthService.convertToAuthUser(firebaseUser);
          setUser(authUser);
        } catch (error) {
          console.error('Error converting user:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await FirebaseAuthService.signIn(email, password);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string, role?: string) => {
    try {
      setError(null);
      setLoading(true);
      await FirebaseAuthService.signUp(email, password, displayName, role);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setLoading(true);
      await FirebaseAuthService.signOut();
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const setupDemoAccounts = async () => {
    try {
      setError(null);
      setLoading(true);
      await FirebaseAuthService.setupDemoAccounts();
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    setupDemoAccounts,
    isAuthenticated: !!user,
    demoAccounts: DEMO_ACCOUNTS
  };
}; 