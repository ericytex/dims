import { openDB, IDBPDatabase } from 'idb';

export interface OfflineTransaction {
  id: string;
  type: 'stock_in' | 'stock_out' | 'transfer' | 'adjustment';
  item: string;
  quantity: number;
  unit: string;
  facility: string;
  source?: string;
  destination?: string;
  reason: string;
  notes?: string;
  user: string;
  date: string;
  time: string;
  status: 'pending' | 'synced' | 'failed';
  timestamp: number;
  syncAttempts: number;
}

export interface OfflineInventoryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  cost: number;
  supplier: string;
  facility: string;
  location: string;
  expiryDate?: string;
  lastUpdated: string;
  status: 'active' | 'inactive' | 'discontinued';
  syncStatus: 'pending' | 'synced' | 'failed';
  timestamp: number;
}

export interface OfflineTransfer {
  id: string;
  itemName: string;
  itemId: string;
  quantity: number;
  unit: string;
  fromFacility: string;
  fromFacilityId: string;
  toFacility: string;
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
  syncStatus: 'pending' | 'synced' | 'failed';
  timestamp: number;
}

class OfflineDatabase {
  private db: IDBPDatabase | null = null;
  private readonly DB_NAME = 'IMS_OfflineDB';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    try {
      this.db = await openDB(this.DB_NAME, this.DB_VERSION, {
        upgrade: (db) => {
          // Create stores for different data types
          if (!db.objectStoreNames.contains('transactions')) {
            const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
            transactionStore.createIndex('status', 'status');
            transactionStore.createIndex('timestamp', 'timestamp');
            transactionStore.createIndex('syncStatus', 'syncStatus');
          }

          if (!db.objectStoreNames.contains('inventory')) {
            const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id' });
            inventoryStore.createIndex('syncStatus', 'syncStatus');
            inventoryStore.createIndex('timestamp', 'timestamp');
          }

          if (!db.objectStoreNames.contains('transfers')) {
            const transferStore = db.createObjectStore('transfers', { keyPath: 'id' });
            transferStore.createIndex('syncStatus', 'syncStatus');
            transferStore.createIndex('timestamp', 'timestamp');
          }

          if (!db.objectStoreNames.contains('syncMetadata')) {
            db.createObjectStore('syncMetadata', { keyPath: 'key' });
          }
        },
      });
      console.log('Offline database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
      throw error;
    }
  }

  // Transaction methods
  async addTransaction(transaction: Omit<OfflineTransaction, 'id' | 'timestamp' | 'syncAttempts'>): Promise<string> {
    if (!this.db) await this.init();
    
    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineTransaction: OfflineTransaction = {
      ...transaction,
      id,
      timestamp: Date.now(),
      syncAttempts: 0,
    };

    await this.db!.add('transactions', offlineTransaction);
    console.log('Transaction saved to offline database:', id);
    return id;
  }

  async getPendingTransactions(): Promise<OfflineTransaction[]> {
    if (!this.db) await this.init();
    
    const transactions = await this.db!.getAllFromIndex('transactions', 'syncStatus', 'pending');
    return transactions.sort((a, b) => a.timestamp - b.timestamp);
  }

  async updateTransactionSyncStatus(id: string, status: 'synced' | 'failed'): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = await this.db!.get('transactions', id);
    if (transaction) {
      transaction.syncStatus = status;
      transaction.syncAttempts = (transaction.syncAttempts || 0) + 1;
      await this.db!.put('transactions', transaction);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('transactions', id);
  }

  // Inventory methods
  async addInventoryItem(item: Omit<OfflineInventoryItem, 'id' | 'timestamp'>): Promise<string> {
    if (!this.db) await this.init();
    
    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineItem: OfflineInventoryItem = {
      ...item,
      id,
      timestamp: Date.now(),
    };

    await this.db!.add('inventory', offlineItem);
    console.log('Inventory item saved to offline database:', id);
    return id;
  }

  async updateInventoryItem(id: string, updates: Partial<OfflineInventoryItem>): Promise<void> {
    if (!this.db) await this.init();
    
    const item = await this.db!.get('inventory', id);
    if (item) {
      const updatedItem = { ...item, ...updates, timestamp: Date.now() };
      await this.db!.put('inventory', updatedItem);
    }
  }

