import React, { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import {
  Plus,
  Search,
  Edit,
  Eye,
  AlertTriangle,
  Package,
  Calendar,
  MapPin,
  X,
  Filter
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  expiryDate?: string;
  batchNumber?: string;
  facility: string;
  facilityId: string;
  cost: number;
  supplier: string;
  lastUpdated: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
}

export default function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'Paracetamol 500mg',
      category: 'Medicines',
      unit: 'Tablets',
      currentStock: 5000,
      reorderLevel: 1000,
      expiryDate: '2025-12-31',
      batchNumber: 'PAR2024001',
      facility: 'Mulago Hospital',
      facilityId: '1',
      cost: 0.05,
      supplier: 'Quality Chemicals',
      lastUpdated: '2025-01-09',
      status: 'in_stock'
    },
    {
      id: '2',
      name: 'Amoxicillin 250mg',
      category: 'Medicines',
      unit: 'Capsules',
      currentStock: 150,
      reorderLevel: 500,
      expiryDate: '2025-08-15',
      batchNumber: 'AMX2024002',
      facility: 'Kawempe HC IV',
      facilityId: '2',
      cost: 0.08,
      supplier: 'Cipla Quality Chemicals',
      lastUpdated: '2025-01-09',
      status: 'low_stock'
    },
    {
      id: '3',
      name: 'Artemether/Lumefantrine',
      category: 'Medicines',
      unit: 'Tablets',
      currentStock: 0,
      reorderLevel: 200,
      expiryDate: '2025-06-30',
      batchNumber: 'ALU2024003',
      facility: 'Kiruddu Hospital',
      facilityId: '3',
      cost: 0.75,
      supplier: 'Novartis',
      lastUpdated: '2025-01-08',
      status: 'out_of_stock'
    },
    {
      id: '4',
      name: 'Insulin Vials',
      category: 'Medicines',
      unit: 'Vials',
      currentStock: 45,
      reorderLevel: 20,
      expiryDate: '2025-02-15',
      batchNumber: 'INS2024004',
      facility: 'Mulago Hospital',
      facilityId: '1',
      cost: 12.50,
      supplier: 'Novo Nordisk',
      lastUpdated: '2025-01-09',
      status: 'in_stock'
    },
    {
      id: '5',
      name: 'Surgical Gloves (Medium)',
      category: 'Consumables',
      unit: 'Boxes',
      currentStock: 200,
      reorderLevel: 50,
      facility: 'Nsambya HC III',
      facilityId: '4',
      cost: 8.00,
      supplier: 'Medical Supplies Ltd',
      lastUpdated: '2025-01-09',
      status: 'in_stock'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const { addNotification } = useNotification();

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'Medicines', label: 'Medicines' },
    { value: 'Consumables', label: 'Consumables' },
    { value: 'Equipment', label: 'Equipment' },
    { value: 'Supplies', label: 'Supplies' }
  ];

  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' },
    { value: 'expired', label: 'Expired' }
  ];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.facility.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddItem = () => {
    setModalType('add');
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setModalType('edit');
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleViewItem = (item: InventoryItem) => {
    setModalType('view');
    setSelectedItem(item);
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'low_stock':
      case 'out_of_stock':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryColor = (daysLeft: number | null) => {
    if (daysLeft === null) return 'text-gray-500';
    if (daysLeft <= 30) return 'text-uganda-red';
    if (daysLeft <= 90) return 'text-uganda-yellow';
    return 'text-green-600';
  };

  const totalValue = items.reduce((sum, item) => sum + (item.currentStock * item.cost), 0);
  const lowStockItems = items.filter(item => item.status === 'low_stock' || item.status === 'out_of_stock').length;
  const expiringItems = items.filter(item => {
    const daysLeft = getDaysUntilExpiry(item.expiryDate);
    return daysLeft !== null && daysLeft <= 30;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-uganda-black">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Track and manage medical supplies and equipment</p>
        </div>
        <button
          onClick={handleAddItem}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-uganda-yellow text-uganda-black font-medium rounded-lg hover:bg-yellow-500 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Item
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-uganda-black">{items.length}</p>
              <p className="text-sm text-gray-600">Total Items</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">$</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-uganda-black">
                ${totalValue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Value</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-uganda-red rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-uganda-black">{lowStockItems}</p>
              <p className="text-sm text-gray-600">Low Stock Items</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-uganda-yellow rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-uganda-black" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-uganda-black">{expiringItems}</p>
              <p className="text-sm text-gray-600">Expiring Soon</p>
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
                placeholder="Search inventory items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const daysLeft = getDaysUntilExpiry(item.expiryDate);
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getStatusIcon(item.status)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-uganda-black">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.category} • {item.unit}
                          </div>
                          {item.batchNumber && (
                            <div className="text-xs text-gray-400">
                              Batch: {item.batchNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-uganda-black">
                        <span className="font-medium">{item.currentStock.toLocaleString()}</span> {item.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        Reorder at: {item.reorderLevel.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Value: ${(item.currentStock * item.cost).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.expiryDate ? (
                        <div>
                          <div className="text-sm text-gray-900">{item.expiryDate}</div>
                          <div className={`text-xs font-medium ${getExpiryColor(daysLeft)}`}>
                            {daysLeft !== null && (
                              daysLeft > 0 ? `${daysLeft} days left` : 
                              daysLeft === 0 ? 'Expires today' : 
                              `Expired ${Math.abs(daysLeft)} days ago`
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {item.facility}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewItem(item)}
                          className="text-gray-600 hover:text-uganda-black"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit item"
                        >
                          <Edit className="w-4 h-4" />
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-uganda-black">
                {modalType === 'add' ? 'Add New Item' : 
                 modalType === 'edit' ? 'Edit Item' : 'Item Details'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {modalType === 'view' && selectedItem ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-uganda-black mb-4">
                        Item Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Name</label>
                          <p className="text-gray-900 font-medium">{selectedItem.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Category</label>
                          <p className="text-gray-900">{selectedItem.category}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Unit</label>
                          <p className="text-gray-900">{selectedItem.unit}</p>
                        </div>
                        {selectedItem.batchNumber && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Batch Number</label>
                            <p className="text-gray-900">{selectedItem.batchNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-uganda-black mb-4">
                        Stock Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Current Stock</label>
                          <p className="text-2xl font-bold text-uganda-black">
                            {selectedItem.currentStock.toLocaleString()} {selectedItem.unit}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Reorder Level</label>
                          <p className="text-gray-900">{selectedItem.reorderLevel.toLocaleString()} {selectedItem.unit}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedItem.status)}`}>
                            {selectedItem.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-uganda-black mb-4">
                        Financial Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Unit Cost</label>
                          <p className="text-gray-900">${selectedItem.cost.toFixed(2)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Total Value</label>
                          <p className="text-2xl font-bold text-green-600">
                            ${(selectedItem.currentStock * selectedItem.cost).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Supplier</label>
                          <p className="text-gray-900">{selectedItem.supplier}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-uganda-black mb-4">
                        Location & Dates
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Facility</label>
                          <p className="text-gray-900">{selectedItem.facility}</p>
                        </div>
                        {selectedItem.expiryDate && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                            <p className="text-gray-900">{selectedItem.expiryDate}</p>
                            <p className={`text-sm font-medium ${getExpiryColor(getDaysUntilExpiry(selectedItem.expiryDate))}`}>
                              {(() => {
                                const daysLeft = getDaysUntilExpiry(selectedItem.expiryDate);
                                if (daysLeft !== null) {
                                  return daysLeft > 0 ? `${daysLeft} days left` : 
                                         daysLeft === 0 ? 'Expires today' : 
                                         `Expired ${Math.abs(daysLeft)} days ago`;
                                }
                                return '';
                              })()}
                            </p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium text-gray-500">Last Updated</label>
                          <p className="text-gray-900">{selectedItem.lastUpdated}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Item form would be implemented here
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}