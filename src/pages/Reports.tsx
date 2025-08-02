import React, { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  MapPin,
  FileText,
  Filter,
  X,
  Eye,
  Clock,
  DollarSign,
  Users,
  Building
} from 'lucide-react';

interface ReportData {
  facilityStock: {
    facility: string;
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    expiringItems: number;
  }[];
  consumptionTrends: {
    month: string;
    consumption: number;
    value: number;
  }[];
  expiryReport: {
    item: string;
    facility: string;
    quantity: number;
    expiryDate: string;
    daysLeft: number;
  }[];
  lowStockReport: {
    item: string;
    facility: string;
    currentStock: number;
    reorderLevel: number;
    shortage: number;
  }[];
}

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [selectedFacility, setSelectedFacility] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [modalType, setModalType] = useState<string>('');
  const { addNotification } = useNotification();

  const reportTypes = [
    { value: 'overview', label: 'System Overview' },
    { value: 'stock_levels', label: 'Stock Levels' },
    { value: 'consumption', label: 'Consumption Analysis' },
    { value: 'expiry', label: 'Expiry Report' },
    { value: 'low_stock', label: 'Low Stock Alert' },
    { value: 'transfers', label: 'Transfer Report' }
  ];

  const dateRanges = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ];

  const facilities = [
    { value: 'all', label: 'All Facilities' },
    { value: '1', label: 'Main Warehouse' },
    { value: '2', label: 'Regional Office' },
    { value: '3', label: 'Distribution Center' },
    { value: '4', label: 'Retail Store' }
  ];

  // Mock data for reports
  const reportData: ReportData = {
    facilityStock: [
      {
        facility: 'Main Warehouse',
        totalItems: 1247,
        totalValue: 45678,
        lowStockItems: 8,
        expiringItems: 3
      },
      {
        facility: 'Regional Office',
        totalItems: 432,
        totalValue: 15234,
        lowStockItems: 5,
        expiringItems: 2
      },
      {
        facility: 'Distribution Center',
        totalItems: 892,
        totalValue: 32145,
        lowStockItems: 6,
        expiringItems: 1
      },
      {
        facility: 'Retail Store',
        totalItems: 256,
        totalValue: 8945,
        lowStockItems: 4,
        expiringItems: 2
      }
    ],
    consumptionTrends: [
      { month: 'Jul 2024', consumption: 2340, value: 12450 },
      { month: 'Aug 2024', consumption: 2180, value: 11200 },
      { month: 'Sep 2024', consumption: 2450, value: 13100 },
      { month: 'Oct 2024', consumption: 2630, value: 14200 },
      { month: 'Nov 2024', consumption: 2520, value: 13600 },
      { month: 'Dec 2024', consumption: 2810, value: 15300 },
      { month: 'Jan 2025', consumption: 2940, value: 16100 }
    ],
    expiryReport: [
      {
        item: 'Laptop Computers',
        facility: 'Main Warehouse',
        quantity: 45,
        expiryDate: '2025-02-15',
        daysLeft: 37
      },
      {
        item: 'Office Supplies',
        facility: 'Regional Office',
        quantity: 120,
        expiryDate: '2025-01-25',
        daysLeft: 16
      },
      {
        item: 'Printer Cartridges',
        facility: 'Distribution Center',
        quantity: 80,
        expiryDate: '2025-03-10',
        daysLeft: 60
      }
    ],
    lowStockReport: [
      {
        item: 'Office Chairs',
        facility: 'Regional Office',
        currentStock: 150,
        reorderLevel: 500,
        shortage: 350
      },
      {
        item: 'Network Equipment',
        facility: 'Distribution Center',
        currentStock: 0,
        reorderLevel: 200,
        shortage: 200
      },
      {
        item: 'Laptop Computers',
        facility: 'Retail Store',
        currentStock: 80,
        reorderLevel: 300,
        shortage: 220
      }
    ]
  };

  const handleExportReport = () => {
    addNotification('Your report is being generated and will be downloaded shortly.');
  };

  const handleViewDetails = (record: any, type: string) => {
    setSelectedRecord(record);
    setModalType(type);
    setShowModal(true);
  };

  const getExpiryColor = (daysLeft: number) => {
    if (daysLeft <= 30) return 'text-uganda-red';
    if (daysLeft <= 60) return 'text-uganda-yellow';
    return 'text-green-600';
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-uganda-black">2,827</p>
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
              <p className="text-2xl font-bold text-uganda-black">$102K</p>
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
              <p className="text-2xl font-bold text-uganda-black">23</p>
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
              <p className="text-2xl font-bold text-uganda-black">8</p>
              <p className="text-sm text-gray-600">Expiring Soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Facility Stock Overview */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-uganda-black">Facility Stock Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facility</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Low Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiring</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.facilityStock.map((facility, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="font-medium text-uganda-black">{facility.facility}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {facility.totalItems.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    ${facility.totalValue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      facility.lowStockItems > 5 ? 'bg-red-100 text-red-800' : 
                      facility.lowStockItems > 0 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {facility.lowStockItems}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      facility.expiringItems > 2 ? 'bg-red-100 text-red-800' : 
                      facility.expiringItems > 0 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {facility.expiringItems}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewDetails(facility, 'facility')}
                      className="p-2 text-gray-600 hover:text-uganda-black rounded-lg hover:bg-gray-100"
                      title="View facility details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consumption Trends */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-uganda-black">Consumption Trends</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {reportData.consumptionTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2">
                <span className="text-gray-600">{trend.month}</span>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium text-uganda-black">{trend.consumption.toLocaleString()} items</p>
                    <p className="text-sm text-gray-500">${trend.value.toLocaleString()}</p>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-uganda-yellow h-2 rounded-full" 
                      style={{ width: `${(trend.consumption / 3000) * 100}%` }}
                    />
                  </div>
                  <button
                    onClick={() => handleViewDetails(trend, 'consumption')}
                    className="p-2 text-gray-600 hover:text-uganda-black rounded-lg hover:bg-gray-100"
                    title="View consumption details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderExpiryReport = () => (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-uganda-black">Items Expiring Soon</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facility</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reportData.expiryReport.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-uganda-black">
                  {item.item}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {item.facility}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {item.quantity.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {item.expiryDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`font-medium ${getExpiryColor(item.daysLeft)}`}>
                    {item.daysLeft} days
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleViewDetails(item, 'expiry')}
                    className="p-2 text-gray-600 hover:text-uganda-black rounded-lg hover:bg-gray-100"
                    title="View expiry details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLowStockReport = () => (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-uganda-black">Low Stock Alerts</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facility</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shortage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reportData.lowStockReport.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-uganda-black">
                  {item.item}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {item.facility}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-uganda-red font-medium">
                    {item.currentStock.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {item.reorderLevel.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-uganda-red font-medium">
                    -{item.shortage.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleViewDetails(item, 'low_stock')}
                    className="p-2 text-gray-600 hover:text-uganda-black rounded-lg hover:bg-gray-100"
                    title="View low stock details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderModalContent = () => {
    if (!selectedRecord) return null;

    switch (modalType) {
      case 'facility':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Building className="w-8 h-8 text-uganda-yellow" />
              <div>
                <h3 className="text-xl font-semibold text-uganda-black">{selectedRecord.facility}</h3>
                <p className="text-gray-600">Facility Details</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Total Items</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{selectedRecord.totalItems.toLocaleString()}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">Total Value</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-1">${selectedRecord.totalValue.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-900">Low Stock Items</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900 mt-1">{selectedRecord.lowStockItems}</p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-900">Expiring Soon</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">{selectedRecord.expiringItems}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Recommendations</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                {selectedRecord.lowStockItems > 5 && (
                  <li>• Immediate reorder needed for {selectedRecord.lowStockItems} items</li>
                )}
                {selectedRecord.expiringItems > 2 && (
                  <li>• {selectedRecord.expiringItems} items expiring soon - consider redistribution</li>
                )}
                <li>• Regular inventory audit recommended</li>
                <li>• Consider automated reorder system</li>
              </ul>
            </div>
          </div>
        );

      case 'consumption':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-uganda-yellow" />
              <div>
                <h3 className="text-xl font-semibold text-uganda-black">{selectedRecord.month}</h3>
                <p className="text-gray-600">Consumption Analysis</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Items Consumed</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-1">{selectedRecord.consumption.toLocaleString()}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">Total Value</span>
                </div>
                <p className="text-2xl font-bold text-green-900 mt-1">${selectedRecord.value.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Trend Analysis</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p>• Average daily consumption: {Math.round(selectedRecord.consumption / 30)} items</p>
                <p>• Average item value: ${Math.round(selectedRecord.value / selectedRecord.consumption)}</p>
                <p>• Consumption rate: {Math.round((selectedRecord.consumption / 3000) * 100)}% of capacity</p>
              </div>
            </div>
          </div>
        );

      case 'expiry':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-uganda-yellow" />
              <div>
                <h3 className="text-xl font-semibold text-uganda-black">{selectedRecord.item}</h3>
                <p className="text-gray-600">Expiry Details</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Quantity</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{selectedRecord.quantity.toLocaleString()}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Building className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">Facility</span>
                  </div>
                  <p className="text-lg font-medium text-gray-900 mt-1">{selectedRecord.facility}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-900">Days Left</span>
                  </div>
                  <p className={`text-2xl font-bold mt-1 ${getExpiryColor(selectedRecord.daysLeft)}`}>
                    {selectedRecord.daysLeft} days
                  </p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-900">Expiry Date</span>
                  </div>
                  <p className="text-lg font-medium text-yellow-900 mt-1">{selectedRecord.expiryDate}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Recommended Actions</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                {selectedRecord.daysLeft <= 30 && (
                  <li>• <strong>URGENT:</strong> Immediate action required</li>
                )}
                {selectedRecord.daysLeft <= 60 && (
                  <li>• Consider redistribution to facilities with higher demand</li>
                )}
                <li>• Contact supplier for possible return or exchange</li>
                <li>• Update inventory management procedures</li>
              </ul>
            </div>
          </div>
        );

      case 'low_stock':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-uganda-yellow" />
              <div>
                <h3 className="text-xl font-semibold text-uganda-black">{selectedRecord.item}</h3>
                <p className="text-gray-600">Low Stock Alert</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-900">Current Stock</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900 mt-1">{selectedRecord.currentStock.toLocaleString()}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Building className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">Facility</span>
                  </div>
                  <p className="text-lg font-medium text-gray-900 mt-1">{selectedRecord.facility}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Reorder Level</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{selectedRecord.reorderLevel.toLocaleString()}</p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-900">Shortage</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">-{selectedRecord.shortage.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Recommended Actions</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                {selectedRecord.currentStock === 0 && (
                  <li>• <strong>CRITICAL:</strong> Out of stock - immediate reorder required</li>
                )}
                <li>• Place reorder for {selectedRecord.shortage.toLocaleString()} units</li>
                <li>• Consider emergency procurement if needed</li>
                <li>• Review demand forecasting for this item</li>
              </ul>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">No details available for this record.</p>
          </div>
        );
    }
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'overview':
        return renderOverview();
      case 'expiry':
        return renderExpiryReport();
      case 'low_stock':
        return renderLowStockReport();
      default:
        return (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Report Coming Soon</h3>
            <p className="text-gray-500">This report type is under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-uganda-black">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Generate comprehensive reports and insights</p>
        </div>
        <button
          onClick={handleExportReport}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-uganda-yellow text-uganda-black font-medium rounded-lg hover:bg-yellow-500 transition-colors"
        >
          <Download className="w-5 h-5 mr-2" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {dateRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Facility</label>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {facilities.map(facility => (
                <option key={facility.value} value={facility.value}>
                  {facility.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {renderReportContent()}

      {/* Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-uganda-black">
                Record Details
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {renderModalContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}