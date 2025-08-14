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
    'Unit Price (UGX)',
    'Total Value (UGX)',
    'Facility',
    'Status',
    'User'
  ];

  const formatData = (data: Transaction[]) => {
    return data.map(t => ({
      Date: new Date(t.date).toLocaleDateString('en-UG'),
      'Item Name': t.itemName,
      Type: t.type.replace('_', ' ').toUpperCase(),
      Quantity: t.quantity,
      'Unit Price (UGX)': t.cost,
      'Total Value (UGX)': t.cost * t.quantity,
      Facility: t.facility,
      Status: t.status,
      User: t.userName
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
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-2xl rounded-lg">
        {/* Header Section */}
        <header className="text-white p-6 sm:p-8 rounded-t-lg overflow-hidden relative">
          {/* Uganda Flag Stripes */}
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 bg-black"></div>
            <div className="flex-1 bg-yellow-400"></div>
            <div className="flex-1 bg-red-600"></div>
          </div>
          
          {/* Content Overlay */}
          <div className="relative z-10 flex justify-between items-center flex-wrap gap-4">
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
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">GOU STORES</h1>
                <p className="text-white drop-shadow-md">Government of Uganda</p>
                <p className="text-white drop-shadow-md text-sm">Decentralized Inventory Management System</p>
              </div>
            </div>
            
            <div className="text-right">
              <h2 className="text-4xl font-extrabold tracking-wide text-white drop-shadow-lg">TRANSACTIONS REPORT</h2>
              <p className="text-white drop-shadow-md mt-1">As of: {generatedDate}</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 sm:p-8">
          {/* Report Metadata */}
          <div className="grid md:grid-cols-3 gap-6 mb-8 border-b pb-6 border-gray-200">
            <div className="bg-slate-50 p-4 rounded-md">
              <p className="text-sm text-gray-500 font-semibold">Report ID</p>
              <p className="text-lg font-bold text-slate-700">TXN-{Date.now().toString().slice(-8)}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-md">
              <p className="text-sm text-gray-500 font-semibold">Prepared By</p>
              <p className="text-lg font-bold text-slate-700">{generatedBy}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-md">
              <p className="text-sm text-gray-500 font-semibold">Department</p>
              <p className="text-lg font-bold text-slate-700">Finance & Operations</p>
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
                      {key === 'searchTerm' ? 'Search' : key === 'dateFrom' ? 'From Date' : key === 'dateTo' ? 'To Date' : key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Financial Summary Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-500 text-white p-5 rounded-xl shadow-lg">
              <h3 className="font-semibold text-lg">Total Transactions</h3>
              <p className="font-bold text-4xl">{totalTransactions.toLocaleString()}</p>
            </div>
            <div className="bg-green-500 text-white p-5 rounded-xl shadow-lg">
              <h3 className="font-semibold text-lg">Stock In Value</h3>
              <p className="font-bold text-4xl">{formatCurrency(totalStockInValue)}</p>
            </div>
            <div className="bg-red-500 text-white p-5 rounded-xl shadow-lg">
              <h3 className="font-semibold text-lg">Stock Out Value</h3>
              <p className="font-bold text-4xl">{formatCurrency(totalStockOutValue)}</p>
            </div>
            <div className="bg-purple-500 text-white p-5 rounded-xl shadow-lg">
              <h3 className="font-semibold text-lg">Net Change</h3>
              <p className={`font-bold text-4xl ${netInventoryChange >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {netInventoryChange >= 0 ? '+' : ''}{formatCurrency(netInventoryChange)}
              </p>
            </div>
          </div>

          {/* Transaction Type Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Type Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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

          {/* High Value Transactions */}
          {highValueTransactions.length > 0 && (
            <div className="mb-8 p-6 bg-green-50 rounded-lg border border-green-200">
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
          )}

          {/* Transactions Table */}
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
                      const isType = column === 'Type';
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
                          ) : isType ? (
                            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getTypeColor(value.toLowerCase().replace(' ', '_'))}`}>
                              {value}
                            </span>
                          ) : isCurrency ? (
                            <span className="font-semibold text-gray-900">
                              {typeof value === 'number' ? formatCurrency(value) : value}
                            </span>
                          ) : isQuantity ? (
                            <span className="font-medium text-gray-800">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No transaction data available</p>
              <p className="text-gray-400 text-sm">Try adjusting your filters or generating a different report type</p>
            </div>
          )}

          {/* Notes Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Notes & Observations</h3>
            <div className="space-y-2 text-gray-600 text-sm">
              <p>• Total transactions processed: {totalTransactions} across all facilities.</p>
              <p>• Net inventory value change: {formatCurrency(netInventoryChange)} UGX.</p>
              <p>• Stock in transactions: {stockInTransactions.length} with total value {formatCurrency(totalStockInValue)} UGX.</p>
              <p>• Stock out transactions: {stockOutTransactions.length} with total value {formatCurrency(totalStockOutValue)} UGX.</p>
              {adjustmentTransactions.length > 0 && (
                <p>• Adjustments made: {adjustmentTransactions.length} with total value {formatCurrency(totalAdjustmentValue)} UGX.</p>
              )}
              <p>• This report was generated automatically by the GOU STORES system on {generatedDate}.</p>
            </div>
          </div>
        </main>

        {/* Footer Section */}
        <footer className="text-white p-6 sm:p-8 rounded-b-lg mt-8 overflow-hidden relative">
          {/* Uganda Flag Stripes */}
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 bg-black"></div>
            <div className="flex-1 bg-yellow-400"></div>
            <div className="flex-1 bg-red-600"></div>
          </div>
          
          {/* Content Overlay */}
          <div className="relative z-10 flex justify-between items-center flex-wrap gap-4">
            <div className="w-2/5">
              <p className="font-semibold text-white drop-shadow-md">Generated By:</p>
              <p className="text-white drop-shadow-md mt-1">{generatedBy}</p>
            </div>
            <p className="text-white drop-shadow-md text-sm">Page 1 of 1</p>
            <div className="text-right">
              <p className="text-white drop-shadow-md text-sm">GOU STORES</p>
              <p className="text-white drop-shadow-md text-xs">Government of Uganda</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TransactionsReportTemplate;
