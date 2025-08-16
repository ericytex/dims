import React from 'react';
import { Transfer } from '../../services/firebaseDatabase';

interface TransfersReportTemplateProps {
  data: Transfer[];
  generatedDate: string;
  generatedBy: string;
  filters?: any;
}

export default function TransfersReportTemplate({ data, generatedDate, generatedBy, filters }: TransfersReportTemplateProps) {
  // Calculate transfer statistics
  const totalTransfers = data.length;
  const pendingTransfers = data.filter(transfer => transfer.status === 'pending').length;
  const approvedTransfers = data.filter(transfer => transfer.status === 'approved').length;
  const inTransitTransfers = data.filter(transfer => transfer.status === 'in_transit').length;
  const deliveredTransfers = data.filter(transfer => transfer.status === 'delivered').length;
  const urgentTransfers = data.filter(transfer => transfer.priority === 'urgent').length;
  
  // Group transfers by priority
  const transfersByPriority = data.reduce((acc, transfer) => {
    acc[transfer.priority] = (acc[transfer.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get priority breakdown
  const priorityBreakdown = Object.entries(transfersByPriority).map(([priority, count]) => ({
    priority,
    count,
    percentage: ((count / totalTransfers) * 100).toFixed(1)
  }));

  return (
    <div className="w-full bg-white p-8">
      {/* Header */}
      <header className="bg-white text-slate-800 p-6 sm:p-8 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <img src="/embleme.jpeg" alt="Uganda Emblem" className="w-12 h-12 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">GOU STORES</h1>
              <p className="text-slate-600">Government of Uganda</p>
              <p className="text-sm text-slate-500">Decentralized Inventory Management System</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-slate-800">TRANSFERS REPORT</h2>
            <p className="text-slate-600">As of: {generatedDate}</p>
          </div>
        </div>
      </header>

      {/* Title Section */}
      <div className="bg-white border-b-4 border-yellow-400">
        <div className="p-6 sm:p-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Transfer Management Overview</h3>
          <p className="text-slate-600">Comprehensive analysis of inter-facility inventory transfers</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <p className="text-sm text-slate-500">Report ID</p>
            <p className="text-lg font-semibold text-slate-800">TRF-{Date.now().toString().slice(-8)}</p>
          </div>
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <p className="text-sm text-slate-500">Prepared By</p>
            <p className="text-lg font-semibold text-slate-800">{generatedBy}</p>
          </div>
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <p className="text-sm text-slate-500">Department</p>
            <p className="text-lg font-semibold text-slate-800">Transfer Management</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800">Total Transfers</h3>
            <p className="text-3xl font-bold text-blue-600">{totalTransfers}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">{pendingTransfers}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="text-lg font-semibold text-green-800">Delivered</h3>
            <p className="text-3xl font-bold text-green-600">{deliveredTransfers}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <h3 className="text-lg font-semibold text-red-800">Urgent</h3>
            <p className="text-3xl font-bold text-red-600">{urgentTransfers}</p>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Transfer Priority Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {priorityBreakdown.map(({ priority, count, percentage }) => (
              <div key={priority} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <h4 className="text-lg font-semibold text-slate-800 capitalize">{priority}</h4>
                  <p className="text-3xl font-bold text-slate-600">{count}</p>
                  <p className="text-sm text-slate-500">{percentage}% of total transfers</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transfers Table */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Transfer Details</h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white text-slate-700 uppercase text-sm font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">Item</th>
                  <th className="px-6 py-3 text-left">From</th>
                  <th className="px-6 py-3 text-left">To</th>
                  <th className="px-6 py-3 text-left">Quantity</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Priority</th>
                  <th className="px-6 py-3 text-left">Request Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((transfer, index) => (
                  <tr key={transfer.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-slate-600">
                            {transfer.itemName?.charAt(0)?.toUpperCase() || 'I'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-900">{transfer.itemName || 'Unknown Item'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{transfer.fromFacility || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{transfer.toFacility || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{transfer.quantity} {transfer.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transfer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        transfer.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        transfer.status === 'in_transit' ? 'bg-purple-100 text-purple-800' :
                        transfer.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {transfer.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transfer.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        transfer.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        transfer.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {transfer.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(transfer.requestDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes & Observations */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Notes & Observations</h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>{pendingTransfers} transfers are currently pending approval or processing.</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>{deliveredTransfers} transfers have been successfully completed and delivered.</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>{urgentTransfers} transfers are marked as urgent and require immediate attention.</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>This report was generated automatically by the GOU STORES system on {generatedDate}.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t-4 border-yellow-400">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="text-slate-600">
              <p className="font-medium">Generated By: {generatedBy}</p>
              <p className="text-sm">GOU STORES Government of Uganda</p>
            </div>
            <div className="text-center text-slate-600">
              <p className="text-sm">Page 1 of 1</p>
            </div>
            <div className="text-right text-slate-600">
              <p className="text-sm">Report ID: TRF-{Date.now().toString().slice(-8)}</p>
              <p className="text-sm">Total Transfers: {totalTransfers}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
