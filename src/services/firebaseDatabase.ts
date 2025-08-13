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
    try {
      // First try with ordering by createdAt
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const users = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        callback(users);
      }, (error) => {
        console.error('Error in users listener with createdAt ordering:', error);
        // If ordering by createdAt fails, try without ordering
        const q2 = query(collection(db, 'users'));
        const unsubscribe2 = onSnapshot(q2, (querySnapshot) => {
          const users = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as User[];
          callback(users);
        }, (error2) => {
          console.error('Error in users listener without ordering:', error2);
          callback([]);
        });
        return unsubscribe2;
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up users listener:', error);
      // Return a no-op function if setup fails
      return () => {};
    }
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

  // Sync Firebase Auth users to Firestore
  static async syncAuthUsersToFirestore(): Promise<void> {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      
      console.log('Syncing auth users to Firestore...');
      
      // Get current user from auth
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Check if user already exists in Firestore
        const existingUser = await this.getUser(currentUser.uid);
        if (!existingUser) {
          // Create user in Firestore
          await this.addUser({
            name: currentUser.displayName || 'Admin User',
            email: currentUser.email || '',
            phone: '',
            role: 'admin',
            status: 'active',
            isFirstLogin: false
          });
          console.log('Synced current user to Firestore');
        }
      }
    } catch (error) {
      console.error('Error syncing auth users:', error);
    }
  }

  // Sync all existing Firebase Auth users to Firestore
  static async syncAllAuthUsersToFirestore(): Promise<void> {
    try {
      console.log('Syncing all auth users to Firestore...');
      
      // Based on your Firebase Auth console, here are the actual users
      const authUsers = [
        {
          uid: 'KoFcXnoXfFQR...', // Replace with actual UID from console
          email: 'worker@ims.com',
          name: 'Village Health Worker',
          role: 'village_health_worker',
          status: 'active' as const
        },
        {
          uid: 'facility-uid', // Replace with actual UID from console
          email: 'facility@ims.com',
          name: 'Facility Manager',
          role: 'facility_manager',
          status: 'active' as const
        },
        {
          uid: 'district-uid', // Replace with actual UID from console
          email: 'district@ims.com',
          name: 'District Health Officer',
          role: 'district_health_officer',
          status: 'active' as const
        },
        {
          uid: 'regional-uid', // Replace with actual UID from console
          email: 'regional@ims.com',
          name: 'Regional Supervisor',
          role: 'regional_supervisor',
          status: 'active' as const
        },
        {
          uid: 'admin-uid', // Replace with actual UID from console
          email: 'admin@ims.com',
          name: 'System Administrator',
          role: 'admin',
          status: 'active' as const
        }
      ];

      for (const authUser of authUsers) {
        try {
          // Check if user already exists in Firestore by email
          const existingUsers = await this.getUsers();
          const existingUser = existingUsers.find(u => u.email === authUser.email);
          
          if (!existingUser) {
            // Create user in Firestore
            await this.addUser({
              name: authUser.name,
              email: authUser.email,
              phone: '',
              role: authUser.role,
              status: authUser.status,
              isFirstLogin: false
            });
            console.log(`Synced user ${authUser.email} to Firestore`);
          } else {
            console.log(`User ${authUser.email} already exists in Firestore`);
          }
        } catch (error) {
          console.error(`Error syncing user ${authUser.email}:`, error);
        }
      }
      
      console.log('Finished syncing all auth users to Firestore');
    } catch (error) {
      console.error('Error syncing all auth users:', error);
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
      console.log(`Adding document to ${collectionName}:`, data);
      
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`Document added successfully to ${collectionName} with ID:`, docRef.id);
      return docRef.id;
    } catch (error: any) {
      console.error(`Error adding document to ${collectionName}:`, error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
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

  // Inventory Items with Automatic Transaction Generation
  static async getInventoryItems(): Promise<InventoryItem[]> {
    return this.getCollection<InventoryItem>('inventory_items');
  }

  static async getInventoryItem(id: string): Promise<InventoryItem | null> {
    return this.getDocument<InventoryItem>('inventory_items', id);
  }

  static async addInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<string> {
    try {
      // Add the inventory item first
      const itemId = await this.addDocument<InventoryItem>('inventory_items', item);
      
      // Automatically create initial stock_in transaction
      if (item.currentStock > 0) {
        const initialTransaction: Omit<StockTransaction, 'id'> = {
          itemId: itemId,
          facilityId: item.facilityId || 'default-facility',
          type: 'stock_in',
          quantity: item.currentStock,
          unit: item.unit,
          source: 'Initial Setup',
          destination: '',
          reason: 'Initial inventory setup',
          notes: 'Automatically generated when item was added',
          userId: 'system',
          transactionDate: new Date().toISOString().split('T')[0]
        };
        
        await this.addDocument<StockTransaction>('transactions', initialTransaction);
      }
      
      return itemId;
    } catch (error) {
      console.error('Error adding inventory item with auto-transaction:', error);
      throw error;
    }
  }

  static async updateInventoryItem(id: string, item: Partial<InventoryItem>): Promise<void> {
    try {
      // Get the current item to compare quantities
      const currentItem = await this.getInventoryItem(id);
      if (!currentItem) {
        throw new Error('Inventory item not found');
      }
      
      // Update the inventory item
      await this.updateDocument<InventoryItem>('inventory_items', id, item);
      
      // If quantity changed, create adjustment transaction
      if (item.currentStock !== undefined && item.currentStock !== currentItem.currentStock) {
        const quantityChange = item.currentStock - currentItem.currentStock;
        const transactionType = quantityChange > 0 ? 'stock_in' : 'stock_out';
        
        const adjustmentTransaction: Omit<StockTransaction, 'id'> = {
          itemId: id,
          facilityId: item.facilityId || currentItem.facilityId || 'default-facility',
          type: transactionType,
          quantity: Math.abs(quantityChange),
          unit: item.unit || currentItem.unit,
          source: transactionType === 'stock_in' ? 'Manual Adjustment' : '',
          destination: transactionType === 'stock_out' ? 'Manual Adjustment' : '',
          reason: 'Quantity adjustment',
          notes: `Quantity changed from ${currentItem.currentStock} to ${item.currentStock} ${item.unit || currentItem.unit}`,
          userId: 'system',
          transactionDate: new Date().toISOString().split('T')[0]
        };
        
        await this.addDocument<StockTransaction>('transactions', adjustmentTransaction);
      }
    } catch (error) {
      console.error('Error updating inventory item with auto-transaction:', error);
      throw error;
    }
  }

  static async deleteInventoryItem(id: string): Promise<void> {
    try {
      // Get the current item before deletion
      const currentItem = await this.getInventoryItem(id);
      if (!currentItem) {
        throw new Error('Inventory item not found');
      }
      
      // If item has stock, create final stock_out transaction
      if (currentItem.currentStock > 0) {
        const finalTransaction: Omit<StockTransaction, 'id'> = {
          itemId: id,
          facilityId: currentItem.facilityId || 'default-facility',
          type: 'stock_out',
          quantity: currentItem.currentStock,
          unit: currentItem.unit,
          source: '',
          destination: 'Item Deletion',
          reason: 'Final stock removal - item deleted',
          notes: `Automatically generated when item ${currentItem.name} was deleted`,
          userId: 'system',
          transactionDate: new Date().toISOString().split('T')[0]
        };
        
        await this.addDocument<StockTransaction>('transactions', finalTransaction);
      }
      
      // Delete the inventory item
      await this.deleteDocument('inventory_items', id);
    } catch (error) {
      console.error('Error deleting inventory item with auto-transaction:', error);
      throw error;
    }
  }

  // Manual Stock Adjustment with Automatic Transaction Generation
  static async adjustInventoryStock(
    itemId: string, 
    newQuantity: number, 
    reason: string, 
    notes?: string,
    userId: string = 'system'
  ): Promise<void> {
    try {
      const currentItem = await this.getInventoryItem(itemId);
      if (!currentItem) {
        throw new Error('Inventory item not found');
      }
      
      const quantityChange = newQuantity - currentItem.currentStock;
      if (quantityChange === 0) {
        return;
      }
      
      // Update inventory quantity
      await this.updateDocument<InventoryItem>('inventory_items', itemId, {
        currentStock: newQuantity,
        updatedAt: serverTimestamp()
      });
      
      // Create adjustment transaction
      const transactionType = quantityChange > 0 ? 'stock_in' : 'stock_out';
      const adjustmentTransaction: Omit<StockTransaction, 'id'> = {
        itemId: itemId,
        facilityId: currentItem.facilityId || 'default-facility',
        type: transactionType,
        quantity: Math.abs(quantityChange),
        unit: currentItem.unit,
        source: transactionType === 'stock_in' ? 'Manual Adjustment' : '',
        destination: transactionType === 'stock_out' ? 'Manual Adjustment' : '',
        reason: reason,
        notes: notes || `Quantity adjusted from ${currentItem.currentStock} to ${newQuantity} ${currentItem.unit}`,
        userId: userId,
        transactionDate: new Date().toISOString().split('T')[0]
      };
      
      await this.addDocument<StockTransaction>('transactions', adjustmentTransaction);
      
    } catch (error) {
      console.error('Error adjusting inventory stock with auto-transaction:', error);
      throw error;
    }
  }

  // Stock Transactions
  static async getStockTransactions(): Promise<StockTransaction[]> {
    return this.getCollection<StockTransaction>('transactions');
  }

  static async getStockTransaction(id: string): Promise<StockTransaction | null> {
    return this.getDocument<StockTransaction>('transactions', id);
  }

  static async addStockTransaction(transaction: Omit<StockTransaction, 'id'>): Promise<string> {
    return this.addDocument<StockTransaction>('transactions', transaction);
  }

  static async updateStockTransaction(id: string, transaction: Partial<StockTransaction>): Promise<void> {
    return this.updateDocument<StockTransaction>('transactions', id, transaction);
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
    return this.updateDocument('facilities', id, facility);
  }

  static async deleteFacility(id: string): Promise<void> {
    return this.deleteDocument('facilities', id);
  }

  // Enhanced Transfer Management with Automatic Transaction Generation
  static async getTransfers(): Promise<Transfer[]> {
    return this.getCollection<Transfer>('transfers');
  }

  static async getTransfer(id: string): Promise<Transfer | null> {
    return this.getDocument<Transfer>('transfers', id);
  }

  // Real-time transfer updates
  static onTransfersChange(callback: (transfers: Transfer[]) => void): () => void {
    const q = query(collection(db, 'transfers'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transfers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transfer[];
      
      callback(transfers);
    }, (error) => {
      console.error('Error listening to transfers:', error);
    });
    
    return unsubscribe;
  }

  static async addTransfer(transfer: Omit<Transfer, 'id'>): Promise<string> {
    try {
      // Add the transfer record
      const transferId = await this.addDocument<Transfer>('transfers', transfer);
      
      // Automatically create transfer transactions
      // Stock out from source facility
      const stockOutTransaction: Omit<StockTransaction, 'id'> = {
        itemId: transfer.itemId,
        facilityId: transfer.fromFacilityId,
        type: 'stock_out',
        quantity: transfer.quantity,
        unit: transfer.unit,
        source: '',
        destination: `Transfer to ${transfer.toFacilityId}`,
        reason: `Transfer: ${transfer.reason}`,
        notes: `Automatically generated for transfer ${transferId}`,
        userId: transfer.requestedBy,
        transactionDate: transfer.requestDate
      };
      
      // Stock in to destination facility
      const stockInTransaction: Omit<StockTransaction, 'id'> = {
        itemId: transfer.itemId,
        facilityId: transfer.toFacilityId,
        type: 'stock_in',
        quantity: transfer.quantity,
        unit: transfer.unit,
        source: `Transfer from ${transfer.fromFacilityId}`,
        destination: '',
        reason: `Transfer: ${transfer.reason}`,
        notes: `Automatically generated for transfer ${transferId}`,
        userId: transfer.requestedBy,
        transactionDate: transfer.requestDate
      };
      
      // Add both transactions
      await this.addDocument<StockTransaction>('transactions', stockOutTransaction);
      await this.addDocument<StockTransaction>('transactions', stockInTransaction);
      
      return transferId;
    } catch (error) {
      console.error('Error adding transfer with auto-transactions:', error);
      throw error;
    }
  }

  static async updateTransfer(id: string, transfer: Partial<Transfer>): Promise<void> {
    try {
      // Get current transfer to compare
      const currentTransfer = await this.getTransfer(id);
      if (!currentTransfer) {
        throw new Error('Transfer not found');
      }
      
      // Update the transfer
      await this.updateDocument<Transfer>('transfers', id, transfer);
      
      // If status changed to 'delivered', update inventory quantities
      if (transfer.status === 'delivered' && currentTransfer.status !== 'delivered') {
        // Update source facility inventory (decrease)
        await this.updateInventoryFromTransfer(currentTransfer, 'out');
        // Update destination facility inventory (increase)
        await this.updateInventoryFromTransfer(currentTransfer, 'in');
      }
    } catch (error) {
      console.error('Error updating transfer:', error);
      throw error;
    }
  }

  static async deleteTransfer(id: string): Promise<void> {
    try {
      // Get the transfer before deletion
      const transfer = await this.getTransfer(id);
      if (!transfer) {
        throw new Error('Transfer not found');
      }
      
      // If transfer was delivered, reverse the inventory changes
      if (transfer.status === 'delivered') {
        // Reverse source facility inventory (increase)
        await this.updateInventoryFromTransfer(transfer, 'in');
        // Reverse destination facility inventory (decrease)
        await this.updateInventoryFromTransfer(transfer, 'out');
      }
      
      // Delete the transfer
      await this.deleteDocument('transfers', id);
    } catch (error) {
      console.error('Error deleting transfer:', error);
      throw error;
    }
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
    return onSnapshot(collection(db, 'transactions'), (snapshot) => {
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

  // Stock Transaction Management
  static async getTransactions(): Promise<StockTransaction[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'transactions'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockTransaction[];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  static async addTransaction(transaction: Omit<StockTransaction, 'id' | 'createdAt'>): Promise<string> {
    try {
      const transactionData = {
        ...transaction,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'transactions'), transactionData);
      
      // Update inventory quantity based on transaction type
      await this.updateInventoryFromTransaction(transaction);
      
      console.log('Transaction added successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  static async updateTransaction(id: string, updates: Partial<StockTransaction>): Promise<void> {
    try {
      const docRef = doc(db, 'transactions', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      // If quantity changed, update inventory accordingly
      if (updates.quantity !== undefined) {
        await this.updateInventoryFromTransaction(updates as StockTransaction);
      }
      
      console.log('Transaction updated successfully:', id);
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  static async deleteTransaction(id: string): Promise<void> {
    try {
      // Get transaction before deleting to reverse inventory changes
      const transaction = await this.getTransactionById(id);
      if (transaction) {
        await this.reverseInventoryFromTransaction(transaction);
      }
      
      await deleteDoc(doc(db, 'transactions', id));
      console.log('Transaction deleted successfully:', id);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  static async getTransactionById(id: string): Promise<StockTransaction | null> {
    try {
      const docRef = doc(db, 'transactions', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as StockTransaction;
      }
      return null;
    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  }

  // Real-time transaction updates
  static onTransactionsChange(callback: (transactions: StockTransaction[]) => void): () => void {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockTransaction[];
      
      callback(transactions);
    }, (error) => {
      console.error('Error listening to transactions:', error);
    });
    
    return unsubscribe;
  }

  // Critical: Update inventory quantities when transactions occur
  private static async updateInventoryFromTransaction(transaction: StockTransaction): Promise<void> {
    try {
      const inventoryRef = doc(db, 'inventory_items', transaction.itemId);
      const inventorySnap = await getDoc(inventoryRef);
      
      if (!inventorySnap.exists()) {
        console.error('Inventory item not found for transaction:', transaction.itemId);
        return;
      }
      
      const currentInventory = inventorySnap.data() as InventoryItem;
      let newQuantity = currentInventory.currentStock;
      
      // Calculate new quantity based on transaction type
      switch (transaction.type) {
        case 'stock_in':
          newQuantity += transaction.quantity;
          break;
        case 'stock_out':
          newQuantity -= transaction.quantity;
          break;
        case 'transfer':
          // For transfers, we need to handle both source and destination
          // This will be handled in the transfer logic
          break;
        case 'adjustment':
          newQuantity = transaction.quantity; // Direct quantity set
          break;
      }
      
      // Ensure quantity doesn't go below 0
      newQuantity = Math.max(0, newQuantity);
      
      // Update inventory with new quantity
      await updateDoc(inventoryRef, {
        currentStock: newQuantity,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Inventory updated for item ${transaction.itemId}: ${currentInventory.currentStock} → ${newQuantity}`);
    } catch (error) {
      console.error('Error updating inventory from transaction:', error);
      throw error;
    }
  }

  // Reverse inventory changes when transaction is deleted
  private static async reverseInventoryFromTransaction(transaction: StockTransaction): Promise<void> {
    try {
      const inventoryRef = doc(db, 'inventory_items', transaction.itemId);
      const inventorySnap = await getDoc(inventoryRef);
      
      if (!inventorySnap.exists()) {
        console.error('Inventory item not found for transaction reversal:', transaction.itemId);
        return;
      }
      
      const currentInventory = inventorySnap.data() as InventoryItem;
      let newQuantity = currentInventory.currentStock;
      
      // Reverse the transaction effect
      switch (transaction.type) {
        case 'stock_in':
          newQuantity -= transaction.quantity;
          break;
        case 'stock_out':
          newQuantity += transaction.quantity;
          break;
        case 'adjustment':
          // For adjustments, we need to restore the previous quantity
          // This is complex and might require storing previous values
          console.warn('Cannot reverse adjustment transaction without previous quantity');
          return;
      }
      
      // Ensure quantity doesn't go below 0
      newQuantity = Math.max(0, newQuantity);
      
      // Update inventory with reversed quantity
      await updateDoc(inventoryRef, {
        currentStock: newQuantity,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Inventory reversed for item ${transaction.itemId}: ${currentInventory.currentStock} → ${newQuantity}`);
    } catch (error) {
      console.error('Error reversing inventory from transaction:', error);
      throw error;
    }
  }

  // Helper function to update inventory from transfer
  private static async updateInventoryFromTransfer(transfer: Transfer, direction: 'in' | 'out'): Promise<void> {
    try {
      const facilityId = direction === 'in' ? transfer.fromFacilityId : transfer.toFacilityId;
      const inventoryRef = doc(db, 'inventory_items', transfer.itemId);
      const inventorySnap = await getDoc(inventoryRef);
      
      if (!inventorySnap.exists()) {
        console.error('Inventory item not found for transfer:', transfer.itemId);
        return;
      }
      
      const currentInventory = inventorySnap.data() as InventoryItem;
      let newQuantity = currentInventory.currentStock;
      
      if (direction === 'in') {
        newQuantity += transfer.quantity; // Restore to source
      } else {
        newQuantity -= transfer.quantity; // Remove from source
      }
      
      newQuantity = Math.max(0, newQuantity);
      
      await updateDoc(inventoryRef, {
        currentStock: newQuantity,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating inventory from transfer:', error);
      throw error;
    }
  }

  // Generate sample transfer data
  static async generateSampleTransfers(): Promise<void> {
    try {
      // Get existing facilities and inventory items
      const facilities = await this.getFacilities();
      const inventoryItems = await this.getInventoryItems();
      
      if (facilities.length < 2 || inventoryItems.length === 0) {
        throw new Error('Need at least 2 facilities and 1 inventory item to create sample transfers');
      }
      
      const sampleTransfers = [
        {
          itemId: inventoryItems[0].id,
          quantity: Math.floor(Math.random() * 20) + 5,
          unit: inventoryItems[0].unit,
          fromFacilityId: facilities[0].id,
          toFacilityId: facilities[1].id,
          requestedBy: 'sample-user',
          requestDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'delivered' as const,
          reason: 'Regular supply distribution',
          priority: 'medium' as const,
          notes: 'Sample transfer for demonstration',
          trackingNumber: `TRF-${Date.now()}-001`
        },
        {
          itemId: inventoryItems[Math.min(1, inventoryItems.length - 1)].id,
          quantity: Math.floor(Math.random() * 15) + 3,
          unit: inventoryItems[Math.min(1, inventoryItems.length - 1)].unit,
          fromFacilityId: facilities[1].id,
          toFacilityId: facilities[0].id,
          requestedBy: 'sample-user',
          requestDate: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'in_transit' as const,
          reason: 'Inventory rebalancing',
          priority: 'high' as const,
          notes: 'Sample transfer in progress',
          trackingNumber: `TRF-${Date.now()}-002`
        },
        {
          itemId: inventoryItems[Math.min(2, inventoryItems.length - 1)].id,
          quantity: Math.floor(Math.random() * 10) + 2,
          unit: inventoryItems[Math.min(2, inventoryItems.length - 1)].unit,
          fromFacilityId: facilities[0].id,
          toFacilityId: facilities[Math.min(2, facilities.length - 1)].id,
          requestedBy: 'sample-user',
          requestDate: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending' as const,
          reason: 'New facility setup',
          priority: 'urgent' as const,
          notes: 'Sample pending transfer',
          trackingNumber: `TRF-${Date.now()}-003`
        }
      ];
      
      // Add sample transfers
      for (const transfer of sampleTransfers) {
        await this.addTransfer(transfer);
      }
      
      console.log('Sample transfers generated successfully');
    } catch (error) {
      console.error('Error generating sample transfers:', error);
      throw error;
    }
  }
} 