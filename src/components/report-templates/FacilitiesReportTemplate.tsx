import React from 'react';
import { Facility } from '../../services/firebaseDatabase';

interface FacilitiesReportTemplateProps {
  data: Facility[];
  generatedDate: string;
  generatedBy: string;
  filters?: any;
}

export default function FacilitiesReportTemplate({ data, generatedDate, generatedBy, filters }: FacilitiesReportTemplateProps) {
  // Calculate facility statistics
  const totalFacilities = data.length;
  const activeFacilities = data.filter(facility => facility.status === 'active').length;
  const inactiveFacilities = data.filter(facility => facility.status === 'inactive').length;
  
  // Group facilities by type
  const facilitiesByType = data.reduce((acc, facility) => {
    acc[facility.type] = (acc[facility.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get type breakdown
  const typeBreakdown = Object.entries(facilitiesByType).map(([type, count]) => ({
    type,
    count,
    percentage: ((count / totalFacilities) * 100).toFixed(1)
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
            <h2 className="text-3xl font-bold text-slate-800">FACILITIES REPORT</h2>
            <p className="text-slate-600">As of: {generatedDate}</p>
          </div>
        </div>
      </header>

      {/* Title Section */}
      <div className="bg-white border-b-4 border-yellow-400">
        <div className="p-6 sm:p-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Facility Management Overview</h3>
          <p className="text-slate-600">Comprehensive analysis of government facilities and their status</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <p className="text-sm text-slate-500">Report ID</p>
            <p className="text-lg font-semibold text-slate-800">FAC-{Date.now().toString().slice(-8)}</p>
          </div>
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <p className="text-sm text-slate-500">Prepared By</p>
            <p className="text-lg font-semibold text-slate-800">{generatedBy}</p>
          </div>
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <p className="text-sm text-slate-500">Department</p>
            <p className="text-lg font-semibold text-slate-800">Facility Management</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800">Total Facilities</h3>
            <p className="text-3xl font-bold text-blue-600">{totalFacilities}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="text-lg font-semibold text-green-800">Active Facilities</h3>
            <p className="text-3xl font-bold text-green-600">{activeFacilities}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <h3 className="text-lg font-semibold text-red-800">Inactive Facilities</h3>
            <p className="text-3xl font-bold text-red-600">{inactiveFacilities}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800">Types</h3>
            <p className="text-3xl font-bold text-purple-600">{Object.keys(facilitiesByType).length}</p>
          </div>
        </div>

        {/* Type Breakdown */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Facility Type Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {typeBreakdown.map(({ type, count, percentage }) => (
              <div key={type} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <h4 className="text-lg font-semibold text-slate-800 capitalize">{type}</h4>
                  <p className="text-3xl font-bold text-slate-600">{count}</p>
                  <p className="text-sm text-slate-500">{percentage}% of total facilities</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Facilities Table */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Facility Details</h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white text-slate-700 uppercase text-sm font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-left">Address</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Region</th>
                  <th className="px-6 py-3 text-left">Contact Person</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((facility, index) => (
                  <tr key={facility.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-slate-600">
                            {facility.name?.charAt(0)?.toUpperCase() || 'F'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-900">{facility.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {facility.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{facility.address || facility.district}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        facility.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {facility.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{facility.region}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{facility.contactPerson || 'N/A'}</td>
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
                <span>{activeFacilities} facilities are currently operational and serving the public.</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>{inactiveFacilities} facilities are currently inactive and may need attention.</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>System manages {Object.keys(facilitiesByType).length} different types of facilities.</span>
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
              <p className="text-sm">Report ID: FAC-{Date.now().toString().slice(-8)}</p>
              <p className="text-sm">Total Facilities: {totalFacilities}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
