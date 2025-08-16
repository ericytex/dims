import React, { useState, useEffect, useMemo } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useOffline } from '../contexts/OfflineContext';
import { useFirebaseDatabase } from '../hooks/useFirebaseDatabase';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import ConfirmationDialog from '../components/ConfirmationDialog';
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
  ArrowRightLeft,
  Download,
  Printer
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
  // New enhanced fields
  lpoNumber?: string;
  userDepartment?: string;
  itemDescription?: string;
  skuBarcode?: string;
  officerName?: string;
  deliveryNote?: string;
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
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate item quantity totals
  const getItemQuantityTotals = () => {
    if (!inventoryItems || !stockTransactions) return [];
    
    return inventoryItems.map(item => {
      const itemTransactions = stockTransactions.filter(t => t.itemId === item.id);
      const stockInTotal = itemTransactions
        .filter(t => t.type === 'stock_in')
        .reduce((sum, t) => sum + t.quantity, 0);
      const stockOutTotal = itemTransactions
        .filter(t => t.type === 'stock_out')
        .reduce((sum, t) => sum + t.quantity, 0);
      
      const lastTransaction = itemTransactions
        .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())[0];
      
      return {
        itemId: item.id!,
        itemName: item.name,
        currentStock: item.currentStock,
        unit: item.unit,
        netChange: stockInTotal - stockOutTotal,
        lastTransactionDate: lastTransaction?.transactionDate || null
      };
    });
  };

  const itemQuantityTotals = getItemQuantityTotals();

  const [formData, setFormData] = useState({
    type: 'stock_in' as 'stock_in' | 'stock_out' | 'transfer' | 'adjustment',
    item: '',
    quantity: 0,
    unit: 'pieces',
    facility: 'Main Warehouse',
    source: '',
    destination: '',
    reason: '',
    notes: '',
    status: 'completed' as 'completed' | 'pending' | 'cancelled',
    // New enhanced fields
    lpoNumber: '',
    userDepartment: '',
    itemDescription: '',
    skuBarcode: '',
    officerName: '',
    deliveryNote: ''
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
    } else {
      setTransactions([]);
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
    
    // Auto-generate officer name and delivery note for stock in transactions
    const currentUser = users && users.length > 0 ? users[0] : { name: 'System User' };
    const autoGeneratedOfficerName = currentUser.name || 'System User';
    const autoGeneratedDeliveryNote = `DN-${Date.now().toString().slice(-8)}-STK`;
    
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
      status: 'completed',
      // New enhanced fields
      lpoNumber: '',
      userDepartment: '',
      itemDescription: '',
      skuBarcode: '',
      officerName: autoGeneratedOfficerName,
      deliveryNote: autoGeneratedDeliveryNote
    });
    setShowModal(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setModalType('edit');
    setSelectedTransaction(transaction);
    
    // Auto-generate values if they don't exist for stock_in transactions
    let officerName = transaction.officerName || '';
    let deliveryNote = transaction.deliveryNote || '';
    
    if (transaction.type === 'stock_in' && !officerName) {
      const currentUser = users && users.length > 0 ? users[0] : { name: 'System User' };
      officerName = currentUser.name || 'System User';
    }
    
    if (transaction.type === 'stock_in' && !deliveryNote) {
      deliveryNote = `DN-${Date.now().toString().slice(-8)}-STK`;
    }
    
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
      status: transaction.status,
      // New enhanced fields
      lpoNumber: transaction.lpoNumber || '',
      userDepartment: transaction.userDepartment || '',
      itemDescription: transaction.itemDescription || '',
      skuBarcode: transaction.skuBarcode || '',
      officerName: officerName,
      deliveryNote: deliveryNote
    });
    setShowModal(true);
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setModalType('view');
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteTransaction = async () => {
    try {
      if (!transactionToDelete?.id) return;

      setIsDeleting(true);
      await deleteTransaction(transactionToDelete.id);
      addNotification('Transaction deleted successfully', 'success');
      setTransactionToDelete(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      addNotification('Failed to delete transaction. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Print delivery note function
  const handlePrintDeliveryNote = (transaction: Transaction) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const deliveryNoteHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery Note - ${transaction.deliveryNote || 'DN-' + Date.now()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 3px solid #FFD700; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #333; }
            .subtitle { color: #666; margin-top: 5px; }
            .delivery-note { font-size: 28px; font-weight: bold; color: #333; margin: 20px 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
            .info-section { background: #f9f9f9; padding: 15px; border-radius: 8px; }
            .info-label { font-weight: bold; color: #555; margin-bottom: 5px; }
            .info-value { color: #333; }
            .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .items-table th { background: #f5f5f5; font-weight: bold; }
            .signature-section { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .signature-box { border-top: 2px solid #333; padding-top: 10px; text-align: center; }
            .signature-label { font-weight: bold; margin-bottom: 5px; }
            @media print { body { margin: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">GOU STORES</div>
            <div class="subtitle">Government of Uganda</div>
            <div class="subtitle">Decentralized Inventory Management System</div>
          </div>
          
          <div class="delivery-note">DELIVERY NOTE</div>
          
          <div class="info-grid">
            <div class="info-section">
              <div class="info-label">Delivery Note No:</div>
              <div class="info-value">${transaction.deliveryNote || 'DN-' + Date.now()}</div>
            </div>
            <div class="info-section">
              <div class="info-label">Date:</div>
              <div class="info-value">${transaction.date}</div>
            </div>
            <div class="info-section">
              <div class="info-label">LPO Number:</div>
              <div class="info-value">${transaction.lpoNumber || 'N/A'}</div>
            </div>
            <div class="info-section">
              <div class="info-label">Department/Project:</div>
              <div class="info-value">${transaction.userDepartment || 'N/A'}</div>
            </div>
            <div class="info-section">
              <div class="info-label">Officer Name:</div>
              <div class="info-value">${transaction.officerName || 'N/A'}</div>
            </div>
            <div class="info-section">
              <div class="info-label">Facility:</div>
              <div class="info-value">${transaction.facility}</div>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>SKU/Barcode</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${transaction.itemDescription || transaction.item}</td>
                <td>${transaction.quantity}</td>
                <td>${transaction.unit}</td>
                <td>${transaction.skuBarcode || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-label">Received By:</div>
              <div style="height: 60px;"></div>
              <div>Name: _________________</div>
              <div>Signature: _________________</div>
              <div>Date: _________________</div>
            </div>
            <div class="signature-box">
              <div class="signature-label">Delivered By:</div>
              <div style="height: 60px;"></div>
              <div>Name: ${transaction.officerName || 'N/A'}</div>
              <div>Signature: _________________</div>
              <div>Date: ${transaction.date}</div>
            </div>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #FFD700; border: none; border-radius: 5px; cursor: pointer;">
              Print Delivery Note
            </button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(deliveryNoteHTML);
    printWindow.document.close();
    printWindow.focus();
  };

  // Get selected item details for detailed view
  const selectedItemDetails = useMemo(() => {
    if (!selectedInventoryItem) return null;
    
    const item = itemQuantityTotals.find(item => item.itemId === selectedInventoryItem);
    if (!item) return null;

    // Get recent transactions for this item
    const itemTransactions = stockTransactions.filter(t => t.itemId === item.itemId);
    const recentTransactions = itemTransactions
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, 5)
      .map(t => ({
        date: t.transactionDate,
        type: t.type,
        quantity: t.quantity
      }));

    return {
      ...item,
      recentTransactions,
      totalTransactions: itemTransactions.length,
      stockInCount: itemTransactions.filter(t => t.type === 'stock_in').length,
      stockOutCount: itemTransactions.filter(t => t.type === 'stock_out').length
    };
  }, [selectedInventoryItem, itemQuantityTotals, stockTransactions]);

  const handleSaveTransaction = async () => {
    if (!formData.item || !formData.reason || formData.quantity === 0) {
      addNotification('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);
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
        // Auto-generate officer name and delivery note for stock in transactions
        const currentUser = users?.find(u => u.id === 'current-user-id') || { name: 'System User' };
        const autoGeneratedOfficerName = formData.type === 'stock_in' ? currentUser.name : '';
        const autoGeneratedDeliveryNote = formData.type === 'stock_in' ? 
          `DN-${Date.now().toString().slice(-8)}-${selectedInventoryItem.name.slice(0, 3).toUpperCase()}` : '';

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
          transactionDate: new Date().toISOString().split('T')[0],
          // New enhanced fields
          lpoNumber: formData.lpoNumber,
          userDepartment: formData.userDepartment,
          itemDescription: formData.itemDescription,
          skuBarcode: formData.skuBarcode,
          officerName: autoGeneratedOfficerName,
          deliveryNote: autoGeneratedDeliveryNote
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
          transactionDate: new Date().toISOString().split('T')[0],
          // New enhanced fields
          lpoNumber: formData.lpoNumber,
          userDepartment: formData.userDepartment,
          itemDescription: formData.itemDescription,
          skuBarcode: formData.skuBarcode,
          officerName: formData.officerName,
          deliveryNote: formData.deliveryNote
        };

        await updateTransaction(selectedTransaction.id, updatedTransaction);
        addNotification('Transaction updated successfully', 'success');
      }

      setShowModal(false);
          } catch (error) {
        console.error('Error saving transaction:', error);
        addNotification('Failed to save transaction. Please try again.', 'error');
      } finally {
        setIsSubmitting(false);
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
      icon: ArrowRightLeft,
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
      icon: ArrowRightLeft,
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
            onClick={handleAddTransaction}
            className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Live Inventory Quantities Section */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-uganda-black">
            Live Inventory Quantities
          </h2>
          <p className="text-sm text-gray-600 mt-1">Select an item to view detailed quantity information</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Item Selector */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Inventory Item
              </label>
              <select
                value={selectedInventoryItem || ''}
                onChange={(e) => setSelectedInventoryItem(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
              >
                <option value="">Choose an item...</option>
                {itemQuantityTotals.map((item) => (
                  <option key={item.itemId} value={item.itemId}>
                    {item.itemName} ({item.currentStock} {item.unit})
                  </option>
                ))}
              </select>
              
              {selectedInventoryItem && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Stock:</span>
                      <span className="font-medium">{selectedItemDetails?.currentStock} {selectedItemDetails?.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Net Change:</span>
                      <span className={`font-medium ${selectedItemDetails?.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedItemDetails?.netChange >= 0 ? '+' : ''}{selectedItemDetails?.netChange} {selectedItemDetails?.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Transaction:</span>
                      <span className="font-medium">{selectedItemDetails?.lastTransactionDate || 'None'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Detailed View Panel */}
            <div className="lg:col-span-2">
              {selectedInventoryItem && selectedItemDetails ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">
                    {selectedItemDetails.itemName} - Detailed Analysis
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Stock Information */}
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 mb-3">Stock Information</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Current Stock:</span>
                          <span className="font-semibold text-blue-900">
                            {selectedItemDetails.currentStock} {selectedItemDetails.unit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Net Change:</span>
                          <span className={`font-semibold ${selectedItemDetails.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedItemDetails.netChange >= 0 ? '+' : ''}{selectedItemDetails.netChange} {selectedItemDetails.unit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Last Transaction:</span>
                          <span className="font-semibold text-blue-900">
                            {selectedItemDetails.lastTransactionDate || 'None'}
                          </span>
            </div>
          </div>
        </div>

                    {/* Transaction Summary */}
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 mb-3">Transaction Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Total Transactions:</span>
                          <span className="font-semibold text-blue-900">
                            {selectedItemDetails.totalTransactions}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Stock In:</span>
                          <span className="font-semibold text-green-600">
                            {selectedItemDetails.stockInCount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Stock Out:</span>
                          <span className="font-semibold text-red-600">
                            {selectedItemDetails.stockOutCount}
                          </span>
            </div>
            </div>
          </div>
        </div>

                  {/* Recent Transactions */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-blue-800 mb-3">Recent Transactions</h4>
                    <div className="bg-white rounded-lg border border-blue-200 p-4">
                      {selectedItemDetails.recentTransactions && selectedItemDetails.recentTransactions.length > 0 ? (
                        <div className="space-y-2">
                          {selectedItemDetails.recentTransactions.slice(0, 3).map((transaction, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-blue-700">{transaction.date}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                transaction.type === 'stock_in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {transaction.type === 'stock_in' ? 'Stock In' : 'Stock Out'}
                              </span>
                              <span className="font-medium text-blue-900">
                                {transaction.quantity} {selectedItemDetails.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-blue-600 text-sm">No recent transactions found</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex items-center justify-center">
                  <div className="text-center">
                    <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">Select an inventory item to view detailed information</p>
                  </div>
            </div>
              )}
            </div>
            </div>
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
                      {transaction.type === 'stock_in' && (
                        <button
                          onClick={() => handlePrintDeliveryNote(transaction)}
                          className="text-green-400 hover:text-green-600 transition-colors p-2 rounded-md hover:bg-green-50"
                          title="Print Delivery Note"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}
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
                {transaction.type === 'stock_in' && (
                  <button
                    onClick={() => handlePrintDeliveryNote(transaction)}
                    className="text-green-400 hover:text-green-600 transition-colors p-2 rounded-md hover:bg-green-50"
                    title="Print Delivery Note"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                )}
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
                      onChange={(e) => {
                        const newType = e.target.value as 'stock_in' | 'stock_out' | 'transfer' | 'adjustment';
                        
                        // Auto-generate values when switching to stock_in
                        if (newType === 'stock_in') {
                          const currentUser = users && users.length > 0 ? users[0] : { name: 'System User' };
                          const autoGeneratedOfficerName = currentUser.name || 'System User';
                          const autoGeneratedDeliveryNote = `DN-${Date.now().toString().slice(-8)}-STK`;
                          
                          setFormData({
                            ...formData,
                            type: newType,
                            officerName: autoGeneratedOfficerName,
                            deliveryNote: autoGeneratedDeliveryNote
                          });
                        } else {
                          // Clear enhanced fields for non-stock-in transactions
                          setFormData({
                            ...formData,
                            type: newType,
                            lpoNumber: '',
                            userDepartment: '',
                            itemDescription: '',
                            skuBarcode: '',
                            officerName: '',
                            deliveryNote: ''
                          });
                        }
                      }}
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
                      onChange={(e) => {
                        const selectedItemName = e.target.value;
                        
                        // Auto-generate delivery note when item is selected for stock_in transactions
                        if (formData.type === 'stock_in' && selectedItemName) {
                          const selectedItem = inventoryItems?.find(item => item.name === selectedItemName);
                          const itemCode = selectedItem ? selectedItem.name.slice(0, 3).toUpperCase() : 'STK';
                          const deliveryNote = `DN-${Date.now().toString().slice(-8)}-${itemCode}`;
                          
                          setFormData({
                            ...formData,
                            item: selectedItemName,
                            deliveryNote: deliveryNote
                          });
                        } else {
                          setFormData({
                            ...formData,
                            item: selectedItemName
                          });
                        }
                      }}
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

                  {/* Enhanced fields for Stock In transactions */}
                  {/* Enhanced fields for Stock In transactions */}
                  {formData.type === 'stock_in' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          LPO Number
                        </label>
                        <input
                          type="text"
                          value={formData.lpoNumber}
                          onChange={(e) => setFormData({...formData, lpoNumber: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                          placeholder="Enter LPO number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          User Department/Project
                        </label>
                        <input
                          type="text"
                          value={formData.userDepartment}
                          onChange={(e) => setFormData({...formData, userDepartment: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                          placeholder="Enter department or project"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description of Items
                        </label>
                        <textarea
                          value={formData.itemDescription}
                          onChange={(e) => setFormData({...formData, itemDescription: e.target.value})}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                          placeholder="Enter detailed item description"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          SKU/Barcode
                        </label>
                        <input
                          type="text"
                          value={formData.skuBarcode}
                          onChange={(e) => setFormData({...formData, skuBarcode: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                          placeholder="Enter SKU or barcode"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Officer Name (Auto-generated)
                        </label>
                        <input
                          type="text"
                          value={formData.officerName}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                          placeholder="Will be auto-generated"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Note (Auto-generated)
                        </label>
                        <input
                          type="text"
                          value={formData.deliveryNote}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                          placeholder="Will be auto-generated"
                        />
                      </div>
                    </>
                  )}

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
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-uganda-black mr-2"></div>
                      {modalType === 'add' ? 'Adding...' : 'Updating...'}
                    </>
                  ) : (
                    modalType === 'add' ? 'Add Transaction' : 'Update Transaction'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDeleteTransaction}
        title="Delete Transaction"
        message={`Are you sure you want to delete this transaction? This action cannot be undone and will also reverse any inventory changes.`}
        confirmText={isDeleting ? "Deleting..." : "Delete Transaction"}
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}