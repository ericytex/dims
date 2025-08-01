import React, { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import {
  Plus,
  Search,
  ArrowUp,
  ArrowDown,
  Calendar,
  MapPin,
  Package,
  User,
  Filter,
  Download
} from 'lucide-react';

interface StockTransaction {
  id: string;
  type: 'stock_in' | 'stock_out';
  itemName: string;
  itemId: string;
  quantity: number;
  unit: string;
  facility: string;
  facilityId: string;
  user: string;
  userId: string;
  date: string;
  time: string;
  batchNumber?: string;
  expiryDate?: string;
  source?: string; // For stock-in
  destination?: string; // For stock-out
  reason?: string;
  cost?: number;
  notes?: string;
}

export default function StockTransactions() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([
    {
      id: '1',
      type: 'stock_in',
      itemName: 'Paracetamol 500mg',
      itemId: '1',
      quantity: 1000,
      unit: 'Tablets',
      facility: 'Mulago Hospital',
      facilityId: '1',
      user: 'John Mukasa',
      userId: '4',
      date: '2025-01-09',
      time: '14:30',
      batchNumber: 'PAR2024001',
      expiryDate: '2025-12-31',
      source: 'Quality Chemicals',
      cost: 50.00,
      notes: 'Monthly delivery from supplier'
    },
    {
      id: '2',
      type: 'stock_out',
      itemName: 'Amoxicillin 250mg',
      itemId: '2',
      quantity: 50,
      unit: 'Capsules',
      facility: 'Kawempe HC IV',
      facilityId: '2',
      user: 'Mary Nambi',
      userId: '5',
      date: '2025-01-09',
      time: '13:15',
      destination: 'Patient Treatment',
      reason: 'Dispensed to patients',
      notes: 'Treatment for respiratory infections'
    },
    {
      id: '3',
      type: 'stock_in',
      itemName: 'Artemether/Lumefantrine',
      itemId: '3',
      quantity: 200,
      unit: 'Tablets',
      facility: 'Kiruddu Hospital',
      facilityId: '3',
      user: 'Dr. Sarah Nakato',
      userId: '3',
      date: '2025-01-09',
      time: '11:45',
      batchNumber: 'ALU2024003',
      expiryDate: '2025-06-30',
      source: 'Central Medical Stores',
      cost: 150.00,
      notes: 'Emergency stock replenishment'
    },
    {
      id: '4',
      type: 'stock_out',
      itemName: 'Insulin Vials',
      itemId: '4',
      quantity: 5,
      unit: 'Vials',
      facility: 'Mulago Hospital',
      facilityId: '1',
      user: 'John Mukasa',
      userId: '4',
      date: '2025-01-09',
      time: '10:20',
      destination: 'Diabetes Clinic',
      reason: 'Patient allocation',
      notes: 'For chronic diabetes patients'
    },
    {
      id: '5',
      type: 'stock_in',
      itemName: 'Surgical Gloves (Medium)',
      itemId: '5',
      quantity: 100,
      unit: 'Boxes',
      facility: 'Nsambya HC III',
      facilityId: '4',
      user: 'James Ssebunya',
      userId: '6',
      date: '2025-01-08',
      time: '16:30',
      source: 'Medical Supplies Ltd',
      cost: 800.00,
      notes: 'Quarterly PPE stock-up'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('today');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTransactionType, setAddTransactionType] = useState<'stock_in' | 'stock_out'>('stock_in');
  const { addNotification } = useNotification();

  const transactionTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'stock_in', label: 'Stock In' },
    { value: 'stock_out', label: 'Stock Out' }
  ];

  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' }
  ];

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.facility.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || transaction.type === selectedType;
    
    // Simple date filtering (in real app, would be more sophisticated)
    let matchesDate = true;
    if (selectedDateRange === 'today') {
      matchesDate = transaction.date === '2025-01-09';
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  const handleAddTransaction = (type: 'stock_in' | 'stock_out') => {
    setAddTransactionType(type);
    setShowAddModal(true);
  };

  const handleExport = () => {
    addNotification({
      type: 'success',
      title: 'Export Started',
      message: 'Transaction report is being generated and will be downloaded shortly.'
    });
  };

  const getTransactionIcon = (type: string) => {
    return type === 'stock_in' ? (
      <ArrowUp className="w-5 h-5 text-green-600" />
    ) : (
      <ArrowDown className="w-5 h-5 text-uganda-red" />
    );
  };

  const getTransactionColor = (type: string) => {
    return type === 'stock_in' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const totalStockIn = transactions
    .filter(t => t.type === 'stock_in')
    .reduce((sum, t) => sum + t.quantity, 0);

  const totalStockOut = transactions
    .filter(t => t.type === 'stock_out')
    .reduce((sum, t) => sum + t.quantity, 0);

  const totalValue = transactions
    .filter(t => t.cost)
    .reduce((sum, t) => sum + (t.cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-uganda-black">Stock Transactions</h1>
          <p className="text-gray-600 mt-1">Track all stock movements and inventory changes</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export
          </button>
          <button
            onClick={() => handleAddTransaction('stock_in')}
            className="inline-flex items-center px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
          >
            <ArrowUp className="w-5 h-5 mr-2" />
            Stock In
          </button>
          <button
            onClick={() => handleAddTransaction('stock_out')}
            className="inline-flex items-center px-4 py-2 bg-uganda-yellow text-uganda-black font-medium rounded-lg hover:bg-yellow-500 transition-colors"
          >
            <ArrowDown className="w-5 h-5 mr-2" />
            Stock Out
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <ArrowUp className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-uganda-black">{totalStockIn.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Stock In</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-uganda-red rounded-lg flex items-center justify-center">
              <ArrowDown className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-uganda-black">{totalStockOut.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Stock Out</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-uganda-black">{transactions.length}</p>
              <p className="text-sm text-gray-600">Total Transactions</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-uganda-yellow rounded-lg flex items-center justify-center">
              <span className="text-uganda-black font-bold">$</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-uganda-black">${totalValue.toFixed(0)}</p>
              <p className="text-sm text-gray-600">Total Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {transactionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {dateRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-uganda-black">
            Recent Transactions ({filteredTransactions.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-lg border ${getTransactionColor(transaction.type)}`}>
                    {getTransactionIcon(transaction.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-medium text-uganda-black">
                        {transaction.itemName}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'stock_in' ? 'Stock In' : 'Stock Out'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600 mb-2">
                      <span className="font-medium text-uganda-black">
                        {transaction.quantity.toLocaleString()} {transaction.unit}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {transaction.facility}
                      </span>
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {transaction.user}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {transaction.date} at {transaction.time}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {transaction.batchNumber && (
                        <div>
                          <span className="text-gray-500">Batch:</span>
                          <span className="ml-2 text-gray-900">{transaction.batchNumber}</span>
                        </div>
                      )}
                      
                      {transaction.expiryDate && (
                        <div>
                          <span className="text-gray-500">Expiry:</span>
                          <span className="ml-2 text-gray-900">{transaction.expiryDate}</span>
                        </div>
                      )}
                      
                      {transaction.source && (
                        <div>
                          <span className="text-gray-500">Source:</span>
                          <span className="ml-2 text-gray-900">{transaction.source}</span>
                        </div>
                      )}
                      
                      {transaction.destination && (
                        <div>
                          <span className="text-gray-500">Destination:</span>
                          <span className="ml-2 text-gray-900">{transaction.destination}</span>
                        </div>
                      )}
                      
                      {transaction.reason && (
                        <div>
                          <span className="text-gray-500">Reason:</span>
                          <span className="ml-2 text-gray-900">{transaction.reason}</span>
                        </div>
                      )}
                      
                      {transaction.cost && (
                        <div>
                          <span className="text-gray-500">Cost:</span>
                          <span className="ml-2 text-green-600 font-medium">${transaction.cost.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {transaction.notes && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Notes:</span>
                        <span className="ml-2 text-gray-700 italic">{transaction.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or add a new transaction.</p>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-uganda-black mb-4">
                Add {addTransactionType === 'stock_in' ? 'Stock In' : 'Stock Out'} Transaction
              </h3>
              <div className="text-center py-8 text-gray-500">
                Transaction form would be implemented here
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    addNotification({
                      type: 'success',
                      title: 'Transaction Added',
                      message: `${addTransactionType === 'stock_in' ? 'Stock In' : 'Stock Out'} transaction has been recorded successfully.`
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-500"
                >
                  Add Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}