  async getPendingInventoryUpdates(): Promise<OfflineInventoryItem[]> {
    if (!this.db) await this.init();
    
    const items = await this.db!.getAllFromIndex('inventory', 'syncStatus', 'pending');
    return items.sort((a, b) => a.timestamp - b.timestamp);
  }

  async updateInventorySyncStatus(id: string, status: 'synced' | 'failed'): Promise<void> {
    if (!this.db) await this.init();
    
    const item = await this.db!.get('inventory', id);
    if (item) {
      item.syncStatus = status;
      await this.db!.put('inventory', item);
    }
  }

  // Transfer methods
  async addTransfer(transfer: Omit<OfflineTransfer, 'id' | 'timestamp'>): Promise<string> {
    if (!this.db) await this.init();
    
    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineTransfer: OfflineTransfer = {
      ...transfer,
      id,
      timestamp: Date.now(),
    };

    await this.db!.add('transfers', offlineTransfer);
    console.log('Transfer saved to offline database:', id);
    return id;
  }

  async updateTransfer(id: string, updates: Partial<OfflineTransfer>): Promise<void> {
    if (!this.db) await this.init();
    
    const transfer = await this.db!.get('transfers', id);
    if (transfer) {
      const updatedTransfer = { ...transfer, ...updates, timestamp: Date.now() };
      await this.db!.put('transfers', updatedTransfer);
    }
  }

  async getPendingTransfers(): Promise<OfflineTransfer[]> {
    if (!this.db) await this.init();
    
    const transfers = await this.db!.getAllFromIndex('transfers', 'syncStatus', 'pending');
    return transfers.sort((a, b) => a.timestamp - b.timestamp);
  }

  async updateTransferSyncStatus(id: string, status: 'synced' | 'failed'): Promise<void> {
    if (!this.db) await this.init();
    
    const transfer = await this.db!.get('transfers', id);
    if (transfer) {
      transfer.syncStatus = status;
      await this.db!.put('transfers', transfer);
    }
  }

  // Sync metadata
  async setLastSyncTime(): Promise<void> {
    if (!this.db) await this.init();
    
    await this.db!.put('syncMetadata', {
      key: 'lastSync',
      value: new Date().toISOString(),
      timestamp: Date.now(),
    });
  }

  async getLastSyncTime(): Promise<string | null> {
    if (!this.db) await this.init();
    
    const metadata = await this.db!.get('syncMetadata', 'lastSync');
    return metadata?.value || null;
  }

  // Get all pending items for sync
  async getAllPendingItems(): Promise<{
    transactions: OfflineTransaction[];
    inventory: OfflineInventoryItem[];
    transfers: OfflineTransfer[];
  }> {
    const [transactions, inventory, transfers] = await Promise.all([
      this.getPendingTransactions(),
      this.getPendingInventoryUpdates(),
      this.getPendingTransfers(),
    ]);

    return { transactions, inventory, transfers };
  }

  // Clear all synced data
  async clearSyncedData(): Promise<void> {
    if (!this.db) await this.init();
    
    const tx = this.db!.transaction(['transactions', 'inventory', 'transfers'], 'readwrite');
    
    // Clear synced transactions
    const syncedTransactions = await tx.store.index('syncStatus').getAll('synced');
    for (const transaction of syncedTransactions) {
      await tx.store.delete(transaction.id);
    }

    // Clear synced inventory items
    const syncedInventory = await tx.store.index('syncStatus').getAll('synced');
    for (const item of syncedInventory) {
      await tx.store.delete(item.id);
    }

    // Clear synced transfers
    const syncedTransfers = await tx.store.index('syncStatus').getAll('synced');
    for (const transfer of syncedTransfers) {
      await tx.store.delete(transfer.id);
    }

    await tx.done;
    console.log('Cleared all synced data from offline database');
  }

  // Get database statistics
  async getStats(): Promise<{
    pendingTransactions: number;
    pendingInventory: number;
    pendingTransfers: number;
    lastSync: string | null;
  }> {
    if (!this.db) await this.init();
    
    const [transactions, inventory, transfers, lastSync] = await Promise.all([
      this.getPendingTransactions(),
      this.getPendingInventoryUpdates(),
      this.getPendingTransfers(),
      this.getLastSyncTime(),
    ]);

    return {
      pendingTransactions: transactions.length,
      pendingInventory: inventory.length,
      pendingTransfers: transfers.length,
      lastSync,
    };
  }
}

// Export singleton instance
export const offlineDB = new OfflineDatabase(); 