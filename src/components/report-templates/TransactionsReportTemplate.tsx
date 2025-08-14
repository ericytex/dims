import React from 'react';

interface Transaction {
  id: string;
  itemName: string;
  itemId: string;
  type: 'stock_in' | 'stock_out' | 'adjustment' | 'transfer';
  quantity: number;
  cost: number;
  facility: string;
  status: string;
  date: string;
  notes?: string;
  userId: string;
  userName: string;
}

interface TransactionsReportTemplateProps {
  data: Transaction[];
  generatedDate: string;
  generatedBy: string;
  filters?: {
    type?: string;
    facility?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
  };
}

const TransactionsReportTemplate: React.FC<TransactionsReportTemplateProps> = ({
  data,
  generatedDate,
  generatedBy,
  filters
}) => {
  // Calculate transaction summary
  const totalTransactions = data.length;
  const stockInTransactions = data.filter(t => t.type === 'stock_in');
  const stockOutTransactions = data.filter(t => t.type === 'stock_out');
  const adjustmentTransactions = data.filter(t => t.type === 'adjustment');
  const transferTransactions = data.filter(t => t.type === 'transfer');

  const totalStockInValue = stockInTransactions.reduce((sum, t) => sum + (t.cost * t.quantity), 0);
  const totalStockOutValue = stockOutTransactions.reduce((sum, t) => sum + (t.cost * t.quantity), 0);
  const totalAdjustmentValue = adjustmentTransactions.reduce((sum, t) => sum + (t.cost * t.quantity), 0);

  const netInventoryChange = totalStockInValue - totalStockOutValue + totalAdjustmentValue;

  // Status breakdown
  const statusBreakdown = data.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Facility breakdown
  const facilityBreakdown = data.reduce((acc, t) => {
    acc[t.facility] = (acc[t.facility] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Type breakdown
  const typeBreakdown = data.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recent high-value transactions
  const highValueTransactions = data
    .filter(t => t.cost > 0)
    .sort((a, b) => (b.cost * b.quantity) - (a.cost * a.quantity))
    .slice(0, 10);

  const columns = [
    'Date',
    'Item Name',
    'Type',
    'Quantity',
    'Cost (UGX)',
    'Total Value (UGX)',
    'Facility',
    'Status',
    'User',
    'Notes'
  ];

  const formatData = (data: Transaction[]) => {
    return data.map(t => ({
      Date: new Date(t.date).toLocaleDateString('en-UG'),
      'Item Name': t.itemName,
      Type: t.type.replace('_', ' ').toUpperCase(),
      Quantity: t.quantity,
      'Cost (UGX)': t.cost,
      'Total Value (UGX)': t.cost * t.quantity,
      Facility: t.facility,
      Status: t.status,
      User: t.userName,
      Notes: t.notes || 'N/A'
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
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800',
      'approved': 'bg-blue-100 text-blue-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      'stock_in': 'bg-green-100 text-green-800',
      'stock_out': 'bg-red-100 text-red-800',
      'adjustment': 'bg-blue-100 text-blue-800',
      'transfer': 'bg-purple-100 text-purple-800'
    };
    return typeColors[type] || 'bg-gray-100 text-gray-800';
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
            <h2 className="text-4xl font-bold text-gray-800 mb-2">Stock Transactions Report</h2>
            <p className="text-xl text-gray-600 mb-4">Comprehensive financial and inventory movement analysis</p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                <h3 className="text-sm font-medium text-blue-600 uppercase tracking-wide">Report Type</h3>
                <p className="text-lg font-semibold text-blue-900">Transactions Analysis</p>
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
                <h3 className="text-sm font-medium text-orange-600 uppercase tracking-wide">Total Transactions</h3>
                <p className="text-lg font-semibold text-orange-900">{totalTransactions.toLocaleString()}</p>
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
                        {key === 'searchTerm' ? 'Search' : key === 'dateFrom' ? 'From Date' : key === 'dateTo' ? 'To Date' : key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Stock In Value</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(totalStockInValue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600">Stock Out Value</p>
                  <p className="text-2xl font-bold text-red-900">{formatCurrency(totalStockOutValue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Adjustments</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalAdjustmentValue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600">Net Change</p>
                  <p className={`text-2xl font-bold ${netInventoryChange >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {netInventoryChange >= 0 ? '+' : ''}{formatCurrency(netInventoryChange)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Type Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Type Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-700 mb-3">Transaction Types</h4>
              <div className="space-y-2">
                {Object.entries(typeBreakdown).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(type)}`}>
                      {type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-700 mb-3">Status Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(statusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                      {status}
                    </span>
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

      {/* High Value Transactions */}
      {highValueTransactions.length > 0 && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="container mx-auto px-6 py-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">💰 High Value Transactions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {highValueTransactions.map((t) => (
                <div key={t.id} className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{t.itemName}</h4>
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      {formatCurrency(t.cost * t.quantity)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(t.type)}`}>
                      {t.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">Quantity: {t.quantity}</p>
                  <p className="text-sm text-gray-600">Facility: {t.facility}</p>
                  <p className="text-sm text-green-600 font-medium">
                    Unit Cost: {formatCurrency(t.cost)}
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Transaction Data</h3>
          
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
                      const isType = column.toLowerCase().includes('type');
                      const isCurrency = column.toLowerCase().includes('ugx') || column.toLowerCase().includes('cost') || column.toLowerCase().includes('value');
                      const isNumber = column.toLowerCase().includes('quantity');
                      
                      return (
                        <td
                          key={colIndex}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 last:border-r-0"
                        >
                          {isStatus ? (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
                              {value}
                            </span>
                          ) : isType ? (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(value.toLowerCase().replace(' ', '_'))}`}>
                              {value}
                            </span>
                          ) : isCurrency ? (
                            <span className="font-mono font-medium text-green-700">
                              {typeof value === 'number' ? formatCurrency(value) : value}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No transaction data available</p>
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
              This transactions report was generated electronically on {generatedDate} • 
              Report ID: #{Date.now().toString().slice(-8)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsReportTemplate;
