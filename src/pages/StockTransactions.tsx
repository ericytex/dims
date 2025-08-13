import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useOffline } from '../contexts/OfflineContext';
import { useFirebaseDatabase } from '../hooks/useFirebaseDatabase';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
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
  itemId: string;
  itemName?: string;
  quantity: number;
  unit: string;
  facilityId: string;
  facilityName?: string;
  source?: string;
  destination?: string;
  reason: string;
  notes?: string;
  userId: string;
  userName?: string;
  transactionDate: string;
  status: 'completed' | 'pending' | 'cancelled';
  createdAt?: any;
}

export default function StockTransactions() {
  const { showNotification } = useNotification();
  const { isOnline, addOfflineTransaction, syncOfflineData } = useOffline();
  const { user } = useFirebaseAuth();
  const { 
    transactions: firebaseTransactions, 
    inventoryItems, 
    facilities,
    users,
    addTransaction, 
    updateTransaction, 
    deleteTransaction,
    loading: dbLoading,
    error: dbError
  } = useFirebaseDatabase();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [viewType, setViewType] = useState<'cards' | 'table'>('cards');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load and process transactions from Firebase
  useEffect(() => {
    if (firebaseTransactions && inventoryItems && facilities && users) {
      const processedTransactions = firebaseTransactions.map(transaction => {
        // Find related data
        const item = inventoryItems.find(item => item.id === transaction.itemId);
        const facility = facilities.find(f => f.id === transaction.facilityId);
        const user = users.find(u => u.id === transaction.userId);
        
        return {
          ...transaction,
          itemName: item?.name || 'Unknown Item',
          facilityName: facility?.name || 'Unknown Facility',
          userName: user?.name || 'Unknown User'
        };
      });
      
      setTransactions(processedTransactions);
      setFilteredTransactions(processedTransactions);
    }
  }, [firebaseTransactions, inventoryItems, facilities, users]);

  // Filter transactions based on search and type
  useEffect(() => {
    let filtered = transactions;
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.facilityName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, filterType]);

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

  const transactionTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'stock_in', label: 'Stock In' },
    { value: 'stock_out', label: 'Stock Out' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'adjustment', label: 'Adjustment' }
  ];

  const facilities = [
    { value: 'all', label: 'All Facilities' },
    { value: 'Main Warehouse', label: 'Main Warehouse' },
    { value: 'Distribution Center', label: 'Distribution Center' },
    { value: 'Regional Warehouse', label: 'Regional Warehouse' },
    { value: 'Retail Store', label: 'Retail Store' }
  ];

  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Transaction management functions
  const handleAddTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      if (!isOnline) {
        // Store offline if not connected
        await addOfflineTransaction(transactionData);
        showNotification('Transaction stored offline and will sync when online', 'info');
      } else {
        // Add to Firebase
        await addTransaction({
          type: transactionData.type,
          itemId: transactionData.itemId,
          facilityId: transactionData.facilityId,
          quantity: transactionData.quantity,
          unit: transactionData.unit,
          source: transactionData.source,
          destination: transactionData.destination,
          reason: transactionData.reason,
          notes: transactionData.notes,
          userId: transactionData.userId,
          transactionDate: transactionData.transactionDate
        });
        
        showNotification('Transaction added successfully', 'success');
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      showNotification('Failed to add transaction', 'error');
    }
  };

  const handleEditTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      await updateTransaction(id, updates);
      showNotification('Transaction updated successfully', 'success');
      setShowEditModal(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Error updating transaction:', error);
      showNotification('Failed to update transaction', 'error');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction? This will also reverse the inventory changes.')) {
      try {
        await deleteTransaction(id);
        showNotification('Transaction deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting transaction:', error);
        showNotification('Failed to delete transaction', 'error');
      }
    }
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setViewType('cards'); // Or 'table'
  };

  const handleSaveTransaction = async () => {
    if (!formData.item || !formData.reason || formData.quantity === 0) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    const newTransaction: Transaction = {
      type: formData.type,
      itemId: '', // Will be populated after item is selected
      itemName: formData.item,
      quantity: formData.quantity,
      unit: formData.unit,
      facilityId: '', // Will be populated after facility is selected
      facilityName: formData.facility,
      source: formData.source,
      destination: formData.destination,
      reason: formData.reason,
      notes: formData.notes,
      userId: user?.uid || '',
      userName: user?.displayName || 'Current User',
      transactionDate: new Date().toISOString().split('T')[0],
      status: formData.status,
      createdAt: new Date()
    };

    try {
      await addTransaction(newTransaction);
      setTransactions([newTransaction, ...transactions]);
      showNotification('Transaction added successfully', 'success');
    } catch (err) {
      setError('Failed to save transaction');
      console.error(err);
    }

    setShowAddModal(false);
  };

  const handleUpdateTransaction = async () => {
    if (!selectedTransaction) return;

    if (!formData.reason || formData.quantity === 0) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    const updatedTransaction: Transaction = {
      ...selectedTransaction,
      type: formData.type,
      itemName: formData.item,
      quantity: formData.quantity,
      unit: formData.unit,
      facilityName: formData.facility,
      source: formData.source,
      destination: formData.destination,
      reason: formData.reason,
      notes: formData.notes,
      status: formData.status,
      createdAt: new Date()
    };

    try {
      await updateTransaction(updatedTransaction.id, updatedTransaction);
      setTransactions(transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
      showNotification('Transaction updated successfully', 'success');
    } catch (err) {
      setError('Failed to update transaction');
      console.error(err);
    }

    setShowEditModal(false);
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
          <button
          onClick={() => {
            setSelectedTransaction(null);
            setFormData({
              type: 'stock_in',
              item: '',
              quantity: 0,
              unit: 'pieces',
              facility: 'Main Warehouse',
              source: '',
              destination: '',
              reason: '',
              notes: '',
              status: 'completed'
            });
            setShowAddModal(true);
          }}
          className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex items-center space-x-2"
          >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
          </button>
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
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
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
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
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
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {facilities.map(facility => (
                <option key={facility.value} value={facility.value}>{facility.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
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
                      <div className="text-sm font-medium text-gray-900">{transaction.itemName}</div>
                      <div className="text-sm text-gray-500">{transaction.reason}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.quantity} {transaction.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.facilityName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.userName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{transaction.transactionDate}</div>
                    <div>{transaction.createdAt?.toDate().toLocaleTimeString('en-US', { hour12: false })}</div>
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
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setFormData({
                            type: transaction.type,
                            item: transaction.itemName || '',
                            quantity: transaction.quantity,
                            unit: transaction.unit,
                            facility: transaction.facilityName || 'Main Warehouse',
                            source: transaction.source || '',
                            destination: transaction.destination || '',
                            reason: transaction.reason,
                            notes: transaction.notes || '',
                            status: transaction.status
                          });
                          setShowEditModal(true);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
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
                  <h4 className="text-base font-semibold text-gray-900">{transaction.itemName}</h4>
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
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setFormData({
                      type: transaction.type,
                      item: transaction.itemName || '',
                      quantity: transaction.quantity,
                      unit: transaction.unit,
                      facility: transaction.facilityName || 'Main Warehouse',
                      source: transaction.source || '',
                      destination: transaction.destination || '',
                      reason: transaction.reason,
                      notes: transaction.notes || '',
                      status: transaction.status
                    });
                    setShowEditModal(true);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-md hover:bg-gray-100"
                  title="Edit Transaction"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTransaction(transaction.id)}
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
                  <span className="text-gray-900 ml-1">{transaction.facilityName}</span>
                </div>
                <div>
                  <span className="text-gray-500">User:</span>
                  <span className="text-gray-900 ml-1">{transaction.userName}</span>
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
                  <span className="text-gray-900 ml-1">{transaction.transactionDate}</span>
                </div>
                <div>
                  <span className="text-gray-500">Time:</span>
                  <span className="text-gray-900 ml-1">{transaction.createdAt?.toDate().toLocaleTimeString('en-US', { hour12: false })}</span>
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
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Transaction</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
                    </div>

            <div className="p-6">
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
                    <input
                      type="text"
                      value={formData.item}
                      onChange={(e) => setFormData({...formData, item: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                      placeholder="Enter item name"
                    />
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
                      <option value="Main Warehouse">Main Warehouse</option>
                      <option value="Distribution Center">Distribution Center</option>
                      <option value="Regional Warehouse">Regional Warehouse</option>
                      <option value="Retail Store">Retail Store</option>
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
            
            {showAddModal && (
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddTransaction(formData)}
                  className="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  Add Transaction
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Transaction</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
                    </div>

            <div className="p-6">
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
                    <input
                      type="text"
                      value={formData.item}
                      onChange={(e) => setFormData({...formData, item: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                      placeholder="Enter item name"
                    />
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
                      <option value="Main Warehouse">Main Warehouse</option>
                      <option value="Distribution Center">Distribution Center</option>
                      <option value="Regional Warehouse">Regional Warehouse</option>
                      <option value="Retail Store">Retail Store</option>
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
            
            {showEditModal && (
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditTransaction(selectedTransaction?.id || '', formData)}
                  className="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  Update Transaction
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}