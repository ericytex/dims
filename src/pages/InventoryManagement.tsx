import React, { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
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
  X
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
  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'Laptop Computers',
      description: 'High-performance laptops for office use',
      category: 'Electronics',
      sku: 'LAP-001',
      unit: 'units',
      currentStock: 45,
      minStock: 20,
      maxStock: 100,
      cost: 1200000,
      supplier: 'Tech Supplies Ltd',
      facility: 'Main Warehouse',
      location: 'A1-01',
      lastUpdated: '2025-01-09',
      status: 'active'
    },
    {
      id: '2',
      name: 'Office Chairs',
      description: 'Ergonomic office chairs',
      category: 'Furniture',
      sku: 'CHAIR-002',
      unit: 'pieces',
      currentStock: 120,
      minStock: 50,
      maxStock: 200,
      cost: 150000,
      supplier: 'Furniture World',
      facility: 'Distribution Center',
      location: 'B2-03',
      lastUpdated: '2025-01-08',
      status: 'active'
    },
    {
      id: '3',
      name: 'Printer Paper',
      description: 'A4 printer paper, 80gsm',
      category: 'Office Supplies',
      sku: 'PAPER-003',
      unit: 'reams',
      currentStock: 85,
      minStock: 30,
      maxStock: 150,
      cost: 25000,
      supplier: 'Paper Plus',
      facility: 'Main Warehouse',
      location: 'C3-02',
      lastUpdated: '2025-01-07',
      status: 'active'
    },
    {
      id: '4',
      name: 'Safety Helmets',
      description: 'Industrial safety helmets',
      category: 'Safety Equipment',
      sku: 'HELMET-004',
      unit: 'pieces',
      currentStock: 8,
      minStock: 25,
      maxStock: 80,
      cost: 45000,
      supplier: 'Safety Gear Co',
      facility: 'Regional Warehouse',
      location: 'D4-01',
      lastUpdated: '2025-01-06',
      status: 'active'
    },
    {
      id: '5',
      name: 'Industrial Fans',
      description: 'Large industrial cooling fans',
      category: 'Industrial Equipment',
      sku: 'FAN-005',
      unit: 'units',
      currentStock: 15,
      minStock: 10,
      maxStock: 50,
      cost: 350000,
      supplier: 'Industrial Supplies Ltd',
      facility: 'Main Warehouse',
      location: 'E5-03',
      lastUpdated: '2025-01-05',
      status: 'active'
    },
    {
      id: '6',
      name: 'LED Light Bulbs',
      description: 'Energy-efficient LED bulbs',
      category: 'Lighting',
      sku: 'BULB-006',
      unit: 'pieces',
      currentStock: 200,
      minStock: 100,
      maxStock: 500,
      cost: 15000,
      supplier: 'Light Solutions',
      facility: 'Distribution Center',
      location: 'F6-02',
      lastUpdated: '2025-01-04',
      status: 'active'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedFacility, setSelectedFacility] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Electronics',
    sku: '',
    unit: 'pieces',
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    cost: 0,
    supplier: '',
    facility: 'Main Warehouse',
    location: '',
    expiryDate: '',
    status: 'active' as const
  });
  const { addNotification } = useNotification();

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Furniture', label: 'Furniture' },
    { value: 'Office Supplies', label: 'Office Supplies' },
    { value: 'Safety Equipment', label: 'Safety Equipment' },
    { value: 'Industrial Equipment', label: 'Industrial Equipment' },
    { value: 'Lighting', label: 'Lighting' },
    { value: 'Tools', label: 'Tools' },
    { value: 'Clothing', label: 'Clothing' },
    { value: 'Food & Beverages', label: 'Food & Beverages' }
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
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'discontinued', label: 'Discontinued' }
  ];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesFacility = selectedFacility === 'all' || item.facility === selectedFacility;
    return matchesSearch && matchesCategory && matchesStatus && matchesFacility;
  });

  const handleAddItem = () => {
    setModalType('add');
    setSelectedItem(null);
    setFormData({
      name: '',
      description: '',
      category: 'Electronics',
      sku: '',
      unit: 'pieces',
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      cost: 0,
      supplier: '',
      facility: 'Main Warehouse',
      location: '',
      expiryDate: '',
      status: 'active'
    });
    setShowModal(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setModalType('edit');
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
      status: item.status
    });
    setShowModal(true);
  };

  const handleViewItem = (item: InventoryItem) => {
    setModalType('view');
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDeleteItem = (item: InventoryItem) => {
    if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
      setInventory(inventory.filter(i => i.id !== item.id));
      addNotification('Item deleted successfully', 'success');
    }
  };

  const handleSaveItem = () => {
    if (!formData.name || !formData.sku || !formData.supplier || !formData.location) {
      addNotification('Please fill in all required fields', 'error');
      return;
    }

    if (modalType === 'add') {
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        ...formData,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      setInventory([...inventory, newItem]);
      addNotification('Item added successfully', 'success');
    } else if (modalType === 'edit' && selectedItem) {
      setInventory(inventory.map(item => 
        item.id === selectedItem.id ? { ...item, ...formData, lastUpdated: new Date().toISOString().split('T')[0] } : item
      ));
      addNotification('Item updated successfully', 'success');
    }

    setShowModal(false);
  };

  const getStockStatus = (current: number, min: number) => {
    if (current <= min) return 'low';
    if (current <= min * 1.5) return 'warning';
    return 'good';
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'low':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'good':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
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

  const stats = [
    {
      name: 'Total Items',
      value: inventory.length.toString(),
      change: '+5%',
      changeType: 'increase',
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      name: 'Low Stock Items',
      value: inventory.filter(item => getStockStatus(item.currentStock, item.minStock) === 'low').length.toString(),
      change: '-2%',
      changeType: 'decrease',
      icon: AlertTriangle,
      color: 'bg-red-500'
    },
    {
      name: 'Total Value',
      value: `UGX ${inventory.reduce((sum, item) => sum + (item.currentStock * item.cost), 0).toLocaleString()}`,
      change: '+12%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      name: 'Active Items',
      value: inventory.filter(item => item.status === 'active').length.toString(),
      change: '+3%',
      changeType: 'increase',
      icon: Package,
      color: 'bg-uganda-yellow'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Track and manage inventory items</p>
        </div>
        <button
          onClick={handleAddItem}
          className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Item</span>
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
                placeholder="Search items..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
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
              {facilities.map(facility => (
                <option key={facility.value} value={facility.value}>{facility.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
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

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
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
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {item.currentStock} {item.unit}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(stockStatus)}`}>
                          {stockStatus}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {item.minStock} | Max: {item.maxStock}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      UGX {item.cost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.facility}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewItem(item)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="text-red-400 hover:text-red-600"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {modalType === 'add' ? 'Add New Item' : 
                 modalType === 'edit' ? 'Edit Item' : 'Item Details'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {modalType === 'view' && selectedItem ? (
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
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                      placeholder="Enter item name"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                      placeholder="Enter item description"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    >
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU *
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                      placeholder="Enter SKU"
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
                      Current Stock
                    </label>
                    <input
                      type="number"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({...formData, currentStock: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Stock
                    </label>
                    <input
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({...formData, minStock: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Stock
                    </label>
                    <input
                      type="number"
                      value={formData.maxStock}
                      onChange={(e) => setFormData({...formData, maxStock: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost (UGX)
                    </label>
                    <input
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier *
                    </label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                      placeholder="Enter supplier name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Facility
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                      placeholder="Enter storage location"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
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
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="discontinued">Discontinued</option>
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
                  onClick={handleSaveItem}
                  className="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  {modalType === 'add' ? 'Add Item' : 'Update Item'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}