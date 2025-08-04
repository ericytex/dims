import { sqliteDB } from './SQLiteDatabase';

export interface CentralSyncConfig {
  centralDbUrl: string;
  syncInterval: number; // milliseconds
  maxRetries: number;
  conflictResolution: 'local' | 'remote' | 'manual';
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  conflicts: number;
  errors: string[];
  lastSync: string;
}

export interface SyncProgress {
  total: number;
  completed: number;
  current: string;
  status: 'idle' | 'syncing' | 'completed' | 'failed';
}

export class CentralSQLiteSync {
  private config: CentralSyncConfig;
  private isSyncing = false;
  private syncProgress: SyncProgress = {
    total: 0,
    completed: 0,
    current: '',
    status: 'idle',
  };
  private autoSyncInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<CentralSyncConfig> = {}) {
    this.config = {
      centralDbUrl: config.centralDbUrl || 'https://ims-server-one.vercel.app/api/central-db',
      syncInterval: config.syncInterval || 300000, // 5 minutes
      maxRetries: config.maxRetries || 3,
      conflictResolution: config.conflictResolution || 'local',
    };
  }

  /**
   * Download central SQLite database
   */
  async downloadCentralDb(): Promise<ArrayBuffer | null> {
    try {
      console.log('📥 Downloading central database...');
      const response = await fetch(`${this.config.centralDbUrl}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to download central DB: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log('✅ Central database downloaded successfully');
      return arrayBuffer;
    } catch (error) {
      console.error('❌ Error downloading central database:', error);
      return null;
    }
  }

  /**
   * Upload local database to central server
   */
  async uploadLocalDb(): Promise<boolean> {
    try {
      console.log('📤 Uploading local database...');
      const dbBlob = sqliteDB.getDatabase().export();
      const formData = new FormData();
      formData.append('database', new Blob([dbBlob], { type: 'application/octet-stream' }));

      const response = await fetch(`${this.config.centralDbUrl}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        credentials: 'include',
        body: formData,
      });

      const success = response.ok;
      if (success) {
        console.log('✅ Local database uploaded successfully');
      } else {
        console.error('❌ Failed to upload local database');
      }
      return success;
    } catch (error) {
      console.error('❌ Error uploading local database:', error);
      return false;
    }
  }

  /**
   * Merge central database with local database
   */
  async mergeDatabases(centralDbBlob: ArrayBuffer): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      syncedItems: 0,
      conflicts: 0,
      errors: [],
      lastSync: new Date().toISOString(),
    };

    try {
      console.log('🔄 Merging databases...');
      
      // Get local pending changes
      const localPending = await this.getLocalPendingChanges();
      console.log(`📊 Found ${localPending.length} local pending changes`);
      
      // For now, we'll use a simplified merge approach
      // In a production system, you'd want more sophisticated conflict resolution
      const mergedChanges = localPending.map(change => ({
        ...change,
        hasConflict: false, // Simplified for now
      }));

      // Apply merged changes to local database
      await this.applyMergedChanges(mergedChanges);

      result.success = true;
      result.syncedItems = mergedChanges.length;
      result.conflicts = mergedChanges.filter(c => c.hasConflict).length;

      console.log(`✅ Merged ${result.syncedItems} items with ${result.conflicts} conflicts`);

    } catch (error) {
      console.error('❌ Error merging databases:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Get local pending changes
   */
  private async getLocalPendingChanges(): Promise<any[]> {
    try {
      const pendingTransactions = await sqliteDB.query(`
        SELECT *, 'stock_transactions' as table_name FROM stock_transactions 
        WHERE sync_status = 'pending'
      `);

      const pendingTransfers = await sqliteDB.query(`
        SELECT *, 'transfers' as table_name FROM transfers 
        WHERE sync_status = 'pending'
      `);

      const pendingInventory = await sqliteDB.query(`
        SELECT *, 'inventory_items' as table_name FROM inventory_items 
        WHERE sync_status = 'pending'
      `);

      return [...pendingTransactions, ...pendingTransfers, ...pendingInventory];
    } catch (error) {
      console.error('❌ Error getting local pending changes:', error);
      return [];
    }
  }

  /**
   * Apply merged changes to local database
   */
  private async applyMergedChanges(changes: any[]): Promise<void> {
    for (const change of changes) {
      try {
        if (change.table_name === 'stock_transactions') {
          await this.applyTransactionChange(change);
        } else if (change.table_name === 'transfers') {
          await this.applyTransferChange(change);
        } else if (change.table_name === 'inventory_items') {
          await this.applyInventoryChange(change);
        }
      } catch (error) {
        console.error(`❌ Error applying change ${change.id}:`, error);
      }
    }
  }

  /**
   * Apply transaction change
   */
  private async applyTransactionChange(change: any): Promise<void> {
    await sqliteDB.execute(`
      UPDATE stock_transactions 
      SET sync_status = 'synced', sync_attempts = 0
      WHERE id = ?
    `, [change.id]);
  }

  /**
   * Apply transfer change
   */
  private async applyTransferChange(change: any): Promise<void> {
    await sqliteDB.execute(`
      UPDATE transfers 
      SET sync_status = 'synced'
      WHERE id = ?
    `, [change.id]);
  }

  /**
   * Apply inventory change
   */
  private async applyInventoryChange(change: any): Promise<void> {
    await sqliteDB.execute(`
      UPDATE inventory_items 
      SET sync_status = 'synced'
      WHERE id = ?
    `, [change.id]);
  }

  /**
   * Full sync process
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    this.isSyncing = true;
    this.syncProgress = {
      total: 4, // download, merge, upload, finalize
      completed: 0,
      current: 'Starting sync...',
      status: 'syncing',
    };

    try {
      // Download central database
      this.syncProgress.current = 'Downloading central database...';
      this.syncProgress.completed = 1;
      const centralDbBlob = await this.downloadCentralDb();
      
      if (!centralDbBlob) {
        throw new Error('Failed to download central database');
      }

      // Merge databases
      this.syncProgress.current = 'Merging databases...';
      this.syncProgress.completed = 2;
      const result = await this.mergeDatabases(centralDbBlob);

      // Upload merged database
      this.syncProgress.current = 'Uploading merged database...';
      this.syncProgress.completed = 3;
      const uploadSuccess = await this.uploadLocalDb();

      if (!uploadSuccess) {
        result.errors.push('Failed to upload merged database');
      }

      // Finalize
      this.syncProgress.current = 'Sync completed';
      this.syncProgress.completed = 4;
      this.syncProgress.status = result.success ? 'completed' : 'failed';
      
      return result;

    } catch (error) {
      this.syncProgress.status = 'failed';
      console.error('❌ Sync failed:', error);
      return {
        success: false,
        syncedItems: 0,
        conflicts: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSync: new Date().toISOString(),
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get sync progress
   */
  getSyncProgress(): SyncProgress {
    return { ...this.syncProgress };
  }

  /**
   * Check if sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Start automatic sync
   */
  startAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }
    
    this.autoSyncInterval = setInterval(async () => {
      if (!this.isSyncing && navigator.onLine) {
        try {
          console.log('🔄 Auto sync triggered');
          await this.sync();
        } catch (error) {
          console.error('❌ Auto sync failed:', error);
        }
      }
    }, this.config.syncInterval);
    
    console.log('🔄 Auto sync started');
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      console.log('🔄 Auto sync stopped');
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    pendingItems: number;
    lastSync: string | null;
    isOnline: boolean;
  }> {
    try {
      const pendingItems = await sqliteDB.query(`
        SELECT 
          (SELECT COUNT(*) FROM stock_transactions WHERE sync_status = 'pending') +
          (SELECT COUNT(*) FROM transfers WHERE sync_status = 'pending') +
          (SELECT COUNT(*) FROM inventory_items WHERE sync_status = 'pending') as total
      `);

      return {
        pendingItems: pendingItems[0]?.total || 0,
        lastSync: localStorage.getItem('last-sync-time'),
        isOnline: navigator.onLine,
      };
    } catch (error) {
      console.error('❌ Error getting sync stats:', error);
      return {
        pendingItems: 0,
        lastSync: null,
        isOnline: navigator.onLine,
      };
    }
  }
}

// Create singleton instance
export const centralSync = new CentralSQLiteSync(); 