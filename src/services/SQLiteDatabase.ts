import { createDbWorker } from 'sql.js-httpvfs';

// Database schema and migrations
export interface DatabaseSchema {
  version: number;
  tables: {
    users: UserTable;
    inventory_items: InventoryItemTable;
    stock_transactions: StockTransactionTable;
    facilities: FacilityTable;
    transfers: TransferTable;
    notifications: NotificationTable;
  };
}

export interface UserTable {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'regional_manager' | 'district_manager' | 'facility_manager' | 'inventory_worker';
  facility_id?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItemTable {
  id: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  cost: number;
  supplier: string;
  facility_id: string;
  location: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'discontinued';
}

export interface StockTransactionTable {
  id: string;
  item_id: string;
  facility_id: string;
  type: 'stock_in' | 'stock_out' | 'transfer' | 'adjustment';
  quantity: number;
  unit: string;
  source?: string;
  destination?: string;
  reason: string;
  notes?: string;
  user_id: string;
  transaction_date: string;
  created_at: string;
  sync_status: 'pending' | 'synced' | 'failed';
  sync_attempts: number;
}

export interface FacilityTable {
  id: string;
  name: string;
  type: 'warehouse' | 'distribution_center' | 'retail_outlet';
  region: string;
  district: string;
  address: string;
  gps_coordinates?: string;
  contact_person: string;
  contact_phone: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive';
}

export interface TransferTable {
  id: string;
  item_id: string;
  quantity: number;
  unit: string;
  from_facility_id: string;
  to_facility_id: string;
  requested_by: string;
  request_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_transit' | 'delivered' | 'cancelled';
  approved_by?: string;
  approval_date?: string;
  delivery_date?: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced' | 'failed';
}

export interface NotificationTable {
  id: string;
  user_id: string;
  type: 'stock_alert' | 'transfer_update' | 'system_notification';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: string; // JSON string for additional data
}

export class SQLiteDatabase {
  private db: any = null;
  private worker: any = null;
  private readonly DB_NAME = 'IMS_SQLiteDB';
  private readonly DB_VERSION = 1;
  private readonly INDEXEDDB_KEY = 'sqlite_database_blob';
  private isInitialized = false;
  private saveQueue: Array<() => Promise<void>> = [];
  private isSaving = false;

  constructor() {
    this.setupBeforeUnload();
    this.setupOnlineStatus();
  }

  /**
   * Initialize the SQLite database
   */
  async init(): Promise<void> {
    try {
      console.log('🚀 Initializing SQLite Database...');
      
      // Create SQL.js worker
      this.worker = await createDbWorker(
        ['/sql-wasm.wasm'],
        'https://sql.js.org/dist/',
        {}
      );

      // Try to load existing database from IndexedDB
      const existingDb = await this.loadFromIndexedDB();
      
      if (existingDb) {
        console.log('📦 Loaded existing database from IndexedDB');
        this.db = existingDb;
      } else {
        console.log('🆕 Creating new database');
        this.db = this.worker.db;
        await this.createSchema();
        await this.seedInitialData();
      }

      this.isInitialized = true;
      console.log('✅ SQLite Database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SQLite Database:', error);
      throw error;
    }
  }

  /**
   * Create database schema with all tables
   */
  private async createSchema(): Promise<void> {
    const schema = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        role TEXT NOT NULL CHECK (role IN ('admin', 'regional_manager', 'district_manager', 'facility_manager', 'inventory_worker')),
        facility_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- Facilities table
      CREATE TABLE IF NOT EXISTS facilities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('warehouse', 'distribution_center', 'retail_outlet')),
        region TEXT NOT NULL,
        district TEXT NOT NULL,
        address TEXT,
        gps_coordinates TEXT,
        contact_person TEXT,
        contact_phone TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
      );

