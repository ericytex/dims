import { useState, useEffect, useCallback } from 'react';
import { centralSync, SyncResult, SyncProgress } from '../services/CentralSQLiteSync';

export interface CentralSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: string | null;
  syncProgress: SyncProgress;
  error: string | null;
  pendingItems: number;
}

export const useCentralSync = () => {
  const [state, setState] = useState<CentralSyncState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    syncProgress: {
      total: 0,
      completed: 0,
      current: '',
      status: 'idle',
    },
    error: null,
    pendingItems: 0,
  });

  const sync = useCallback(async (): Promise<SyncResult> => {
    try {
      setState(prev => ({ ...prev, isSyncing: true, error: null }));
      
      const result = await centralSync.sync();
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: result.lastSync,
        error: result.success ? null : result.errors.join(', '),
      }));

      // Update pending items after sync
      const stats = await centralSync.getSyncStats();
      setState(prev => ({ ...prev, pendingItems: stats.pendingItems }));

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      }));
      throw error;
    }
  }, []);

  const startAutoSync = useCallback(() => {
    centralSync.startAutoSync();
  }, []);

  const stopAutoSync = useCallback(() => {
    centralSync.stopAutoSync();
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const stats = await centralSync.getSyncStats();
      setState(prev => ({ 
        ...prev, 
        pendingItems: stats.pendingItems,
        lastSync: stats.lastSync 
      }));
    } catch (error) {
      console.error('Error refreshing sync stats:', error);
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const progress = centralSync.getSyncProgress();
      setState(prev => ({ ...prev, syncProgress: progress }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Load initial stats
    refreshStats();
  }, [refreshStats]);

  return {
    ...state,
    sync,
    startAutoSync,
    stopAutoSync,
    refreshStats,
    clearError,
  };
}; 