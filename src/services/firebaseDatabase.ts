import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface User {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  facilityName?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  region?: string;
  district?: string;
  password?: string;
  isFirstLogin?: boolean;
  tempPassword?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface InventoryItem {
  id?: string;
  name: string;
  description?: string;
  category: string;
  sku: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  cost: number;
  supplier?: string;
  facilityId?: string;
  location?: string;
  expiryDate?: string;
  status: 'active' | 'inactive' | 'discontinued';
  createdAt?: any;
  updatedAt?: any;
}

export interface StockTransaction {
  id?: string;
  itemId: string;
  facilityId: string;
  type: 'stock_in' | 'stock_out' | 'transfer' | 'adjustment';
  quantity: number;
  unit: string;
  source?: string;
  destination?: string;
  reason: string;
  notes?: string;
  userId: string;
  transactionDate: string;
  createdAt?: any;
}

export interface Facility {
  id?: string;
  name: string;
  type: 'warehouse' | 'distribution_center' | 'retail_outlet';
  region: string;
  district: string;
  address?: string;
  gpsCoordinates?: string;
  contactPerson?: string;
  contactPhone?: string;
  status: 'active' | 'inactive';
  createdAt?: any;
  updatedAt?: any;
}

export interface Transfer {
  id?: string;
  itemId: string;
  quantity: number;
  unit: string;
  fromFacilityId: string;
  toFacilityId: string;
  requestedBy: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_transit' | 'delivered' | 'cancelled';
  approvedBy?: string;
  approvalDate?: string;
  deliveryDate?: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  trackingNumber?: string;
  createdAt?: any;
  updatedAt?: any;
}

export class FirebaseDatabaseService {
  // User Management Methods
  static async getUsers(): Promise<User[]> {
    return this.getCollection<User>('users');
  }

  static async getUser(id: string): Promise<User | null> {
    return this.getDocument<User>('users', id);
  }

  static async addUser(user: Omit<User, 'id'>): Promise<string> {
    return this.addDocument<User>('users', user);
  }

  static async updateUser(id: string, user: Partial<User>): Promise<void> {
    return this.updateDocument<User>('users', id, user);
  }

  static async deleteUser(id: string): Promise<void> {
    return this.deleteDocument('users', id);
  }

  static onUsersChange(callback: (users: User[]) => void): () => void {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      callback(users);
    });

    return unsubscribe;
  }

  static async searchUsers(searchTerm: string): Promise<User[]> {
    try {
      const users = await this.getUsers();
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      return users.filter(user => 
        user.name.toLowerCase().includes(lowerSearchTerm) ||
        user.email.toLowerCase().includes(lowerSearchTerm) ||
        user.phone.toLowerCase().includes(lowerSearchTerm) ||
        user.role.toLowerCase().includes(lowerSearchTerm)
      );
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Generic CRUD operations
  static async getCollection<T>(collectionName: string): Promise<T[]> {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error(`Error getting ${collectionName}:`, error);
      throw error;
    }
  }

  static async getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting document ${docId} from ${collectionName}:`, error);
      throw error;
    }
  }

  static async addDocument<T>(collectionName: string, data: Omit<T, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

  static async updateDocument<T>(collectionName: string, docId: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(`Error updating document ${docId} in ${collectionName}:`, error);
      throw error;
    }
  }

  static async deleteDocument(collectionName: string, docId: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document ${docId} from ${collectionName}:`, error);
      throw error;
    }
  }

  // Inventory Items
  static async getInventoryItems(): Promise<InventoryItem[]> {
    return this.getCollection<InventoryItem>('inventory_items');
  }

  static async getInventoryItem(id: string): Promise<InventoryItem | null> {
    return this.getDocument<InventoryItem>('inventory_items', id);
  }

  static async addInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<string> {
    return this.addDocument<InventoryItem>('inventory_items', item);
  }

  static async updateInventoryItem(id: string, item: Partial<InventoryItem>): Promise<void> {
    return this.updateDocument<InventoryItem>('inventory_items', id, item);
  }

  static async deleteInventoryItem(id: string): Promise<void> {
    return this.deleteDocument('inventory_items', id);
  }

  // Stock Transactions
  static async getStockTransactions(): Promise<StockTransaction[]> {
    return this.getCollection<StockTransaction>('stock_transactions');
  }

  static async getStockTransaction(id: string): Promise<StockTransaction | null> {
    return this.getDocument<StockTransaction>('stock_transactions', id);
  }

  static async addStockTransaction(transaction: Omit<StockTransaction, 'id'>): Promise<string> {
    return this.addDocument<StockTransaction>('stock_transactions', transaction);
  }

  static async updateStockTransaction(id: string, transaction: Partial<StockTransaction>): Promise<void> {
    return this.updateDocument<StockTransaction>('stock_transactions', id, transaction);
  }

  // Facilities
  static async getFacilities(): Promise<Facility[]> {
    return this.getCollection<Facility>('facilities');
  }

  static async getFacility(id: string): Promise<Facility | null> {
    return this.getDocument<Facility>('facilities', id);
  }

  static async addFacility(facility: Omit<Facility, 'id'>): Promise<string> {
    return this.addDocument<Facility>('facilities', facility);
  }

  static async updateFacility(id: string, facility: Partial<Facility>): Promise<void> {
    return this.updateDocument<Facility>('facilities', id, facility);
  }

  static async deleteFacility(id: string): Promise<void> {
    return this.deleteDocument('facilities', id);
  }

  // Transfers
  static async getTransfers(): Promise<Transfer[]> {
    return this.getCollection<Transfer>('transfers');
  }

  static async getTransfer(id: string): Promise<Transfer | null> {
    return this.getDocument<Transfer>('transfers', id);
  }

  static async addTransfer(transfer: Omit<Transfer, 'id'>): Promise<string> {
    return this.addDocument<Transfer>('transfers', transfer);
  }

  static async updateTransfer(id: string, transfer: Partial<Transfer>): Promise<void> {
    return this.updateDocument<Transfer>('transfers', id, transfer);
  }

  // Real-time listeners
  static onInventoryItemsChange(callback: (items: InventoryItem[]) => void): () => void {
    return onSnapshot(collection(db, 'inventory_items'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryItem[];
      callback(items);
    });
  }

  static onStockTransactionsChange(callback: (transactions: StockTransaction[]) => void): () => void {
    return onSnapshot(collection(db, 'stock_transactions'), (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockTransaction[];
      callback(transactions);
    });
  }

  // Batch operations
  static async batchUpdate(updates: Array<{ collection: string; id: string; data: any }>): Promise<void> {
    const batch = writeBatch(db);
    
    updates.forEach(({ collection: collectionName, id, data }) => {
      const docRef = doc(db, collectionName, id);
      batch.update(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
  }

  // Search and filtering
  static async searchInventoryItems(searchTerm: string): Promise<InventoryItem[]> {
    try {
      const q = query(
        collection(db, 'inventory_items'),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryItem[];
    } catch (error) {
      console.error('Error searching inventory items:', error);
      throw error;
    }
  }

  static async getLowStockItems(): Promise<InventoryItem[]> {
    try {
      const q = query(
        collection(db, 'inventory_items'),
        where('status', '==', 'active')
      );
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryItem[];
      
      // Filter for low stock items
      return items.filter(item => item.currentStock <= item.minStock);
    } catch (error) {
      console.error('Error getting low stock items:', error);
      throw error;
    }
  }
} 