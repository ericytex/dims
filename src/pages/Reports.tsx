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
  Filter
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
    { value: '1', label: 'Mulago Hospital' },
    { value: '2', label: 'Kawempe HC IV' },
    { value: '3', label: 'Kiruddu Hospital' },
    { value: '4', label: 'Nsambya HC III' }
  ];

  // Mock data for reports
  const reportData: ReportData = {
    facilityStock: [
      {
        facility: 'Mulago Hospital',
        totalItems: 1247,
        totalValue: 45678,
        lowStockItems: 8,
        expiringItems: 3
      },
      {
        facility: 'Kawempe HC IV',
        totalItems: 432,
        totalValue: 15234,
        lowStockItems: 5,
        expiringItems: 2
      },
      {
        facility: 'Kiruddu Hospital',
        totalItems: 892,
        totalValue: 32145,
        lowStockItems: 6,
        expiringItems: 1
      },
      {
        facility: 'Nsambya HC III',
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
        item: 'Insulin Vials',
        facility: 'Mulago Hospital',
        quantity: 45,
        expiryDate: '2025-02-15',
        daysLeft: 37
      },
      {
        item: 'ORS Sachets',
        facility: 'Kawempe HC IV',
        quantity: 120,
        expiryDate: '2025-01-25',
        daysLeft: 16
      },
      {
        item: 'Vitamin A Capsules',
        facility: 'Kiruddu Hospital',
        quantity: 80,
        expiryDate: '2025-03-10',
        daysLeft: 60
      }
    ],
    lowStockReport: [
      {
        item: 'Amoxicillin 250mg',
        facility: 'Kawempe HC IV',
        currentStock: 150,
        reorderLevel: 500,
        shortage: 350
      },
      {
        item: 'Artemether/Lumefantrine',
        facility: 'Kiruddu Hospital',
        currentStock: 0,
        reorderLevel: 200,
        shortage: 200
      },
      {
        item: 'Paracetamol 500mg',
        facility: 'Nsambya HC III',
        currentStock: 80,
        reorderLevel: 300,
        shortage: 220
      }
    ]
  };

  const handleExportReport = () => {
    addNotification({
      type: 'success',
      title: 'Export Started',
      message: 'Your report is being generated and will be downloaded shortly.'
    });
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.facilityStock.map((facility, index) => (
                <tr key={index}>
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
              <div key={index} className="flex items-center justify-between py-2">
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reportData.expiryReport.map((item, index) => (
              <tr key={index}>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reportData.lowStockReport.map((item, index) => (
              <tr key={index}>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

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
    </div>
  );
}