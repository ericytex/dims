import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { FirebaseAuthService, AuthUser, DEMO_ACCOUNTS } from '../services/firebaseAuth';

interface FirebaseAuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string, role?: string) => Promise<void>;
  signOut: () => Promise<void>;
  setupDemoAccounts: () => Promise<void>;
  isAuthenticated: boolean;
  demoAccounts: typeof DEMO_ACCOUNTS;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export const FirebaseAuthProvider = ({ children }: { children: ReactNode }) => {
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

  // Compatibility functions for existing code
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signIn(email, password);
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    signOut();
  };

  const value: FirebaseAuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    setupDemoAccounts,
    isAuthenticated: !!user,
    demoAccounts: DEMO_ACCOUNTS,
    login,
    logout
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}; 