import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'regional_manager' | 'district_manager' | 'facility_manager' | 'inventory_worker';
  phone?: string;
  facilityId?: string;
  facilityName?: string;
  region?: string;
  district?: string;
}

// Demo accounts configuration
export const DEMO_ACCOUNTS = [
  {
    email: 'admin@ims.com',
    password: 'admin123',
    displayName: 'System Administrator',
    role: 'admin' as const,
    phone: '+256700000001'
  },
  {
    email: 'regional@ims.com',
    password: 'regional123',
    displayName: 'Regional Manager',
    role: 'regional_manager' as const,
    phone: '+256700000002',
    region: 'Central Region'
  },
  {
    email: 'district@ims.com',
    password: 'district123',
    displayName: 'District Manager',
    role: 'district_manager' as const,
    phone: '+256700000003',
    district: 'Kampala District'
  },
  {
    email: 'facility@ims.com',
    password: 'facility123',
    displayName: 'Facility Manager',
    role: 'facility_manager' as const,
    phone: '+256700000004',
    facilityId: '1',
    facilityName: 'Main Warehouse'
  },
  {
    email: 'worker@ims.com',
    password: 'worker123',
    displayName: 'Inventory Worker',
    role: 'inventory_worker' as const,
    phone: '+256700000005',
    facilityId: '2',
    facilityName: 'Distribution Center'
  }
];

export class FirebaseAuthService {
  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Create new user with email and password
  static async signUp(email: string, password: string, displayName?: string, role?: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name if provided
      if (displayName && userCredential.user) {
        await userCredential.user.updateProfile({
          displayName
        });
      }

      // Create user document in Firestore with role
      if (userCredential.user) {
        await this.createUserDocument(userCredential.user.uid, {
          email: userCredential.user.email,
          displayName: displayName || userCredential.user.displayName,
          role: role || 'inventory_worker',
          createdAt: new Date().toISOString()
        });
      }
      
      return userCredential;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  // Create user document in Firestore
  static async createUserDocument(uid: string, userData: any): Promise<void> {
    try {
      await setDoc(doc(db, 'users', uid), {
        ...userData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }

  // Get user data from Firestore
  static async getUserData(uid: string): Promise<AuthUser | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid,
          email: data.email,
          displayName: data.displayName,
          role: data.role,
          phone: data.phone,
          facilityId: data.facilityId,
          facilityName: data.facilityName,
          region: data.region,
          district: data.district
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Update user data in Firestore
  static async updateUserData(uid: string, userData: Partial<AuthUser>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...userData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  // Setup demo accounts
  static async setupDemoAccounts(): Promise<void> {
    try {
      console.log('Setting up demo accounts...');
      
      for (const account of DEMO_ACCOUNTS) {
        try {
          // Check if user already exists
          const userDoc = await getDoc(doc(db, 'users', account.email));
          
          if (!userDoc.exists()) {
            // Create user document
            await setDoc(doc(db, 'users', account.email), {
              email: account.email,
              displayName: account.displayName,
              role: account.role,
              phone: account.phone,
              facilityId: account.facilityId,
              facilityName: account.facilityName,
              region: account.region,
              district: account.district,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDemoAccount: true
            });
            
            console.log(`✅ Demo account created: ${account.email}`);
          } else {
            console.log(`ℹ️ Demo account already exists: ${account.email}`);
          }
        } catch (error) {
          console.error(`❌ Error creating demo account ${account.email}:`, error);
        }
      }
      
      console.log('Demo accounts setup completed');
    } catch (error) {
      console.error('Error setting up demo accounts:', error);
      throw error;
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  // Convert Firebase User to AuthUser with Firestore data
  static async convertToAuthUser(user: User): Promise<AuthUser> {
    try {
      const userData = await this.getUserData(user.uid);
      if (userData) {
        return userData;
      }
      
      // Fallback to basic user data
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: 'inventory_worker' // Default role
      };
    } catch (error) {
      console.error('Error converting to AuthUser:', error);
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: 'inventory_worker' // Default role
      };
    }
  }

  // Get demo account credentials
  static getDemoAccounts(): typeof DEMO_ACCOUNTS {
    return DEMO_ACCOUNTS;
  }
} 