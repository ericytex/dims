import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useOffline } from '../contexts/OfflineContext';
import { useFirebaseDatabase } from '../hooks/useFirebaseDatabase';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { BarcodeScannerComponent } from '../components/BarcodeScanner';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  Package,
  AlertTriangle,
  Calendar,
  MapPin,
  Users,
  TrendingUp,
  TrendingDown,
  X,
  QrCode
} from 'lucide-react';

interface InventoryItem {
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
}

export default function InventoryManagement() {
  const { showNotification } = useNotification();
  const { isOnline, addOfflineInventoryUpdate, syncOfflineData, isSyncing, pendingCount } = useOffline();
  const { user } = useFirebaseAuth();
  const { 
    inventoryItems, 
    loading, 
    error, 
    addInventoryItem, 
    updateInventoryItem, 
    deleteInventoryItem 
  } = useFirebaseDatabase();

  // State for offline items
  const [offlineItems, setOfflineItems] = useState<InventoryItem[]>([]);

  // Load offline items
  useEffect(() => {
    const loadOfflineItems = async () => {
      try {
        const { offlineDB } = await import('../services/OfflineDatabase');
        const pendingItems = await offlineDB.getAllPendingItems();
        const offlineInventoryItems = pendingItems.inventory.map(item => ({
          id: item.id,
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
          facility: item.facility,
          location: item.location,
          expiryDate: item.expiryDate,
          lastUpdated: item.lastUpdated,
          status: item.status
        }));
        setOfflineItems(offlineInventoryItems);
      } catch (error) {
        console.error('Failed to load offline items:', error);
      }
    };

    loadOfflineItems();
  }, [pendingCount]); // Reload when pending count changes

  // Combine Firebase and offline items
  const allInventoryItems = [...inventoryItems, ...offlineItems];

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form state for adding/editing items
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    sku: '',
    unit: '',
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    cost: 0,
    supplier: '',
    facility: '',
    location: '',
    expiryDate: '',
    status: 'active' as const,
    _scanningForSku: false // Flag to indicate if scanning for SKU
  });

  // Filter inventory items
  const filteredInventory = allInventoryItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !filterCategory || item.category === filterCategory;
      const matchesStatus = !filterStatus || item.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });

  const handleAddItem = () => {
    clearFormFields();
    setShowAddModal(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
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
      facility: item.facility,
      location: item.location,
      expiryDate: item.expiryDate || '',
      status: item.status,
      _scanningForSku: false
    });
    setShowEditModal(true);
  };

  const handleViewItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await deleteInventoryItem(item.id);
        showNotification('Item deleted successfully', 'success');
      } catch (error: any) {
        showNotification(`Error deleting item: ${error.message}`, 'error');
      }
    }
  };

  const handleSaveItem = async () => {
    try {
      if (!user) {
        showNotification('You must be logged in to perform this action', 'error');
        return;
      }

      const itemData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        sku: formData.sku,
        unit: formData.unit,
        currentStock: formData.currentStock,
        minStock: formData.minStock,
        maxStock: formData.maxStock,
        cost: formData.cost,
        supplier: formData.supplier,
        facility: formData.facility,
        location: formData.location,
        expiryDate: formData.expiryDate || undefined,
        status: formData.status,
        lastUpdated: new Date().toISOString()
      };

      if (showEditModal && selectedItem) {
        if (isOnline) {
          await updateInventoryItem(selectedItem.id, itemData);
          showNotification('Item updated successfully', 'success');
        } else {
          // Offline update - store locally
          await addOfflineInventoryUpdate({
            ...itemData,
            id: selectedItem.id,
            type: 'update'
          });
          showNotification('Item updated offline - will sync when online', 'success');
        }
        setShowEditModal(false);
        setSelectedItem(null);
      } else {
        if (isOnline) {
          await addInventoryItem(itemData);
          showNotification(`✅ Item "${formData.name}" added successfully! Ready for next item.`, 'success');
        } else {
          // Offline add - store locally
          await addOfflineInventoryUpdate({
            ...itemData,
            type: 'add'
          });
          showNotification(`✅ Item "${formData.name}" added offline! Will sync when online.`, 'success');
        }
        
        // Clear all form fields for next item
        clearFormFields();
        
        // Keep modal open for next item entry
        // Don't close the modal - let user continue adding items
        setSelectedItem(null);
      }
    } catch (error: any) {
      showNotification(`Error saving item: ${error.message}`, 'error');
    }
  };

  const getStockStatus = (current: number, min: number) => {
    if (current <= min) return 'low';
    if (current <= min * 1.5) return 'medium';
    return 'good';
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'good': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'inactive':
        return 'text-gray-600 bg-gray-100';
      case 'discontinued':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStockLevelIndicator = (current: number, min: number, max: number) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    
    if (current <= min) {
      return {
        color: 'bg-red-500',
        progressColor: 'bg-red-500',
        percentage: Math.min(percentage, 100),
        level: 'critical'
      };
    } else if (current <= min * 1.5) {
      return {
        color: 'bg-yellow-500',
        progressColor: 'bg-yellow-500',
        percentage: Math.min(percentage, 100),
        level: 'low'
      };
    } else if (current >= max * 0.8) {
      return {
        color: 'bg-green-500',
        progressColor: 'bg-green-500',
        percentage: Math.min(percentage, 100),
        level: 'high'
      };
    } else {
      return {
        color: 'bg-blue-500',
        progressColor: 'bg-blue-500',
        percentage: Math.min(percentage, 100),
        level: 'normal'
      };
    }
  };

  // Barcode scanning functionality
  const handleBarcodeScan = (barcode: string) => {
    console.log('Searching for barcode:', barcode);
    
    // Check if we're scanning for SKU in Add Item modal
    if (formData._scanningForSku) {
      console.log('Scanning for SKU in Add Item modal');
      setFormData(prev => ({ 
        ...prev, 
        sku: barcode,
        _scanningForSku: false // Reset the flag
      }));
      setShowBarcodeScanner(false);
      showNotification(`SKU scanned: ${barcode}`, 'success');
      return;
    }
    
    // Use enhanced search function for inventory search
    const foundItem = searchByBarcode(barcode);
    
    if (foundItem) {
      // If found, set search term to the scanned barcode to filter the list
      setSearchTerm(barcode);
      
      // Stop scanning immediately
      setShowBarcodeScanner(false);
      
      // Show success notification
      showNotification(`Found item: ${foundItem.name} (SKU: ${foundItem.sku})`, 'success');
      console.log('Item found:', foundItem);
      
      // Show the item details immediately
      handleViewItem(foundItem);
      
      // Scroll to the item in the list after a brief delay
      setTimeout(() => {
        const element = document.getElementById(`item-${foundItem.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else {
      // If not found, stop scanning and pre-fill the add form
      setShowBarcodeScanner(false);
      setFormData(prev => ({
        ...prev,
        sku: barcode
      }));
      setShowAddModal(true);
      showNotification(`Barcode ${barcode} not found. You can add a new item.`, 'info');
      console.log('Item not found, opening add modal');
    }
  };

  const handleOpenBarcodeScanner = () => {
    setShowBarcodeScanner(true);
  };

  // Enhanced barcode search function
  const searchByBarcode = (barcode: string) => {
    console.log('Searching for barcode:', barcode);
    console.log('Available inventory items:', inventoryItems.map(item => ({ name: item.name, sku: item.sku })));
    
    // Search by exact SKU match
    const foundBySku = inventoryItems.find(item => item.sku === barcode);
    if (foundBySku) {
      console.log('Found by exact SKU:', foundBySku);
      return foundBySku;
    }

    // Search by SKU with leading zeros removed
    const barcodeWithoutLeadingZeros = barcode.replace(/^0+/, '');
    const foundBySkuWithoutZeros = inventoryItems.find(item => item.sku === barcodeWithoutLeadingZeros);
    if (foundBySkuWithoutZeros) {
      console.log('Found by SKU without leading zeros:', foundBySkuWithoutZeros);
      return foundBySkuWithoutZeros;
    }

    // Search by SKU with leading zeros added
    const barcodeWithLeadingZeros = barcode.padStart(12, '0');
    const foundBySkuWithZeros = inventoryItems.find(item => item.sku === barcodeWithLeadingZeros);
    if (foundBySkuWithZeros) {
      console.log('Found by SKU with leading zeros:', foundBySkuWithZeros);
      return foundBySkuWithZeros;
    }

    // Search by name (in case barcode is stored in name)
    const foundByName = inventoryItems.find(item => 
      item.name.toLowerCase().includes(barcode.toLowerCase())
    );
    if (foundByName) {
      console.log('Found by name:', foundByName);
      return foundByName;
    }

    // Search by description
    const foundByDescription = inventoryItems.find(item => 
      item.description?.toLowerCase().includes(barcode.toLowerCase())
    );
    if (foundByDescription) {
      console.log('Found by description:', foundByDescription);
      return foundByDescription;
    }

    console.log('No item found for barcode:', barcode);
    return null;
  };

  // Function to add a test item for barcode scanning
  const addTestItemForScanning = async () => {
    const testItem = {
      name: 'Test Product - Barcode Scanner',
      description: 'Test item for barcode scanning functionality',
      category: 'Test',
      sku: '0072782051600', // Updated to match the scanned barcode
      unit: 'pieces',
      currentStock: 50,
      minStock: 10,
      maxStock: 100,
      cost: 25000,
      supplier: 'Test Supplier',
      facility: 'Test Facility',
      location: 'Test Location',
      status: 'active' as const
    };

    try {
      await addInventoryItem(testItem);
      showNotification('Test item added successfully!', 'success');
    } catch (error) {
      showNotification('Failed to add test item', 'error');
    }
  };

  // Helper function to check if an item is offline
  const isOfflineItem = (item: InventoryItem) => {
    return offlineItems.some(offlineItem => offlineItem.id === item.id);
  };

  // Helper function to clear form fields
  const clearFormFields = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      sku: '',
      unit: '',
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      cost: 0,
      supplier: '',
      facility: '',
      location: '',
      expiryDate: '',
      status: 'active' as const,
      _scanningForSku: false
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading inventory...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading inventory: {error}</div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Items',
      value: inventoryItems.length.toString(),
      change: '+5%',
      changeType: 'increase' as const,
      Icon: Package
    },
    {
      name: 'Low Stock Items',
      value: inventoryItems.filter(item => getStockStatus(item.currentStock, item.minStock) === 'low').length.toString(),
      change: '-2%',
      changeType: 'decrease' as const,
      Icon: AlertTriangle
    },
    {
      name: 'Total Value',
      value: `UGX ${inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.cost), 0).toLocaleString()}`,
      change: '+12%',
      changeType: 'increase' as const,
      Icon: TrendingUp
    },
    {
      name: 'Active Items',
      value: inventoryItems.filter(item => item.status === 'active').length.toString(),
      change: '+3%',
      changeType: 'increase' as const,
      Icon: Users
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-sm text-gray-600">Manage your inventory items and stock levels</p>
            </div>
            <button
              onClick={handleAddItem}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-uganda-yellow hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uganda-yellow transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Indicators */}
        <div className="space-y-4 mb-8">
          {/* Offline Status Indicator */}
          {!isOnline && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Offline Mode</h3>
                    <p className="text-sm text-yellow-700">
                      You're currently offline. Items will be saved locally and synced when you're back online.
                    </p>
                  </div>
                </div>
                <div className="text-sm text-yellow-700 font-medium">
                  Pending: {pendingCount} items
                </div>
              </div>
            </div>
          )}

          {/* Online Sync Status */}
          {isOnline && pendingCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Sync Available</h3>
                    <p className="text-sm text-blue-700">
                      You have {pendingCount} offline items ready to sync.
                    </p>
                  </div>
                </div>
                <button
                  onClick={syncOfflineData}
                  disabled={isSyncing}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {isSyncing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Syncing...
                    </>
                  ) : (
                    'Sync Now'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.Icon;
            return (
              <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-uganda-yellow rounded-md p-3">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                        <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="flex items-center">
                    {stat.changeType === 'increase' ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`ml-2 text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">from last month</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Filters & Search</h3>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Items</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Search by name, SKU, or description..."
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <div className="mt-1 text-sm text-blue-600 flex items-center">
                    <QrCode className="w-3 h-3 mr-1" />
                    Filtered by: {searchTerm}
                  </div>
                )}
              </div>

              {/* Barcode Scanner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Barcode Scanner</label>
                <button
                  onClick={handleOpenBarcodeScanner}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan Barcode
                </button>
                <button
                  onClick={addTestItemForScanning}
                  className="w-full mt-2 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uganda-yellow transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Test Item
                </button>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-uganda-yellow focus:border-uganda-yellow"
                >
                  <option value="">All Categories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Safety Equipment">Safety Equipment</option>
                  <option value="Industrial Equipment">Industrial Equipment</option>
                  <option value="Lighting">Lighting</option>
                  <option value="Tools">Tools</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Food & Beverages">Food & Beverages</option>
                </select>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-uganda-yellow focus:border-uganda-yellow"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Inventory Items</h3>
              <div className="text-sm text-gray-500">
                {filteredInventory.length} of {allInventoryItems.length} items
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item.currentStock, item.minStock);
                  const isOffline = isOfflineItem(item);
                  const stockLevel = getStockLevelIndicator(item.currentStock, item.minStock, item.maxStock);
                  
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 ${isOffline ? 'bg-yellow-50' : ''}`} id={`item-${item.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-3 h-3 rounded-full ${stockLevel.color}`}></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              {isOffline && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Offline
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-400">Supplier: {item.supplier}</span>
                              {item.location && (
                                <span className="text-xs text-gray-400">• Location: {item.location}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{item.sku}</div>
                        <div className="text-xs text-gray-500 mt-1">Last updated: {new Date(item.lastUpdated).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {item.currentStock} {item.unit}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(stockStatus)}`}>
                                {stockStatus}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${stockLevel.progressColor}`}
                                style={{ width: `${stockLevel.percentage}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Min: {item.minStock}</span>
                              <span>Max: {item.maxStock}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">UGX {item.cost.toLocaleString()}</div>
                        <div className="text-xs text-gray-500 mt-1">Per {item.unit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-gray-900">{item.facility}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status === 'active' && <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></div>}
                          {item.status === 'inactive' && <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5"></div>}
                          {item.status === 'discontinued' && <div className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5"></div>}
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewItem(item)}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditItem(item)}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                            title="Edit Item"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Item</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter item name"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter item description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-uganda-yellow focus:border-uganda-yellow"
                  >
                    <option value="">Select Category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Safety Equipment">Safety Equipment</option>
                    <option value="Industrial Equipment">Industrial Equipment</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Tools">Tools</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Food & Beverages">Food & Beverages</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-uganda-yellow focus:border-uganda-yellow"
                      placeholder="Enter SKU or scan barcode"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowBarcodeScanner(true);
                        setFormData(prev => ({ ...prev, _scanningForSku: true }));
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      title="Scan barcode for SKU"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Scan</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-uganda-yellow focus:border-uganda-yellow"
                  >
                    <option value="">Select Unit</option>
                    <option value="pieces">Pieces</option>
                    <option value="units">Units</option>
                    <option value="boxes">Boxes</option>
                    <option value="pairs">Pairs</option>
                    <option value="sets">Sets</option>
                    <option value="reams">Reams</option>
                    <option value="liters">Liters</option>
                    <option value="kilograms">Kilograms</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock</label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({...formData, currentStock: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Stock</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({...formData, minStock: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Stock</label>
                  <input
                    type="number"
                    value={formData.maxStock}
                    onChange={(e) => setFormData({...formData, maxStock: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cost (UGX)</label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier *</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter supplier name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Facility</label>
                  <select
                    value={formData.facility}
                    onChange={(e) => setFormData({...formData, facility: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-uganda-yellow focus:border-uganda-yellow"
                  >
                    <option value="">Select Facility</option>
                    <option value="Main Warehouse">Main Warehouse</option>
                    <option value="Distribution Center">Distribution Center</option>
                    <option value="Retail Outlet">Retail Outlet</option>
                    <option value="Regional Office">Regional Office</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter storage location"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-uganda-yellow focus:border-uganda-yellow"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-uganda-yellow focus:border-uganda-yellow"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uganda-yellow transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveItem}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-uganda-yellow hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uganda-yellow transition-colors"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Item</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter item name"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter item description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                  >
                    <option value="">Select Category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Safety Equipment">Safety Equipment</option>
                    <option value="Industrial Equipment">Industrial Equipment</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Tools">Tools</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Food & Beverages">Food & Beverages</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                      placeholder="Enter SKU or scan barcode"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowBarcodeScanner(true);
                        // Set a flag to indicate this is for SKU scanning
                        setFormData(prev => ({ ...prev, _scanningForSku: true }));
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                      title="Scan barcode for SKU"
                    >
                      <QrCode className="w-4 h-4" />
                      <span className="hidden sm:inline">Scan</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                  >
                    <option value="">Select Unit</option>
                    <option value="pieces">Pieces</option>
                    <option value="units">Units</option>
                    <option value="boxes">Boxes</option>
                    <option value="pairs">Pairs</option>
                    <option value="sets">Sets</option>
                    <option value="reams">Reams</option>
                    <option value="liters">Liters</option>
                    <option value="kilograms">Kilograms</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({...formData, currentStock: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({...formData, minStock: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock</label>
                  <input
                    type="number"
                    value={formData.maxStock}
                    onChange={(e) => setFormData({...formData, maxStock: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost (UGX)</label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter supplier name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facility</label>
                  <select
                    value={formData.facility}
                    onChange={(e) => setFormData({...formData, facility: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                  >
                    <option value="">Select Facility</option>
                    <option value="Main Warehouse">Main Warehouse</option>
                    <option value="Distribution Center">Distribution Center</option>
                    <option value="Regional Warehouse">Regional Warehouse</option>
                    <option value="Retail Store">Retail Store</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter storage location"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveItem}
                  className="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  Update Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Item Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900">{selectedItem.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <p className="text-gray-900">{selectedItem.sku}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <p className="text-gray-900">{selectedItem.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <p className="text-gray-900">{selectedItem.unit}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                  <p className="text-gray-900">{selectedItem.currentStock} {selectedItem.unit}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                  <p className="text-gray-900">UGX {selectedItem.cost.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <p className="text-gray-900">{selectedItem.supplier}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facility</label>
                  <p className="text-gray-900">{selectedItem.facility}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <p className="text-gray-900">{selectedItem.location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedItem.status)}`}>
                    {selectedItem.status}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900">{selectedItem.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                  <p className="text-gray-900">{selectedItem.minStock}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock</label>
                  <p className="text-gray-900">{selectedItem.maxStock}</p>
                </div>
                {selectedItem.expiryDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <p className="text-gray-900">{selectedItem.expiryDate}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                  <p className="text-gray-900">{selectedItem.lastUpdated}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerComponent
        isOpen={showBarcodeScanner}
        onScan={handleBarcodeScan}
        onClose={() => setShowBarcodeScanner(false)}
      />
    </div>
  );
}