      -- Inventory items table
      CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        sku TEXT UNIQUE,
        unit TEXT NOT NULL,
        current_stock INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 0,
        max_stock INTEGER DEFAULT 0,
        cost REAL DEFAULT 0,
        supplier TEXT,
        facility_id TEXT NOT NULL,
        location TEXT,
        expiry_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
        FOREIGN KEY (facility_id) REFERENCES facilities (id)
      );

      -- Stock transactions table
      CREATE TABLE IF NOT EXISTS stock_transactions (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL,
        facility_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('stock_in', 'stock_out', 'transfer', 'adjustment')),
        quantity INTEGER NOT NULL,
        unit TEXT NOT NULL,
        source TEXT,
        destination TEXT,
        reason TEXT NOT NULL,
        notes TEXT,
        user_id TEXT NOT NULL,
        transaction_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
        sync_attempts INTEGER DEFAULT 0,
        FOREIGN KEY (item_id) REFERENCES inventory_items (id),
        FOREIGN KEY (facility_id) REFERENCES facilities (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      -- Transfers table
      CREATE TABLE IF NOT EXISTS transfers (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit TEXT NOT NULL,
        from_facility_id TEXT NOT NULL,
        to_facility_id TEXT NOT NULL,
        requested_by TEXT NOT NULL,
        request_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_transit', 'delivered', 'cancelled')),
        approved_by TEXT,
        approval_date TEXT,
        delivery_date TEXT,
        reason TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        notes TEXT,
        tracking_number TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
        FOREIGN KEY (item_id) REFERENCES inventory_items (id),
        FOREIGN KEY (from_facility_id) REFERENCES facilities (id),
        FOREIGN KEY (to_facility_id) REFERENCES facilities (id),
        FOREIGN KEY (requested_by) REFERENCES users (id),
        FOREIGN KEY (approved_by) REFERENCES users (id)
      );

      -- Notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('stock_alert', 'transfer_update', 'system_notification')),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        data TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_inventory_facility ON inventory_items (facility_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_facility ON stock_transactions (facility_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_sync ON stock_transactions (sync_status);
      CREATE INDEX IF NOT EXISTS idx_transfers_sync ON transfers (sync_status);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (read);
    `;

    await this.execute(schema);
  }

  /**
   * Seed initial data for development/testing
   */
  private async seedInitialData(): Promise<void> {
    const now = new Date().toISOString();
    
    // Insert default admin user
    await this.execute(`
      INSERT OR IGNORE INTO users (id, name, email, phone, role, created_at, updated_at)
      VALUES ('admin-1', 'System Administrator', 'admin@ims.com', '+256700000000', 'admin', '${now}', '${now}')
    `);

    // Insert default facilities
    await this.execute(`
      INSERT OR IGNORE INTO facilities (id, name, type, region, district, address, contact_person, contact_phone, created_at, updated_at)
      VALUES 
        ('facility-1', 'Main Warehouse', 'warehouse', 'Central Region', 'Kampala District', 'Kampala, Uganda', 'John Doe', '+256700000001', '${now}', '${now}'),
        ('facility-2', 'Distribution Center', 'distribution_center', 'Central Region', 'Kampala District', 'Kampala, Uganda', 'Jane Smith', '+256700000002', '${now}', '${now}')
    `);

    // Insert sample inventory items
    await this.execute(`
      INSERT OR IGNORE INTO inventory_items (id, name, description, category, sku, unit, current_stock, min_stock, max_stock, cost, supplier, facility_id, location, created_at, updated_at)
      VALUES 
        ('item-1', 'Rice', 'Premium quality rice', 'Grains', 'RICE-001', 'kg', 1000, 100, 2000, 2500, 'Uganda Foods Ltd', 'facility-1', 'A1-S1', '${now}', '${now}'),
        ('item-2', 'Beans', 'Dried beans', 'Grains', 'BEANS-001', 'kg', 500, 50, 1000, 1800, 'Uganda Foods Ltd', 'facility-1', 'A1-S2', '${now}', '${now}'),
        ('item-3', 'Cooking Oil', 'Vegetable cooking oil', 'Oils', 'OIL-001', 'liters', 200, 20, 500, 3500, 'Oil Suppliers Co', 'facility-1', 'A2-S1', '${now}', '${now}')
    `);
  }

  /**
   * Execute SQL query
   */
  async execute(sql: string, params: any[] = []): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call init() first.');
    }

    try {
      const result = this.db.exec(sql, params);
      await this.queueSave();
      return result;
    } catch (error) {
      console.error('SQL execution error:', error);
      throw error;
    }
  }

  /**
   * Execute SELECT query and return results
   */
  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call init() first.');
    }

    try {
      const result = this.db.exec(sql, params);
      return result[0]?.values || [];
    } catch (error) {
      console.error('SQL query error:', error);
      throw error;
    }
  }

  /**
   * Save database to IndexedDB
   */
  async saveToIndexedDB(): Promise<void> {
    try {
      if (!this.db) {
        console.warn('No database to save');
        return;
      }

      const dbBlob = this.db.export();
      const indexedDB = window.indexedDB;
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('sqlite_data')) {
          db.createObjectStore('sqlite_data', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(['sqlite_data'], 'readwrite');
        const store = transaction.objectStore('sqlite_data');
        
        const saveRequest = store.put({
          key: this.INDEXEDDB_KEY,
          data: dbBlob,
          timestamp: Date.now()
        });

        saveRequest.onsuccess = () => {
          console.log('💾 Database saved to IndexedDB');
        };

        saveRequest.onerror = (error: any) => {
          console.error('❌ Failed to save database to IndexedDB:', error);
        };
      };

      request.onerror = (error: any) => {
        console.error('❌ Failed to open IndexedDB:', error);
      };
    } catch (error) {
      console.error('❌ Error saving database:', error);
      throw error;
    }
  }

  /**
   * Load database from IndexedDB
   */
  async loadFromIndexedDB(): Promise<any | null> {
    try {
      return new Promise((resolve, reject) => {
        const indexedDB = window.indexedDB;
        const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('sqlite_data')) {
            db.createObjectStore('sqlite_data', { keyPath: 'key' });
          }
        };

        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const transaction = db.transaction(['sqlite_data'], 'readonly');
          const store = transaction.objectStore('sqlite_data');
          const getRequest = store.get(this.INDEXEDDB_KEY);

          getRequest.onsuccess = () => {
            if (getRequest.result) {
              console.log('📦 Loading database from IndexedDB');
              const dbBlob = getRequest.result.data;
              const newDb = this.worker.db.import(dbBlob);
              resolve(newDb);
            } else {
              console.log('📦 No existing database found in IndexedDB');
              resolve(null);
            }
          };

          getRequest.onerror = (error: any) => {
            console.error('❌ Failed to load database from IndexedDB:', error);
            reject(error);
          };
        };

        request.onerror = (error: any) => {
          console.error('❌ Failed to open IndexedDB:', error);
          reject(error);
        };
      });
    } catch (error) {
      console.error('❌ Error loading database:', error);
      return null;
    }
  }

  /**
   * Reset database (clear from IndexedDB)
   */
  async resetDatabase(): Promise<void> {
    try {
      const indexedDB = window.indexedDB;
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(['sqlite_data'], 'readwrite');
        const store = transaction.objectStore('sqlite_data');
        const deleteRequest = store.delete(this.INDEXEDDB_KEY);

        deleteRequest.onsuccess = () => {
          console.log('🗑️ Database cleared from IndexedDB');
        };

        deleteRequest.onerror = (error: any) => {
          console.error('❌ Failed to clear database from IndexedDB:', error);
        };
      };

      // Reinitialize database
      this.isInitialized = false;
      await this.init();
    } catch (error) {
      console.error('❌ Error resetting database:', error);
      throw error;
    }
  }

  /**
   * Export database for download
   */
  async exportDatabase(): Promise<void> {
    try {
      if (!this.db) {
        throw new Error('No database to export');
      }

      const dbBlob = this.db.export();
      const blob = new Blob([dbBlob], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ims_database_${new Date().toISOString().split('T')[0]}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('📤 Database exported successfully');
    } catch (error) {
      console.error('❌ Error exporting database:', error);
      throw error;
    }
  }

  /**
   * Queue save operation to prevent multiple simultaneous saves
   */
  private async queueSave(): Promise<void> {
    return new Promise((resolve) => {
      this.saveQueue.push(async () => {
        await this.saveToIndexedDB();
        resolve();
      });

      if (!this.isSaving) {
        this.processSaveQueue();
      }
    });
  }

  /**
   * Process save queue
   */
  private async processSaveQueue(): Promise<void> {
    if (this.saveQueue.length === 0) {
      this.isSaving = false;
      return;
    }

    this.isSaving = true;
    const saveOperation = this.saveQueue.shift();
    
    if (saveOperation) {
      await saveOperation();
    }

    // Process next item in queue
    setTimeout(() => this.processSaveQueue(), 100);
  }

  /**
   * Setup beforeunload event to save database
   */
  private setupBeforeUnload(): void {
    window.addEventListener('beforeunload', async (event) => {
      if (this.isInitialized) {
        console.log('🔄 Saving database before page unload...');
        await this.saveToIndexedDB();
      }
    });
  }

  /**
   * Setup online/offline status monitoring
   */
  private setupOnlineStatus(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Back online - database sync available');
    });

    window.addEventListener('offline', () => {
      console.log('📴 Offline mode - using local database');
    });
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalUsers: number;
    totalItems: number;
    totalTransactions: number;
    totalTransfers: number;
    pendingSync: number;
    lastSave: string | null;
  }> {
    try {
      const stats = await this.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM inventory_items) as total_items,
          (SELECT COUNT(*) FROM stock_transactions) as total_transactions,
          (SELECT COUNT(*) FROM transfers) as total_transfers,
          (SELECT COUNT(*) FROM stock_transactions WHERE sync_status = 'pending') +
          (SELECT COUNT(*) FROM transfers WHERE sync_status = 'pending') as pending_sync
      `);

      const lastSave = await this.getLastSaveTime();

      return {
        totalUsers: stats[0]?.[0] || 0,
        totalItems: stats[0]?.[1] || 0,
        totalTransactions: stats[0]?.[2] || 0,
        totalTransfers: stats[0]?.[3] || 0,
        pendingSync: stats[0]?.[4] || 0,
        lastSave
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {
        totalUsers: 0,
        totalItems: 0,
        totalTransactions: 0,
        totalTransfers: 0,
        pendingSync: 0,
        lastSave: null
      };
    }
  }

  /**
   * Get last save time
   */
  private async getLastSaveTime(): Promise<string | null> {
    try {
      const indexedDB = window.indexedDB;
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      return new Promise((resolve) => {
        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const transaction = db.transaction(['sqlite_data'], 'readonly');
          const store = transaction.objectStore('sqlite_data');
          const getRequest = store.get(this.INDEXEDDB_KEY);

          getRequest.onsuccess = () => {
            if (getRequest.result) {
              resolve(new Date(getRequest.result.timestamp).toISOString());
            } else {
              resolve(null);
            }
          };

          getRequest.onerror = () => resolve(null);
        };

        request.onerror = () => resolve(null);
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Get database instance (for advanced operations)
   */
  getDatabase(): any {
    return this.db;
  }

  /**
   * Check if database is initialized
   */
  isInitialized(): boolean {
    return this.isInitialized;
  }
}

// Create singleton instance
export const sqliteDB = new SQLiteDatabase(); 