import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { offlineDB } from '../services/OfflineDatabase';
import { useFirebaseDatabase } from '../hooks/useFirebaseDatabase';

interface SyncProgress {
  total: number;
  completed: number;
  current: string;
  status: 'idle' | 'syncing' | 'completed' | 'failed';
}

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress: SyncProgress;
  pendingCount: number;
  lastSync: string | null;
  addOfflineTransaction: (transaction: any) => Promise<string>;
  addOfflineTransfer: (transfer: any) => Promise<string>;
  addOfflineInventoryUpdate: (update: any) => Promise<string>;
  syncOfflineData: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
  getPendingSyncCount: () => Promise<number>;
  getSyncStats: () => Promise<{ pendingItems: number; lastSync: string | null; isOnline: boolean }>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    total: 0,
    completed: 0,
    current: '',
    status: 'idle',
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Initialize offline database
  useEffect(() => {
    const initDB = async () => {
      try {
        await offlineDB.init();
        await updateStats();
      } catch (error) {
        console.error('Failed to initialize offline database:', error);
      }
    };
    initDB();
  }, []);

  // Update stats periodically
  const updateStats = async () => {
    try {
      const stats = await getSyncStats();
      setPendingCount(stats.pendingItems);
      setLastSync(stats.lastSync);
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  };

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      await updateStats();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addOfflineTransaction = async (transaction: any): Promise<string> => {
    const id = await offlineDB.addTransaction({
      ...transaction,
      syncStatus: 'pending',
    });
    await updateStats();
    return id;
  };

  const addOfflineTransfer = async (transfer: any): Promise<string> => {
    const id = await offlineDB.addTransfer({
      ...transfer,
      syncStatus: 'pending',
    });
    await updateStats();
    return id;
  };

  const addOfflineInventoryUpdate = async (update: any): Promise<string> => {
    const id = await offlineDB.addInventoryItem({
      ...update,
      syncStatus: 'pending',
    });
    await updateStats();
    return id;
  };

  const syncOfflineData = async () => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }

    try {
      setIsSyncing(true);
      setSyncProgress({
        total: 0,
        completed: 0,
        current: 'Starting sync...',
        status: 'syncing',
      });

      // Get pending items from offline database
      const pendingItems = await offlineDB.getAllPendingItems();
      const totalItems = 
        pendingItems.transactions.length + 
        pendingItems.inventory.length + 
        pendingItems.transfers.length;

      setSyncProgress(prev => ({
        ...prev,
        total: totalItems,
      }));

      let completedItems = 0;

      // Sync inventory items to Firebase
      for (const item of pendingItems.inventory) {
        try {
          setSyncProgress(prev => ({
            ...prev,
            current: `Syncing inventory item: ${item.name}`,
            completed: completedItems,
          }));

          // Import Firebase functions dynamically to avoid SSR issues
          const { FirebaseDatabaseService } = await import('../services/firebaseDatabase');
          
          if (item.type === 'add') {
            // Add new item to Firebase
            await FirebaseDatabaseService.addInventoryItem({
              name: item.name,
              description: item.description,
              category: item.category,
              sku: item.sku,
              unit: item.unit,
              currentStock: item.currentStock,
              minStock: item.minStock,
              maxStock: item.maxStock,
              cost: item.cost,
              supplier: item.supplier,
              facilityId: item.facility,
              location: item.location,
              expiryDate: item.expiryDate,
              status: item.status
            });
          } else if (item.type === 'update') {
            // Update existing item in Firebase
            await FirebaseDatabaseService.updateInventoryItem(item.id, {
              name: item.name,
              description: item.description,
              category: item.category,
              sku: item.sku,
              unit: item.unit,
              currentStock: item.currentStock,
              minStock: item.minStock,
              maxStock: item.maxStock,
              cost: item.cost,
              supplier: item.supplier,
              facilityId: item.facility,
              location: item.location,
              expiryDate: item.expiryDate,
              status: item.status
            });
          }

          // Mark as synced in offline database
          await offlineDB.updateInventorySyncStatus(item.id, 'synced');
          completedItems++;
        } catch (error) {
          console.error(`Failed to sync inventory item ${item.id}:`, error);
          await offlineDB.updateInventorySyncStatus(item.id, 'failed');
          completedItems++;
        }
      }

      // For now, skip transactions and transfers (implement later)
      // TODO: Implement sync for transactions and transfers

      setSyncProgress({
        total: totalItems,
        completed: completedItems,
        current: 'Sync completed',
        status: 'completed',
      });

      // Update last sync time
      await offlineDB.setLastSyncTime();
      await updateStats();
      console.log('Offline data synced successfully');
    } catch (error) {
      setSyncProgress(prev => ({
        ...prev,
        status: 'failed',
        current: 'Sync failed',
      }));
      console.error('Error syncing offline data:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const clearOfflineData = async () => {
    await offlineDB.clearSyncedData();
    await updateStats();
  };

  const getPendingSyncCount = async (): Promise<number> => {
    const stats = await getSyncStats();
    return stats.pendingItems;
  };

  const getSyncStats = async () => {
    try {
      const stats = await offlineDB.getStats();
      return {
        pendingItems: stats.pendingTransactions + stats.pendingInventory + stats.pendingTransfers,
        lastSync: stats.lastSync,
        isOnline: navigator.onLine,
      };
    } catch (error) {
      console.error('Error getting sync stats:', error);
      return {
        pendingItems: 0,
        lastSync: null,
        isOnline: navigator.onLine,
      };
    }
  };

  const value: OfflineContextType = {
    isOnline,
    isSyncing,
    syncProgress,
    pendingCount,
    lastSync,
    addOfflineTransaction,
    addOfflineTransfer,
    addOfflineInventoryUpdate,
    syncOfflineData,
    clearOfflineData,
    getPendingSyncCount,
    getSyncStats,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}; 