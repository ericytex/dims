import React from 'react';
import { User } from '../../services/firebaseDatabase';
import { InventoryItem } from '../../services/firebaseDatabase';
import { Facility } from '../../services/firebaseDatabase';
import { StockTransaction } from '../../services/firebaseDatabase';
import { Transfer } from '../../services/firebaseDatabase';

interface CompleteSystemReportTemplateProps {
  data: {
    users?: User[];
    inventory?: InventoryItem[];
    facilities?: Facility[];
    transactions?: StockTransaction[];
    transfers?: Transfer[];
  };
  generatedDate: string;
  generatedBy: string;
  filters?: any;
}

export default function CompleteSystemReportTemplate({ data, generatedDate, generatedBy, filters }: CompleteSystemReportTemplateProps) {
  // Calculate system statistics
  const totalUsers = data.users?.length || 0;
  const activeUsers = data.users?.filter(user => user.status === 'active').length || 0;
  const totalInventory = data.inventory?.length || 0;
  const lowStockItems = data.inventory?.filter(item => (item.currentStock || 0) <= (item.minStock || 0)).length || 0;
  const totalFacilities = data.facilities?.length || 0;
  const activeFacilities = data.facilities?.filter(facility => facility.status === 'active').length || 0;
  const totalTransactions = data.transactions?.length || 0;
  const totalTransfers = data.transfers?.length || 0;
  const pendingTransfers = data.transfers?.filter(t => t.status === 'pending').length || 0;

  // Calculate total inventory value
  const totalInventoryValue = data.inventory?.reduce((sum, item) => 
    sum + ((item.cost || 0) * (item.currentStock || 0)), 0) || 0;

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
            <h2 className="text-3xl font-bold text-slate-800">COMPLETE SYSTEM REPORT</h2>
            <p className="text-slate-600">As of: {generatedDate}</p>
          </div>
        </div>
      </header>

      {/* Title Section */}
      <div className="bg-white border-b-4 border-yellow-400">
        <div className="p-6 sm:p-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Complete System Overview</h3>
          <p className="text-slate-600">Comprehensive analysis of all system components and data</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <p className="text-sm text-slate-500">Report ID</p>
            <p className="text-lg font-semibold text-slate-800">SYS-{Date.now().toString().slice(-8)}</p>
          </div>
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <p className="text-sm text-slate-500">Prepared By</p>
            <p className="text-lg font-semibold text-slate-800">{generatedBy}</p>
          </div>
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <p className="text-sm text-slate-500">Department</p>
            <p className="text-lg font-semibold text-slate-800">System Administration</p>
          </div>
        </div>

        {/* System Overview Cards */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">System Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-800">Users</h4>
              <p className="text-3xl font-bold text-blue-600">{totalUsers}</p>
              <p className="text-sm text-blue-600">{activeUsers} active</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="text-lg font-semibold text-green-800">Inventory</h4>
              <p className="text-3xl font-bold text-green-600">{totalInventory}</p>
              <p className="text-sm text-green-600">{lowStockItems} low stock</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h4 className="text-lg font-semibold text-purple-800">Facilities</h4>
              <p className="text-3xl font-bold text-purple-600">{totalFacilities}</p>
              <p className="text-sm text-purple-600">{activeFacilities} active</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h4 className="text-lg font-semibold text-orange-800">Transactions</h4>
              <p className="text-3xl font-bold text-orange-600">{totalTransactions}</p>
              <p className="text-sm text-orange-600">Total recorded</p>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Financial Summary</h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-slate-800 mb-2">Total Inventory Value</h4>
                <p className="text-4xl font-bold text-green-600">UGX {totalInventoryValue.toLocaleString()}</p>
                <p className="text-sm text-slate-500">Based on current stock levels and unit costs</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-800 mb-2">Transfer Activity</h4>
                <p className="text-3xl font-bold text-blue-600">{totalTransfers}</p>
                <p className="text-sm text-slate-500">Total transfers: {pendingTransfers} pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Module Status */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Module Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h4 className="text-lg font-semibold text-slate-800 mb-2">User Management</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Users:</span>
                  <span className="font-semibold">{totalUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Active:</span>
                  <span className="text-green-600 font-semibold">{activeUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Inactive:</span>
                  <span className="text-red-600 font-semibold">{totalUsers - activeUsers}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Inventory Management</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Items:</span>
                  <span className="font-semibold">{totalInventory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Low Stock:</span>
                  <span className="text-red-600 font-semibold">{lowStockItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Value:</span>
                  <span className="text-green-600 font-semibold">UGX {totalInventoryValue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Facility Management</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Facilities:</span>
                  <span className="font-semibold">{totalFacilities}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Active:</span>
                  <span className="text-green-600 font-semibold">{activeFacilities}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Inactive:</span>
                  <span className="text-red-600 font-semibold">{totalFacilities - activeFacilities}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Transaction History</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Transactions:</span>
                  <span className="font-semibold">{totalTransactions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Stock In:</span>
                  <span className="text-green-600 font-semibold">
                    {data.transactions?.filter(t => t.type === 'stock_in').length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Stock Out:</span>
                  <span className="text-red-600 font-semibold">
                    {data.transactions?.filter(t => t.type === 'stock_out').length || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Transfer Management</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Transfers:</span>
                  <span className="font-semibold">{totalTransfers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Pending:</span>
                  <span className="text-yellow-600 font-semibold">{pendingTransfers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Completed:</span>
                  <span className="text-green-600 font-semibold">
                    {data.transfers?.filter(t => t.status === 'delivered').length || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h4 className="text-lg font-semibold text-slate-800 mb-2">System Health</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Status:</span>
                  <span className="text-green-600 font-semibold">Operational</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Modules:</span>
                  <span className="font-semibold">5 Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Last Updated:</span>
                  <span className="text-slate-600 font-semibold">{generatedDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Observations */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">System Analysis & Recommendations</h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span><strong>User Management:</strong> {activeUsers} out of {totalUsers} users are currently active, indicating good system adoption.</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span><strong>Inventory Status:</strong> {lowStockItems} items require immediate attention due to low stock levels.</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span><strong>Facility Operations:</strong> {activeFacilities} out of {totalFacilities} facilities are operational and serving the public.</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span><strong>Transfer Efficiency:</strong> {pendingTransfers} transfers are pending, which may indicate workflow bottlenecks.</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span><strong>Financial Value:</strong> Total inventory value of UGX {totalInventoryValue.toLocaleString()} represents significant government assets.</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>This comprehensive system report was generated automatically by the GOU STORES system on {generatedDate}.</span>
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
              <p className="text-sm">Report ID: SYS-{Date.now().toString().slice(-8)}</p>
              <p className="text-sm">System Status: Operational</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
