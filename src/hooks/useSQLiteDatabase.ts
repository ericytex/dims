import { useState, useEffect, useCallback } from 'react';
import { sqliteDB, SQLiteDatabase } from '../services/SQLiteDatabase';

export interface DatabaseStats {
  totalUsers: number;
  totalItems: number;
  totalTransactions: number;
  totalTransfers: number;
  pendingSync: number;
  lastSave: string | null;
}

export interface DatabaseState {
  isInitialized: boolean;
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;
  stats: DatabaseStats | null;
}

export const useSQLiteDatabase = () => {
  const [state, setState] = useState<DatabaseState>({
    isInitialized: false,
    isOnline: navigator.onLine,
    isLoading: true,
    error: null,
    stats: null
  });

  /**
   * Initialize the database
   */
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await sqliteDB.init();
      
      // Get initial stats
      const stats = await sqliteDB.getStats();
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        stats
      }));

      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize database'
      }));
    }
  }, []);

  /**
   * Reset the database
   */
  const reset = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await sqliteDB.resetDatabase();
      
      // Get updated stats
      const stats = await sqliteDB.getStats();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        stats
      }));

      console.log('✅ Database reset successfully');
    } catch (error) {
      console.error('❌ Failed to reset database:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to reset database'
      }));
    }
  }, []);

  /**
   * Export the database
   */
  const exportDatabase = useCallback(async () => {
    try {
      await sqliteDB.exportDatabase();
    } catch (error) {
      console.error('❌ Failed to export database:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to export database'
      }));
    }
  }, []);

  /**
   * Refresh database stats
   */
  const refreshStats = useCallback(async () => {
    try {
      const stats = await sqliteDB.getStats();
      setState(prev => ({ ...prev, stats }));
    } catch (error) {
      console.error('❌ Failed to refresh stats:', error);
    }
  }, []);

  /**
   * Execute SQL query
   */
  const execute = useCallback(async (sql: string, params: any[] = []) => {
    try {
      const result = await sqliteDB.execute(sql, params);
      await refreshStats(); // Refresh stats after any write operation
      return result;
    } catch (error) {
      console.error('❌ SQL execution error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'SQL execution failed'
      }));
      throw error;
    }
  }, [refreshStats]);

  /**
   * Execute SELECT query
   */
  const query = useCallback(async (sql: string, params: any[] = []) => {
    try {
      return await sqliteDB.query(sql, params);
    } catch (error) {
      console.error('❌ SQL query error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'SQL query failed'
      }));
      throw error;
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize database on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    initialize,
    reset,
    exportDatabase,
    refreshStats,
    execute,
    query,
    clearError,
    
    // Database instance
    database: sqliteDB
  };
}; 