import { useState, useEffect, useCallback } from 'react';
import { FirebaseDatabaseService, InventoryItem, StockTransaction, Facility, Transfer } from '../services/firebaseDatabase';

export const useFirebaseDatabase = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [items, transactions, facilitiesData, transfersData, usersData] = await Promise.all([
          FirebaseDatabaseService.getInventoryItems(),
          FirebaseDatabaseService.getStockTransactions(),
          FirebaseDatabaseService.getFacilities(),
          FirebaseDatabaseService.getTransfers(),
          FirebaseDatabaseService.getUsers()
        ]);
        
        setInventoryItems(items);
        setStockTransactions(transactions);
        setFacilities(facilitiesData);
        setTransfers(transfersData);
        setUsers(usersData);
      } catch (error: any) {
        setError(error.message);
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Real-time listeners
  useEffect(() => {
    const unsubscribeInventory = FirebaseDatabaseService.onInventoryItemsChange(setInventoryItems);
    const unsubscribeTransactions = FirebaseDatabaseService.onStockTransactionsChange(setStockTransactions);
    const unsubscribeTransfers = FirebaseDatabaseService.onTransfersChange(setTransfers);
    const unsubscribeUsers = FirebaseDatabaseService.onUsersChange(setUsers);

    return () => {
      unsubscribeInventory();
      unsubscribeTransactions();
      unsubscribeTransfers();
      unsubscribeUsers();
    };
  }, []);

  // Inventory operations
  const addInventoryItem = useCallback(async (item: Omit<InventoryItem, 'id'>) => {
    try {
      setError(null);
      await FirebaseDatabaseService.addInventoryItem(item);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  const updateInventoryItem = useCallback(async (id: string, item: Partial<InventoryItem>) => {
    try {
      setError(null);
      await FirebaseDatabaseService.updateInventoryItem(id, item);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  const deleteInventoryItem = useCallback(async (id: string) => {
    try {
      setError(null);
      await FirebaseDatabaseService.deleteInventoryItem(id);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Stock transaction operations
  const addTransaction = useCallback(async (transaction: Omit<StockTransaction, 'id'>) => {
    try {
      setError(null);
      await FirebaseDatabaseService.addTransaction(transaction);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, transaction: Partial<StockTransaction>) => {
    try {
      setError(null);
      await FirebaseDatabaseService.updateTransaction(id, transaction);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      setError(null);
      await FirebaseDatabaseService.deleteTransaction(id);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Get transactions (alias for backward compatibility)
  const getTransactions = useCallback(() => stockTransactions, [stockTransactions]);

  // Facility operations
  const addFacility = useCallback(async (facility: Omit<Facility, 'id'>) => {
    try {
      setError(null);
      await FirebaseDatabaseService.addFacility(facility);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  const updateFacility = useCallback(async (id: string, facility: Partial<Facility>) => {
    try {
      setError(null);
      await FirebaseDatabaseService.updateFacility(id, facility);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  const deleteFacility = useCallback(async (id: string) => {
    try {
      setError(null);
      await FirebaseDatabaseService.deleteFacility(id);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Transfer operations
  const addTransfer = useCallback(async (transfer: Omit<Transfer, 'id'>) => {
    try {
      setError(null);
      await FirebaseDatabaseService.addTransfer(transfer);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  const updateTransfer = useCallback(async (id: string, transfer: Partial<Transfer>) => {
    try {
      setError(null);
      await FirebaseDatabaseService.updateTransfer(id, transfer);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  const deleteTransfer = useCallback(async (id: string) => {
    try {
      setError(null);
      await FirebaseDatabaseService.deleteTransfer(id);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Search and filtering
  const searchInventoryItems = useCallback(async (searchTerm: string) => {
    try {
      setError(null);
      return await FirebaseDatabaseService.searchInventoryItems(searchTerm);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  const getLowStockItems = useCallback(async () => {
    try {
      setError(null);
      return await FirebaseDatabaseService.getLowStockItems();
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Batch operations
  const batchUpdate = useCallback(async (updates: Array<{ collection: string; id: string; data: any }>) => {
    try {
      setError(null);
      await FirebaseDatabaseService.batchUpdate(updates);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  // User operations
  const addUser = useCallback(async (user: any) => {
    try {
      setError(null);
      await FirebaseDatabaseService.addUser(user);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (id: string, user: Partial<any>) => {
    try {
      setError(null);
      await FirebaseDatabaseService.updateUser(id, user);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    try {
      setError(null);
      await FirebaseDatabaseService.deleteUser(id);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  return {
    // Data
    inventoryItems,
    stockTransactions,
    facilities,
    transfers,
    users,
    loading,
    error,
    
    // Inventory operations
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    
    // Transaction operations
    transactions: stockTransactions, // Alias for backward compatibility
    addTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Facility operations
    addFacility,
    updateFacility,
    deleteFacility,
    
    // Transfer operations
    addTransfer,
    updateTransfer,
    deleteTransfer,
    
    // User operations
    addUser,
    updateUser,
    deleteUser,
    
    // Utility methods
    searchInventoryItems,
    getLowStockItems,
    getTransactions,
    batchUpdate,
    syncAuthUsersToFirestore: FirebaseDatabaseService.syncAuthUsersToFirestore,
    syncAllAuthUsersToFirestore: FirebaseDatabaseService.syncAllAuthUsersToFirestore
  };
}; 