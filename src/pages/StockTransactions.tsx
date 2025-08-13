import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useOffline } from '../contexts/OfflineContext';
import { useFirebaseDatabase } from '../hooks/useFirebaseDatabase';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  ArrowUpDown,
  Calendar,
  MapPin,
  Package,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'stock_in' | 'stock_out' | 'transfer' | 'adjustment';
  item: string;
  quantity: number;
  unit: string;
  facility: string;
  source?: string;
  destination?: string;
  reason: string;
  notes?: string;
  user: string;
  date: string;
  time: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export default function StockTransactions() {
  const { stockTransactions, facilities, inventoryItems, users, addTransaction, updateTransaction, deleteTransaction } = useFirebaseDatabase();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedFacility, setSelectedFacility] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    type: 'stock_in' as const,
    item: '',
    quantity: 0,
    unit: 'pieces',
    facility: 'Main Warehouse',
    source: '',
    destination: '',
    reason: '',
    notes: '',
    status: 'completed' as const
  });
  const { addNotification } = useNotification();
  const { isOnline, addOfflineTransaction } = useOffline();

  // Load real data from Firebase
  useEffect(() => {
    if (stockTransactions && stockTransactions.length > 0) {
      const mappedTransactions: Transaction[] = stockTransactions.map(tx => {
        // Find the related inventory item
        const inventoryItem = inventoryItems?.find(item => item.id === tx.itemId);
        // Find the related facility
        const facility = facilities?.find(f => f.id === tx.facilityId);
        // Find the related user
        const user = users?.find(u => u.id === tx.userId);
        
        return {
          id: tx.id || '',
          type: tx.type as 'stock_in' | 'stock_out' | 'transfer' | 'adjustment',
          item: inventoryItem?.name || `Item ID: ${tx.itemId}`,
          quantity: tx.quantity,
          unit: tx.unit,
          facility: facility?.name || `Facility ID: ${tx.facilityId}`,
          source: tx.source,
          destination: tx.destination,
          reason: tx.reason,
          notes: tx.notes,
          user: user?.name || `User ID: ${tx.userId}`,
          date: tx.transactionDate || new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          status: 'completed' as const // Default status since StockTransaction doesn't have status
        };
      });
      setTransactions(mappedTransactions);
    }
  }, [stockTransactions, inventoryItems, facilities, users]);

  const transactionTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'stock_in', label: 'Stock In' },
    { value: 'stock_out', label: 'Stock Out' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'adjustment', label: 'Adjustment' }
  ];

  // Use real facilities from Firebase
  const facilityOptions = [
    { value: 'all', label: 'All Facilities' },
    ...(facilities || []).map(f => ({ value: f.name, label: f.name }))
  ];

  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || transaction.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
    const matchesFacility = selectedFacility === 'all' || transaction.facility === selectedFacility;
    return matchesSearch && matchesType && matchesStatus && matchesFacility;
  });

  const handleAddTransaction = () => {
    setModalType('add');
    setSelectedTransaction(null);
    const defaultFacility = facilities && facilities.length > 0 ? facilities[0].name : 'Main Warehouse';
    setFormData({
      type: 'stock_in',
      item: '',
      quantity: 0,
      unit: 'pieces',
      facility: defaultFacility,
      source: '',
      destination: '',
      reason: '',
      notes: '',
      status: 'completed'
    });
    setShowModal(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setModalType('edit');
    setSelectedTransaction(transaction);
    setFormData({
      type: transaction.type,
      item: transaction.item,
      quantity: transaction.quantity,
      unit: transaction.unit,
      facility: transaction.facility,
      source: transaction.source || '',
      destination: transaction.destination || '',
      reason: transaction.reason,
      notes: transaction.notes || '',
      status: transaction.status
    });
    setShowModal(true);
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setModalType('view');
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (window.confirm(`Are you sure you want to delete this transaction?`)) {
      try {
        await deleteTransaction(transaction.id);
        addNotification('Transaction deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting transaction:', error);
        addNotification('Failed to delete transaction. Please try again.', 'error');
      }
    }
  };

  const handleCreateSampleTransactions = async () => {
    if (!inventoryItems || inventoryItems.length === 0) {
      addNotification('No inventory items found. Please add some inventory items first.', 'error');
      return;
    }

    try {
      // If no facilities exist, create sample facilities first
      if (!facilities || facilities.length === 0) {
        addNotification('No facilities found. Creating sample facilities first...', 'info');
        
        const sampleFacilities = [
          {
            name: 'Main Warehouse',
            type: 'warehouse' as const,
            region: 'Central',
            district: 'Kampala',
            address: 'Industrial Area, Kampala',
            gpsCoordinates: '0.3354,32.5851',
            contactPerson: 'John Mukasa',
            contactPhone: '+256700000001',
            status: 'active' as const
          },
          {
            name: 'Distribution Center',
            type: 'distribution_center' as const,
            region: 'Central',
            district: 'Kampala',
            address: 'Nakawa Division, Kampala',
            gpsCoordinates: '0.3676,32.5851',
            contactPerson: 'Mary Nambi',
            contactPhone: '+256700000002',
            status: 'active' as const
          },
          {
            name: 'Regional Warehouse',
            type: 'warehouse' as const,
            region: 'Central',
            district: 'Kampala',
            address: 'Makindye Division, Kampala',
            gpsCoordinates: '0.2743,32.5851',
            contactPerson: 'Sarah Nakato',
            contactPhone: '+256700000003',
            status: 'active' as const
          }
        ];
        
        for (const facility of sampleFacilities) {
          await addFacility(facility);
        }
        
        addNotification('Sample facilities created successfully!', 'success');
        
        // Wait a moment for the facilities to be loaded
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Now create sample transactions
      const currentFacilities = facilities || [];
      if (currentFacilities.length === 0) {
        addNotification('Still no facilities available. Please try again.', 'error');
        return;
      }

      // Filter inventory items to only use those with valid IDs
      const validInventoryItems = inventoryItems.filter(item => item.id && item.id.trim() !== '');
      
      if (validInventoryItems.length === 0) {
        addNotification('No inventory items with valid IDs found. Please check your inventory data.', 'error');
        return;
      }

      addNotification(`Found ${validInventoryItems.length} valid inventory items. Creating sample transactions...`, 'info');

      const sampleTransactions = [];
      
      // Create sample transactions for each valid inventory item
      for (let i = 0; i < Math.min(validInventoryItems.length, 5); i++) {
        const item = validInventoryItems[i];
        const facility = currentFacilities[i % currentFacilities.length];
        
        if (!item.id || !facility.id) {
          console.warn('Skipping item or facility without ID:', { item, facility });
          continue;
        }
        
        // Stock In transaction
        const stockInTransaction = {
          itemId: item.id,
          facilityId: facility.id,
          type: 'stock_in' as const,
          quantity: Math.floor(Math.random() * 50) + 10,
          unit: item.unit,
          source: 'Sample Supplier',
          destination: '',
          reason: 'Initial stock setup',
          notes: 'Sample transaction for demonstration',
          userId: 'sample-user-id',
          transactionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
        
        sampleTransactions.push(stockInTransaction);
        
        // Stock Out transaction (if item has stock)
        if (item.currentStock > 0) {
          const stockOutTransaction = {
            itemId: item.id,
            facilityId: facility.id,
            type: 'stock_out' as const,
            quantity: Math.min(Math.floor(Math.random() * 20) + 5, item.currentStock),
            unit: item.unit,
            source: '',
            destination: 'Sample Distribution',
            reason: 'Regular consumption',
            notes: 'Sample transaction for demonstration',
            userId: 'sample-user-id',
            transactionDate: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          };
          
          sampleTransactions.push(stockOutTransaction);
        }
      }
      
      if (sampleTransactions.length === 0) {
        addNotification('No valid transactions could be created. Please check your data.', 'error');
        return;
      }
      
      // Add all sample transactions
      for (const transaction of sampleTransactions) {
        try {
          await addTransaction(transaction);
          console.log('Successfully created transaction for item:', transaction.itemId);
        } catch (error) {
          console.error('Failed to create transaction for item:', transaction.itemId, error);
        }
      }
      
      addNotification(`Created ${sampleTransactions.length} sample transactions successfully!`, 'success');
    } catch (error) {
      console.error('Error creating sample transactions:', error);
      addNotification('Failed to create sample transactions. Please try again.', 'error');
    }
  };

  const handleSaveTransaction = async () => {
    if (!formData.item || !formData.reason || formData.quantity === 0) {
      addNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      // Find the selected inventory item and facility to get their IDs
      const selectedInventoryItem = inventoryItems?.find(item => item.name === formData.item);
      const selectedFacility = facilities?.find(f => f.name === formData.facility);
      
      if (!selectedInventoryItem) {
        addNotification('Please select a valid inventory item', 'error');
        return;
      }
      
      if (!selectedFacility) {
        addNotification('Please select a valid facility', 'error');
        return;
      }

      if (modalType === 'add') {
        const newTransaction = {
          itemId: selectedInventoryItem.id!,
          facilityId: selectedFacility.id!,
          type: formData.type,
          quantity: formData.quantity,
          unit: formData.unit,
          source: formData.source,
          destination: formData.destination,
          reason: formData.reason,
          notes: formData.notes,
          userId: 'current-user-id', // TODO: Get from auth context
          transactionDate: new Date().toISOString().split('T')[0]
        };

        await addTransaction(newTransaction);
        addNotification('Transaction added successfully', 'success');
      } else if (modalType === 'edit' && selectedTransaction) {
        const updatedTransaction = {
          itemId: selectedInventoryItem.id!,
          facilityId: selectedFacility.id!,
          type: formData.type,
          quantity: formData.quantity,
          unit: formData.unit,
          source: formData.source,
          destination: formData.destination,
          reason: formData.reason,
          notes: formData.notes,
          userId: 'current-user-id', // TODO: Get from auth context
          transactionDate: new Date().toISOString().split('T')[0]
        };

        await updateTransaction(selectedTransaction.id, updatedTransaction);
        addNotification('Transaction updated successfully', 'success');
      }

      setShowModal(false);
    } catch (error) {
      console.error('Error saving transaction:', error);
      addNotification('Failed to save transaction. Please try again.', 'error');
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'stock_in':
        return 'text-green-600 bg-green-100';
      case 'stock_out':
        return 'text-red-600 bg-red-100';
      case 'transfer':
        return 'text-blue-600 bg-blue-100';
      case 'adjustment':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'stock_in':
        return 'Stock In';
      case 'stock_out':
        return 'Stock Out';
      case 'transfer':
        return 'Transfer';
      case 'adjustment':
        return 'Adjustment';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const stats = [
    {
      name: 'Total Transactions',
      value: transactions.length.toString(),
      change: '+12%',
      changeType: 'increase',
      icon: ArrowUpDown,
      color: 'bg-blue-500'
    },
    {
      name: 'Stock In',
      value: transactions.filter(t => t.type === 'stock_in').length.toString(),
      change: '+8%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      name: 'Stock Out',
      value: transactions.filter(t => t.type === 'stock_out').length.toString(),
      change: '+5%',
      changeType: 'increase',
      icon: TrendingDown,
      color: 'bg-red-500'
    },
    {
      name: 'Transfers',
      value: transactions.filter(t => t.type === 'transfer').length.toString(),
      change: '+15%',
      changeType: 'increase',
      icon: ArrowUpDown,
      color: 'bg-uganda-yellow'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Transactions</h1>
          <p className="text-gray-600 mt-1">Track and manage inventory transactions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleCreateSampleTransactions}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sample Transactions</span>
          </button>
          <button
            onClick={handleAddTransaction}
            className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
              <div className="mt-4 flex items-center">
                {stat.changeType === 'increase' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`ml-1 text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="ml-2 text-sm text-gray-500">from last month</span>
        </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                placeholder="Search transactions..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {transactionTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facility</label>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {facilityOptions.map(facility => (
                <option key={facility.value} value={facility.value}>{facility.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
                setSelectedStatus('all');
                setSelectedFacility('all');
              }}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table - Desktop */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
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
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}>
                        {getTransactionTypeLabel(transaction.type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{transaction.item}</div>
                      <div className="text-sm text-gray-500">{transaction.reason}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.quantity} {transaction.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.facility}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{transaction.date}</div>
                    <div>{transaction.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewTransaction(transaction)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(transaction)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Transactions</h3>
          <div className="text-sm text-gray-500">
            {filteredTransactions.length} transactions
          </div>
        </div>
        
        {filteredTransactions.map((transaction) => (
          <div key={transaction.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            {/* Header with Transaction Type */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTransactionTypeColor(transaction.type)}`}>
                  {getTransactionTypeLabel(transaction.type)}
                </span>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">{transaction.item}</h4>
                  <p className="text-sm text-gray-600 mt-1">{transaction.reason}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewTransaction(transaction)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-md hover:bg-gray-100"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditTransaction(transaction)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-md hover:bg-gray-100"
                  title="Edit Transaction"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTransaction(transaction)}
                  className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-md hover:bg-red-50"
                  title="Delete Transaction"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="space-y-3">
              {/* Quantity and Status */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {transaction.quantity} {transaction.unit}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </span>
              </div>

              {/* Additional Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Facility:</span>
                  <span className="text-gray-900 ml-1">{transaction.facility}</span>
                </div>
                <div>
                  <span className="text-gray-500">User:</span>
                  <span className="text-gray-900 ml-1">{transaction.user}</span>
                </div>
                {transaction.source && (
                  <div>
                    <span className="text-gray-500">Source:</span>
                    <span className="text-gray-900 ml-1">{transaction.source}</span>
                  </div>
                )}
                {transaction.destination && (
                  <div>
                    <span className="text-gray-500">Destination:</span>
                    <span className="text-gray-900 ml-1">{transaction.destination}</span>
                  </div>
                )}
              </div>

              {/* Date and Time */}
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-gray-500">Date:</span>
                  <span className="text-gray-900 ml-1">{transaction.date}</span>
                </div>
                <div>
                  <span className="text-gray-500">Time:</span>
                  <span className="text-gray-900 ml-1">{transaction.time}</span>
                </div>
              </div>

              {/* Notes */}
              {transaction.notes && (
                <div className="text-sm">
                  <span className="text-gray-500">Notes:</span>
                  <span className="text-gray-900 ml-1">{transaction.notes}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {modalType === 'add' ? 'Add New Transaction' : 
                 modalType === 'edit' ? 'Edit Transaction' : 'Transaction Details'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
                    </div>

            <div className="p-6">
              {modalType === 'view' && selectedTransaction ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(selectedTransaction.type)}`}>
                      {getTransactionTypeLabel(selectedTransaction.type)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTransaction.status)}`}>
                      {selectedTransaction.status}
                    </span>
                  </div>
                        <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                    <p className="text-gray-900">{selectedTransaction.item}</p>
                        </div>
                        <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <p className="text-gray-900">{selectedTransaction.quantity} {selectedTransaction.unit}</p>
                        </div>
                        <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facility</label>
                    <p className="text-gray-900">{selectedTransaction.facility}</p>
                        </div>
                        <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                    <p className="text-gray-900">{selectedTransaction.user}</p>
                        </div>
                  {selectedTransaction.source && (
                        <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                      <p className="text-gray-900">{selectedTransaction.source}</p>
                        </div>
                      )}
                  {selectedTransaction.destination && (
                        <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                      <p className="text-gray-900">{selectedTransaction.destination}</p>
                        </div>
                      )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <p className="text-gray-900">{selectedTransaction.reason}</p>
                  </div>
                  {selectedTransaction.notes && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <p className="text-gray-900">{selectedTransaction.notes}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <p className="text-gray-900">{selectedTransaction.date}</p>
                      </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <p className="text-gray-900">{selectedTransaction.time}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transaction Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    >
                      <option value="stock_in">Stock In</option>
                      <option value="stock_out">Stock Out</option>
                      <option value="transfer">Transfer</option>
                      <option value="adjustment">Adjustment</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item *
                    </label>
                    <select
                      value={formData.item}
                      onChange={(e) => setFormData({...formData, item: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    >
                      <option value="">Select an item</option>
                      {inventoryItems?.map(item => (
                        <option key={item.id} value={item.name}>{item.name} (Current Stock: {item.currentStock})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                      placeholder="0"
                    />
              </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    >
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Facility *
                    </label>
                    <select
                      value={formData.facility}
                      onChange={(e) => setFormData({...formData, facility: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    >
                      {facilityOptions.filter(f => f.value !== 'all').map(facility => (
                        <option key={facility.value} value={facility.value}>{facility.label}</option>
                      ))}
                    </select>
                  </div>

                  {(formData.type === 'stock_in' || formData.type === 'transfer') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Source
                      </label>
                      <input
                        type="text"
                        value={formData.source}
                        onChange={(e) => setFormData({...formData, source: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                        placeholder="Enter source"
                      />
                    </div>
                  )}
                  
                  {(formData.type === 'stock_out' || formData.type === 'transfer') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Destination
                      </label>
                      <input
                        type="text"
                        value={formData.destination}
                        onChange={(e) => setFormData({...formData, destination: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                        placeholder="Enter destination"
                      />
          </div>
        )}
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason *
                    </label>
                    <input
                      type="text"
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                      placeholder="Enter reason for transaction"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                      placeholder="Enter additional notes"
                    />
      </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    >
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              )}
              </div>
            
            {modalType !== 'view' && (
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTransaction}
                  className="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  {modalType === 'add' ? 'Add Transaction' : 'Update Transaction'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}