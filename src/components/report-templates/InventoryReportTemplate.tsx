import React from 'react';
import ReportTemplate from './ReportTemplate';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  cost: number;
  supplier: string;
  facility: string;
  status: string;
  lastUpdated: string;
  description?: string;
}

interface InventoryReportTemplateProps {
  data: InventoryItem[];
  generatedDate: string;
  generatedBy: string;
  filters?: {
    category?: string;
    facility?: string;
    status?: string;
    searchTerm?: string;
  };
}

const InventoryReportTemplate: React.FC<InventoryReportTemplateProps> = ({
  data,
  generatedDate,
  generatedBy,
  filters
}) => {
  // Calculate inventory summary
  const totalItems = data.length;
  const totalValue = data.reduce((sum, item) => sum + (item.cost * item.currentStock), 0);
  const lowStockItems = data.filter(item => item.currentStock <= item.minStock).length;
  const outOfStockItems = data.filter(item => item.currentStock === 0).length;
  const overStockItems = data.filter(item => item.currentStock > item.maxStock).length;

  // Status breakdown
  const statusBreakdown = data.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Category breakdown
  const categoryBreakdown = data.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Facility breakdown
  const facilityBreakdown = data.reduce((acc, item) => {
    acc[item.facility] = (acc[item.facility] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Low stock alerts
  const lowStockAlerts = data
    .filter(item => item.currentStock <= item.minStock)
    .sort((a, b) => a.currentStock - b.currentStock);

  // High value items
  const highValueItems = data
    .filter(item => item.cost > 0)
    .sort((a, b) => (b.cost * b.currentStock) - (a.cost * a.currentStock))
    .slice(0, 10);

  const columns = [
    'Name',
    'SKU',
    'Category',
    'Current Stock',
    'Min Stock',
    'Max Stock',
    'Cost (UGX)',
    'Total Value (UGX)',
    'Supplier',
    'Facility',
    'Status',
    'Last Updated'
  ];

  const formatData = (data: InventoryItem[]) => {
    return data.map(item => ({
      Name: item.name,
      SKU: item.sku,
      Category: item.category,
      'Current Stock': item.currentStock,
      'Min Stock': item.minStock,
      'Max Stock': item.maxStock,
      'Cost (UGX)': item.cost,
      'Total Value (UGX)': item.cost * item.currentStock,
      Supplier: item.supplier,
      Facility: item.facility,
      Status: item.status,
      'Last Updated': new Date(item.lastUpdated).toLocaleDateString('en-UG')
    }));
  };

  const summary = {
    totalItems,
    totalValue,
    statusBreakdown,
    categoryBreakdown,
    facilityBreakdown,
    lowStockItems,
    outOfStockItems,
    overStockItems
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Uganda Flag Colors */}
      <div className="bg-gradient-to-r from-yellow-400 via-black to-red-600 text-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Uganda Flag Emblem */}
              <div className="relative">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-red-600 rounded-full"></div>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white"></div>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold">GOU STORES</h1>
                <p className="text-sm opacity-90">Government of Uganda</p>
                <p className="text-xs opacity-75">Decentralized Inventory Management System</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm opacity-90">
                <p>Republic of Uganda</p>
                <p>Ministry of Finance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Title Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-4 border-yellow-400">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-2">Inventory Status Report</h2>
            <p className="text-xl text-gray-600 mb-4">Comprehensive inventory analysis and stock status</p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                <h3 className="text-sm font-medium text-blue-600 uppercase tracking-wide">Report Type</h3>
                <p className="text-lg font-semibold text-blue-900">Inventory Analysis</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                <h3 className="text-sm font-medium text-green-600 uppercase tracking-wide">Generated Date</h3>
                <p className="text-lg font-semibold text-green-900">{generatedDate}</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
                <h3 className="text-sm font-medium text-purple-600 uppercase tracking-wide">Generated By</h3>
                <p className="text-lg font-semibold text-purple-900">{generatedBy}</p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-orange-500">
                <h3 className="text-sm font-medium text-orange-600 uppercase tracking-wide">Total Items</h3>
                <p className="text-lg font-semibold text-orange-900">{totalItems.toLocaleString()}</p>
              </div>
            </div>

            {/* Applied Filters */}
            {filters && Object.keys(filters).some(key => filters[key as keyof typeof filters]) && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-600 mb-3">Applied Filters</h4>
                <div className="flex flex-wrap justify-center gap-2">
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value) return null;
                    return (
                      <span key={key} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        {key === 'searchTerm' ? 'Search' : key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Summary Cards */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Inventory Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Total Items</p>
                  <p className="text-2xl font-bold text-blue-900">{totalItems.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Total Value</p>
                  <p className="text-2xl font-bold text-green-900">
                    {new Intl.NumberFormat('en-UG', {
                      style: 'currency',
                      currency: 'UGX',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(totalValue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-600">Low Stock</p>
                  <p className="text-2xl font-bold text-orange-900">{lowStockItems}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-900">{outOfStockItems}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-700 mb-3">Status Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(statusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">{status}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-700 mb-3">Category Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(categoryBreakdown).map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{category}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Facility Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-700 mb-3">Facility Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(facilityBreakdown).map(([facility, count]) => (
                  <div key={facility} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{facility}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-orange-50 border-b border-orange-200">
          <div className="container mx-auto px-6 py-6">
            <h3 className="text-lg font-semibold text-orange-800 mb-4">⚠️ Low Stock Alerts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockAlerts.slice(0, 6).map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                      {item.currentStock}/{item.minStock}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">SKU: {item.sku}</p>
                  <p className="text-sm text-gray-600">Facility: {item.facility}</p>
                  <p className="text-sm text-orange-600 font-medium">
                    Stock level: {item.currentStock} (Min: {item.minStock})
                  </p>
                </div>
              ))}
            </div>
            {lowStockAlerts.length > 6 && (
              <p className="text-sm text-orange-600 mt-4 text-center">
                +{lowStockAlerts.length - 6} more items with low stock
              </p>
            )}
          </div>
        </div>
      )}

      {/* High Value Items */}
      {highValueItems.length > 0 && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="container mx-auto px-6 py-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">💰 High Value Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {highValueItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      {new Intl.NumberFormat('en-UG', {
                        style: 'currency',
                        currency: 'UGX',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(item.cost * item.currentStock)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">SKU: {item.sku}</p>
                  <p className="text-sm text-gray-600">Stock: {item.currentStock}</p>
                  <p className="text-sm text-green-600 font-medium">
                    Unit Cost: {new Intl.NumberFormat('en-UG', {
                      style: 'currency',
                      currency: 'UGX',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(item.cost)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Data Table */}
      <div className="bg-white">
        <div className="container mx-auto px-6 py-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Inventory Data</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gradient-to-r from-yellow-400 to-yellow-500">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider border-r border-yellow-300 last:border-r-0"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formatData(data).map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {columns.map((column, colIndex) => {
                      const value = row[column];
                      const isStatus = column.toLowerCase().includes('status');
                      const isCurrency = column.toLowerCase().includes('ugx') || column.toLowerCase().includes('cost') || column.toLowerCase().includes('value');
                      const isNumber = column.toLowerCase().includes('stock') || column.toLowerCase().includes('min') || column.toLowerCase().includes('max');
                      
                      return (
                        <td
                          key={colIndex}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 last:border-r-0"
                        >
                          {isStatus ? (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              value === 'active' ? 'bg-green-100 text-green-800' :
                              value === 'inactive' ? 'bg-red-100 text-red-800' :
                              value === 'low_stock' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {value}
                            </span>
                          ) : isCurrency ? (
                            <span className="font-mono font-medium text-green-700">
                              {typeof value === 'number' ? new Intl.NumberFormat('en-UG', {
                                style: 'currency',
                                currency: 'UGX',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              }).format(value) : value}
                            </span>
                          ) : isNumber ? (
                            <span className="font-mono font-medium text-blue-700">
                              {typeof value === 'number' ? value.toLocaleString() : value}
                            </span>
                          ) : (
                            value
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No inventory data available</p>
              <p className="text-gray-400 text-sm">Try adjusting your filters or generating a different report type</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer with Signature Areas */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-4 border-yellow-400">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Generated By */}
            <div className="text-center">
              <div className="border-t-2 border-gray-300 pt-4">
                <p className="text-sm text-gray-600 mb-2">Generated By</p>
                <p className="font-semibold text-gray-800">{generatedBy}</p>
                <p className="text-xs text-gray-500 mt-1">System User</p>
              </div>
            </div>

            {/* Verified By */}
            <div className="text-center">
              <div className="border-t-2 border-gray-300 pt-4">
                <p className="text-sm text-gray-600 mb-2">Verified By</p>
                <div className="h-12 border-b border-gray-300 mb-2"></div>
                <p className="text-xs text-gray-500">Signature</p>
              </div>
            </div>

            {/* Approved By */}
            <div className="text-center">
              <div className="border-t-2 border-gray-300 pt-4">
                <p className="text-sm text-gray-600 mb-2">Approved By</p>
                <div className="h-12 border-b border-gray-300 mb-2"></div>
                <p className="text-xs text-gray-500">Signature</p>
              </div>
            </div>
          </div>

          {/* Report Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <div className="flex items-center justify-center space-x-4 mb-2">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                </div>
              </div>
              <p className="text-lg font-semibold text-gray-800">GOU STORES</p>
            </div>
            <p className="text-sm text-gray-600">Government of Uganda • Ministry of Finance</p>
            <p className="text-xs text-gray-500 mt-1">
              This inventory report was generated electronically on {generatedDate} • 
              Report ID: #{Date.now().toString().slice(-8)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryReportTemplate;
