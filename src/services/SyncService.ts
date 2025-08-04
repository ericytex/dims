import { offlineDB, OfflineTransaction, OfflineInventoryItem, OfflineTransfer } from './OfflineDatabase';

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  errors: string[];
}

export interface SyncProgress {
  total: number;
  completed: number;
  current: string;
  status: 'idle' | 'syncing' | 'completed' | 'failed';
}

class SyncService {
  private isSyncing = false;
  private syncProgress: SyncProgress = {
    total: 0,
    completed: 0,
    current: '',
    status: 'idle',
  };

  // Production API endpoints - using new backend deployment
  private readonly API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://ims-server-one.vercel.app' 
    : 'http://localhost:3001';
  private readonly ENDPOINTS = {
    transactions: '/api/transactions',
    inventory: '/api/inventory',
    transfers: '/api/transfers',
  };

  // Get authentication headers for API calls
    private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add Vercel protection bypass header
    const bypassSecret = process.env.VITE_VERCEL_BYPASS_SECRET || 'ims-bypass-secret-2024';
    headers['x-vercel-protection-bypass'] = bypassSecret;
    
    // Use OIDC Bearer token for Vercel authentication
    // This will be provided by Vercel's authentication system
    const token = localStorage.getItem('auth-token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Check if we can reach the backend
  async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/api/health`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include', // Include cookies
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.log('Backend not reachable:', error);
      return false;
    }
  }

  // Sync all pending data
  async syncAllData(): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    this.isSyncing = true;
    this.syncProgress = {
      total: 0,
      completed: 0,
      current: 'Initializing sync...',
      status: 'syncing',
    };

    const result: SyncResult = {
      success: false,
      syncedItems: 0,
      failedItems: 0,
      errors: [],
    };

    try {
      // Check connectivity first
      const isOnline = await this.checkConnectivity();
      if (!isOnline) {
        throw new Error('No internet connection available');
      }

      // Get all pending items
      const pendingItems = await offlineDB.getAllPendingItems();
      const totalItems = 
        pendingItems.transactions.length + 
        pendingItems.inventory.length + 
        pendingItems.transfers.length;

      this.syncProgress.total = totalItems;

      if (totalItems === 0) {
        this.syncProgress.status = 'completed';
        result.success = true;
        return result;
      }

      // Sync transactions
      for (const transaction of pendingItems.transactions) {
        this.syncProgress.current = `Syncing transaction: ${transaction.item}`;
        try {
          await this.syncTransaction(transaction);
          result.syncedItems++;
        } catch (error) {
          result.failedItems++;
          result.errors.push(`Transaction ${transaction.id}: ${error}`);
          await offlineDB.updateTransactionSyncStatus(transaction.id, 'failed');
        }
        this.syncProgress.completed++;
      }

      // Sync inventory items
      for (const item of pendingItems.inventory) {
        this.syncProgress.current = `Syncing inventory: ${item.name}`;
        try {
          await this.syncInventoryItem(item);
          result.syncedItems++;
        } catch (error) {
          result.failedItems++;
          result.errors.push(`Inventory ${item.id}: ${error}`);
          await offlineDB.updateInventorySyncStatus(item.id, 'failed');
        }
        this.syncProgress.completed++;
      }

      // Sync transfers
      for (const transfer of pendingItems.transfers) {
        this.syncProgress.current = `Syncing transfer: ${transfer.itemName}`;
        try {
          await this.syncTransfer(transfer);
          result.syncedItems++;
        } catch (error) {
          result.failedItems++;
          result.errors.push(`Transfer ${transfer.id}: ${error}`);
          await offlineDB.updateTransferSyncStatus(transfer.id, 'failed');
        }
        this.syncProgress.completed++;
      }

      // Update last sync time
      await offlineDB.setLastSyncTime();
      
      // Clear successfully synced data
      await offlineDB.clearSyncedData();

      result.success = result.failedItems === 0;
      this.syncProgress.status = result.success ? 'completed' : 'failed';
      this.syncProgress.current = result.success ? 'Sync completed' : 'Sync completed with errors';

    } catch (error) {
      result.success = false;
      result.errors.push(`Sync failed: ${error}`);
      this.syncProgress.status = 'failed';
      this.syncProgress.current = 'Sync failed';
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  // Sync individual transaction
  private async syncTransaction(transaction: OfflineTransaction): Promise<void> {
    const headers = this.getAuthHeaders();
    
    const response = await fetch(`${this.API_BASE}${this.ENDPOINTS.transactions}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        type: transaction.type,
        item_id: transaction.item,
        quantity: transaction.quantity,
        unit: transaction.unit,
        facility_id: transaction.facility,
        source: transaction.source,
        destination: transaction.destination,
        reason: transaction.reason,
        notes: transaction.notes,
        date: transaction.date,
        time: transaction.time,
        status: transaction.status,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }

    await offlineDB.updateTransactionSyncStatus(transaction.id, 'synced');
  }

  // Sync individual inventory item
  private async syncInventoryItem(item: OfflineInventoryItem): Promise<void> {
    const headers = this.getAuthHeaders();
    
    const response = await fetch(`${this.API_BASE}${this.ENDPOINTS.inventory}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        name: item.name,
        description: item.description,
        category: item.category,
        sku: item.sku,
        unit: item.unit,
        current_stock: item.currentStock,
        min_stock: item.minStock,
        max_stock: item.maxStock,
        cost: item.cost,
        supplier: item.supplier,
        facility_id: item.facility,
        location: item.location,
        expiry_date: item.expiryDate,
        status: item.status,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }

    await offlineDB.updateInventorySyncStatus(item.id, 'synced');
  }

  // Sync individual transfer
  private async syncTransfer(transfer: OfflineTransfer): Promise<void> {
    const headers = this.getAuthHeaders();
    
    const response = await fetch(`${this.API_BASE}${this.ENDPOINTS.transfers}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        item_name: transfer.itemName,
        item_id: transfer.itemId,
        quantity: transfer.quantity,
        unit: transfer.unit,
        from_facility_id: transfer.fromFacilityId,
        to_facility_id: transfer.toFacilityId,
        reason: transfer.reason,
        priority: transfer.priority,
        notes: transfer.notes,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }

    await offlineDB.updateTransferSyncStatus(transfer.id, 'synced');
  }

  // Get current sync progress
  getSyncProgress(): SyncProgress {
    return { ...this.syncProgress };
  }

  // Check if sync is in progress
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  // Get sync statistics
  async getSyncStats(): Promise<{
    pendingItems: number;
    lastSync: string | null;
    isOnline: boolean;
  }> {
    const stats = await offlineDB.getStats();
    const isOnline = await this.checkConnectivity();

    return {
      pendingItems: stats.pendingTransactions + stats.pendingInventory + stats.pendingTransfers,
      lastSync: stats.lastSync,
      isOnline,
    };
  }

  // Retry failed items
  async retryFailedItems(): Promise<SyncResult> {
    // This would reset failed items to pending status and retry
    // Implementation depends on your specific requirements
    return this.syncAllData();
  }

  // Get authentication token (replace with your auth system)
  private getAuthToken(): string {
    // Replace with your actual authentication logic
    const user = localStorage.getItem('ims_user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.token || '';
    }
    return '';
  }
}

// Export singleton instance
export const syncService = new SyncService();
 