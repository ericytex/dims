import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { offlineDB } from '../services/OfflineDatabase';
import { syncService, SyncProgress } from '../services/SyncService';

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
      const stats = await syncService.getSyncStats();
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

  // Monitor sync progress
  useEffect(() => {
    const interval = setInterval(() => {
      if (syncService.isSyncInProgress()) {
        setSyncProgress(syncService.getSyncProgress());
        setIsSyncing(true);
      } else {
        setIsSyncing(false);
      }
    }, 1000);

    return () => clearInterval(interval);
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
      const result = await syncService.syncAllData();
      await updateStats();
      
      if (!result.success) {
        throw new Error(`Sync failed: ${result.errors.join(', ')}`);
      }
      
      console.log('Offline data synced successfully');
    } catch (error) {
      console.error('Error syncing offline data:', error);
      throw error;
    }
  };

  const clearOfflineData = async () => {
    await offlineDB.clearSyncedData();
    await updateStats();
  };

  const getPendingSyncCount = async (): Promise<number> => {
    const stats = await syncService.getSyncStats();
    return stats.pendingItems;
  };

  const getSyncStats = async () => {
    return await syncService.getSyncStats();
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