import { useState, useEffect, useCallback } from 'react';
import { FirebaseDatabaseService, InventoryItem, StockTransaction, Facility, Transfer } from '../services/firebaseDatabase';

export const useFirebaseDatabase = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [items, transactions, facilitiesData, transfersData] = await Promise.all([
          FirebaseDatabaseService.getInventoryItems(),
          FirebaseDatabaseService.getStockTransactions(),
          FirebaseDatabaseService.getFacilities(),
          FirebaseDatabaseService.getTransfers()
        ]);
        
        setInventoryItems(items);
        setStockTransactions(transactions);
        setFacilities(facilitiesData);
        setTransfers(transfersData);
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

    return () => {
      unsubscribeInventory();
      unsubscribeTransactions();
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
  const addStockTransaction = useCallback(async (transaction: Omit<StockTransaction, 'id'>) => {
    try {
      setError(null);
      await FirebaseDatabaseService.addStockTransaction(transaction);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  const updateStockTransaction = useCallback(async (id: string, transaction: Partial<StockTransaction>) => {
    try {
      setError(null);
      await FirebaseDatabaseService.updateStockTransaction(id, transaction);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

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

  return {
    // Data
    inventoryItems,
    stockTransactions,
    facilities,
    transfers,
    
    // State
    loading,
    error,
    
    // Operations
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addStockTransaction,
    updateStockTransaction,
    addFacility,
    updateFacility,
    deleteFacility,
    addTransfer,
    updateTransfer,
    searchInventoryItems,
    getLowStockItems,
    batchUpdate
  };
}; 