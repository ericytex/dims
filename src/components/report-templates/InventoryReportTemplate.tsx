import React from 'react';

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
  const lowStockItems = data.filter(item => item.currentStock <= item.minStock && item.currentStock > 0).length;
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
    .filter(item => item.currentStock <= item.minStock && item.currentStock > 0)
    .sort((a, b) => a.currentStock - b.currentStock);

  // High value items
  const highValueItems = data
    .filter(item => item.cost > 0)
    .sort((a, b) => (b.cost * b.currentStock) - (a.cost * a.currentStock))
    .slice(0, 10);

  const columns = [
    'SKU / ID',
    'Item Name',
    'Category',
    'Quantity',
    'Unit Price (UGX)',
    'Total Value (UGX)',
    'Status'
  ];

  const formatData = (data: InventoryItem[]) => {
    return data.map(item => ({
      'SKU / ID': item.sku,
      'Item Name': item.name,
      'Category': item.category,
      'Quantity': item.currentStock,
      'Unit Price (UGX)': item.cost,
      'Total Value (UGX)': item.cost * item.currentStock,
      'Status': item.currentStock === 0 ? 'Out of Stock' : 
                item.currentStock <= item.minStock ? 'Low Stock' : 'In Stock'
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'In Stock': 'bg-green-100 text-green-800',
      'Low Stock': 'bg-yellow-100 text-yellow-800',
      'Out of Stock': 'bg-red-100 text-red-800',
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-red-100 text-red-800',
      'low_stock': 'bg-orange-100 text-orange-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusTextColor = (status: string) => {
    if (status === 'Out of Stock') return 'text-red-600 font-bold';
    return 'text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-2xl rounded-lg">
        {/* Header Section */}
        <header className="bg-slate-800 text-white p-6 sm:p-8 rounded-t-lg">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              {/* Uganda Coat of Arms */}
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                <img 
                  src="/embleme.jpeg" 
                  alt="Uganda Coat of Arms" 
                  className="w-16 h-16 object-contain"
                />
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-white">GOU STORES</h1>
                <p className="text-slate-200">Government of Uganda</p>
                <p className="text-slate-300 text-sm">Decentralized Inventory Management System</p>
              </div>
            </div>
            
            <div className="text-right">
              <h2 className="text-4xl font-extrabold tracking-wide text-white">INVENTORY REPORT</h2>
              <p className="text-slate-200 mt-1">As of: {generatedDate}</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 sm:p-8">
          {/* Report Metadata */}
          <div className="grid md:grid-cols-3 gap-6 mb-8 border-b pb-6 border-gray-200">
            <div className="bg-slate-50 p-4 rounded-md">
              <p className="text-sm text-gray-500 font-semibold">Report ID</p>
              <p className="text-lg font-bold text-slate-700">INV-{Date.now().toString().slice(-8)}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-md">
              <p className="text-sm text-gray-500 font-semibold">Prepared By</p>
              <p className="text-lg font-bold text-slate-700">{generatedBy}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-md">
              <p className="text-sm text-gray-500 font-semibold">Department</p>
              <p className="text-lg font-bold text-slate-700">Warehouse & Logistics</p>
            </div>
          </div>

          {/* Applied Filters */}
          {filters && Object.keys(filters).some(key => filters[key as keyof typeof filters]) && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-3">Applied Filters</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <span key={key} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {key === 'searchTerm' ? 'Search' : key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-500 text-white p-5 rounded-xl shadow-lg">
              <h3 className="font-semibold text-lg">Total Items</h3>
              <p className="font-bold text-4xl">{totalItems.toLocaleString()}</p>
            </div>
            <div className="bg-green-500 text-white p-5 rounded-xl shadow-lg">
              <h3 className="font-semibold text-lg">Total Value</h3>
              <p className="font-bold text-4xl">{formatCurrency(totalValue)}</p>
            </div>
            <div className="bg-yellow-500 text-white p-5 rounded-xl shadow-lg">
              <h3 className="font-semibold text-lg">Items Low on Stock</h3>
              <p className="font-bold text-4xl">{lowStockItems}</p>
            </div>
            <div className="bg-red-500 text-white p-5 rounded-xl shadow-lg">
              <h3 className="font-semibold text-lg">Out of Stock</h3>
              <p className="font-bold text-4xl">{outOfStockItems}</p>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Status Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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

          {/* Inventory Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left rounded-lg overflow-hidden border border-gray-200">
              <thead className="bg-slate-200 text-slate-700 uppercase text-sm font-semibold">
                <tr>
                  {columns.map((column, index) => (
                    <th key={index} className={`p-4 ${
                      column.includes('Price') || column.includes('Value') ? 'text-right' :
                      column === 'Quantity' ? 'text-center' : ''
                    }`}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {formatData(data).map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-slate-50 hover:bg-gray-100'}>
                    {columns.map((column, colIndex) => {
                      const value = row[column];
                      const isStatus = column === 'Status';
                      const isCurrency = column.includes('UGX');
                      const isQuantity = column === 'Quantity';
                      
                      return (
                        <td key={colIndex} className={`p-4 ${
                          column.includes('Price') || column.includes('Value') ? 'text-right' :
                          column === 'Quantity' ? 'text-center' : ''
                        }`}>
                          {isStatus ? (
                            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
                              {value}
                            </span>
                          ) : isCurrency ? (
                            <span className="font-semibold text-gray-900">
                              {typeof value === 'number' ? formatCurrency(value) : value}
                            </span>
                          ) : isQuantity ? (
                            <span className={`font-medium ${getStatusTextColor(row['Status'])}`}>
                              {typeof value === 'number' ? value.toLocaleString() : value}
                            </span>
                          ) : (
                            <span className="font-medium text-gray-800">{value}</span>
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

          {/* Notes Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Notes & Observations</h3>
            <div className="space-y-2 text-gray-600 text-sm">
              {lowStockAlerts.length > 0 && (
                <p>• {lowStockAlerts.length} items are currently low on stock and may need reordering.</p>
              )}
              {outOfStockItems > 0 && (
                <p>• {outOfStockItems} items are out of stock and require immediate attention.</p>
              )}
              {overStockItems > 0 && (
                <p>• {overStockItems} items exceed maximum stock levels and may need redistribution.</p>
              )}
              <p>• This report was generated automatically by the GOU STORES system on {generatedDate}.</p>
              <p>• Total inventory value: {formatCurrency(totalValue)} UGX across {totalItems} items.</p>
            </div>
          </div>
        </main>

        {/* Footer Section */}
        <footer className="bg-slate-800 text-white p-6 sm:p-8 rounded-b-lg mt-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="w-2/5">
              <p className="font-semibold text-white">Generated By:</p>
              <p className="text-slate-200 mt-1">{generatedBy}</p>
            </div>
            <p className="text-slate-200 text-sm">Page 1 of 1</p>
            <div className="text-right">
              <p className="text-slate-200 text-sm">GOU STORES</p>
              <p className="text-slate-300 text-xs">Government of Uganda</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default InventoryReportTemplate;
