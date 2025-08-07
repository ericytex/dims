import React, { useState, useEffect } from 'react';
import { useFirebaseDatabase } from '../hooks/useFirebaseDatabase';
import { FirebaseDatabaseService } from '../services/firebaseDatabase';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { 
  FileText, 
  Download, 
  BarChart3, 
  Users, 
  Package, 
  Building, 
  TrendingUp, 
  Calendar,
  Filter,
  Search,
  Eye,
  Printer,
  FileSpreadsheet,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ReportData {
  inventory: any[];
  users: any[];
  facilities: any[];
  transactions: any[];
  transfers: any[];
}

interface ReportConfig {
  type: 'inventory' | 'users' | 'facilities' | 'transactions' | 'transfers' | 'all';
  format: 'pdf' | 'csv';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  filters: {
    status?: string;
    category?: string;
    facility?: string;
    role?: string;
  };
}

export default function Reports() {
  const { user } = useFirebaseAuth();
  const { inventoryItems, loading } = useFirebaseDatabase();
  const [reportData, setReportData] = useState<ReportData>({
    inventory: [],
    users: [],
    facilities: [],
    transactions: [],
    transfers: []
  });
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'inventory',
    format: 'pdf',
    dateRange: 'all',
    filters: {}
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string>('');

  // Load all data for reports
  useEffect(() => {
    const loadReportData = async () => {
      try {
        console.log('Loading report data...');
        
        const [users, facilities, transactions, transfers] = await Promise.all([
          FirebaseDatabaseService.getUsers(),
          FirebaseDatabaseService.getFacilities(),
          FirebaseDatabaseService.getTransactions(),
          FirebaseDatabaseService.getTransfers()
        ]);

        console.log('Loaded data:', {
          inventory: inventoryItems?.length || 0,
          users: users?.length || 0,
          facilities: facilities?.length || 0,
          transactions: transactions?.length || 0,
          transfers: transfers?.length || 0
        });

        // If no data exists, create sample data for demonstration
        const sampleData = {
          inventory: inventoryItems?.length > 0 ? inventoryItems : [
            {
              id: '1',
              name: 'Paracetamol 500mg',
              sku: 'MED001',
              category: 'Medication',
              currentStock: 150,
              minStock: 50,
              cost: 2500,
              supplier: 'Pharma Ltd',
              facility: 'Main Warehouse',
              status: 'active',
              expiryDate: '2025-12-31'
            },
            {
              id: '2',
              name: 'Amoxicillin 250mg',
              sku: 'MED002',
              category: 'Antibiotics',
              currentStock: 75,
              minStock: 100,
              cost: 3500,
              supplier: 'MediCorp',
              facility: 'Regional Office',
              status: 'active',
              expiryDate: '2025-10-15'
            },
            {
              id: '3',
              name: 'Bandages 10cm',
              sku: 'SUP001',
              category: 'Supplies',
              currentStock: 200,
              minStock: 50,
              cost: 500,
              supplier: 'Health Supplies Co',
              facility: 'Distribution Center',
              status: 'active',
              expiryDate: '2026-06-30'
            }
          ],
          users: users?.length > 0 ? users : [
            {
              id: '1',
              name: 'John Doe',
              email: 'john@example.com',
              role: 'admin',
              status: 'active',
              phone: '+256700000001'
            },
            {
              id: '2',
              name: 'Jane Smith',
              email: 'jane@example.com',
              role: 'facility_manager',
              status: 'active',
              phone: '+256700000002'
            }
          ],
          facilities: facilities?.length > 0 ? facilities : [
            {
              id: '1',
              name: 'Main Warehouse',
              type: 'warehouse',
              status: 'active',
              location: 'Kampala'
            },
            {
              id: '2',
              name: 'Regional Office',
              type: 'office',
              status: 'active',
              location: 'Entebbe'
            }
          ],
          transactions: transactions?.length > 0 ? transactions : [
            {
              id: '1',
              itemId: '1',
              itemName: 'Paracetamol 500mg',
              type: 'in',
              quantity: 100,
              date: new Date().toISOString(),
              facility: 'Main Warehouse'
            },
            {
              id: '2',
              itemId: '2',
              itemName: 'Amoxicillin 250mg',
              type: 'out',
              quantity: 25,
              date: new Date().toISOString(),
              facility: 'Regional Office'
            }
          ],
          transfers: transfers?.length > 0 ? transfers : [
            {
              id: '1',
              itemId: '1',
              itemName: 'Paracetamol 500mg',
              fromFacility: 'Main Warehouse',
              toFacility: 'Regional Office',
              quantity: 50,
              status: 'completed',
              date: new Date().toISOString()
            }
          ]
        };

        setReportData(sampleData);
        console.log('Report data set:', sampleData);
      } catch (error) {
        console.error('Error loading report data:', error);
      }
    };

    loadReportData();
  }, [inventoryItems]);

  // Generate PDF Report
  const generatePDFReport = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text('DIMS Inventory Management System', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(12);
      doc.text(`Report: ${getReportTitle()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.text(`Generated by: ${user?.displayName || user?.email}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Report content based on type
      switch (reportConfig.type) {
        case 'inventory':
          generateInventoryPDF(doc, yPosition);
          break;
        case 'users':
          generateUsersPDF(doc, yPosition);
          break;
        case 'facilities':
          generateFacilitiesPDF(doc, yPosition);
          break;
        case 'transactions':
          generateTransactionsPDF(doc, yPosition);
          break;
        case 'transfers':
          generateTransfersPDF(doc, yPosition);
          break;
        case 'all':
          generateAllReportsPDF(doc, yPosition);
          break;
      }

      // Save PDF
      const fileName = `DIMS_${reportConfig.type}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate CSV Report
  const generateCSVReport = async () => {
    setIsGenerating(true);
    try {
      let csvContent = '';
      let fileName = '';

      switch (reportConfig.type) {
        case 'inventory':
          csvContent = generateInventoryCSV();
          fileName = `DIMS_Inventory_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'users':
          csvContent = generateUsersCSV();
          fileName = `DIMS_Users_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'facilities':
          csvContent = generateFacilitiesCSV();
          fileName = `DIMS_Facilities_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'transactions':
          csvContent = generateTransactionsCSV();
          fileName = `DIMS_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'transfers':
          csvContent = generateTransfersCSV();
          fileName = `DIMS_Transfers_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'all':
          csvContent = generateAllReportsCSV();
          fileName = `DIMS_All_Reports_${new Date().toISOString().split('T')[0]}.csv`;
          break;
      }

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating CSV:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // PDF Generation Functions
  const generateInventoryPDF = (doc: jsPDF, startY: number) => {
    const headers = [['Item Name', 'SKU', 'Category', 'Stock', 'Cost', 'Facility', 'Status']];
    const data = reportData.inventory.map(item => [
      item.name,
      item.sku,
      item.category,
      `${item.currentStock} ${item.unit}`,
      `UGX ${item.cost.toLocaleString()}`,
      item.facility,
      item.status
    ]);

    (doc as any).autoTable({
      head: headers,
      body: data,
      startY: startY,
      theme: 'grid',
      headStyles: { fillColor: [255, 193, 7] }
    });
  };

  const generateUsersPDF = (doc: jsPDF, startY: number) => {
    const headers = [['Name', 'Email', 'Role', 'Facility', 'Status', 'Region']];
    const data = reportData.users.map(user => [
      user.name,
      user.email,
      user.role,
      user.facilityName || 'N/A',
      user.status,
      user.region || 'N/A'
    ]);

    (doc as any).autoTable({
      head: headers,
      body: data,
      startY: startY,
      theme: 'grid',
      headStyles: { fillColor: [255, 193, 7] }
    });
  };

  const generateFacilitiesPDF = (doc: jsPDF, startY: number) => {
    const headers = [['Facility Name', 'Type', 'Location', 'Manager', 'Status']];
    const data = reportData.facilities.map(facility => [
      facility.name,
      facility.type,
      facility.location,
      facility.manager || 'N/A',
      facility.status
    ]);

    (doc as any).autoTable({
      head: headers,
      body: data,
      startY: startY,
      theme: 'grid',
      headStyles: { fillColor: [255, 193, 7] }
    });
  };

  const generateTransactionsPDF = (doc: jsPDF, startY: number) => {
    const headers = [['Date', 'Type', 'Item', 'Quantity', 'Facility', 'Status']];
    const data = reportData.transactions.map(transaction => [
      new Date(transaction.date).toLocaleDateString(),
      transaction.type,
      transaction.itemName,
      transaction.quantity,
      transaction.facility,
      transaction.status
    ]);

    (doc as any).autoTable({
      head: headers,
      body: data,
      startY: startY,
      theme: 'grid',
      headStyles: { fillColor: [255, 193, 7] }
    });
  };

  const generateTransfersPDF = (doc: jsPDF, startY: number) => {
    const headers = [['Date', 'From', 'To', 'Item', 'Quantity', 'Status']];
    const data = reportData.transfers.map(transfer => [
      new Date(transfer.date).toLocaleDateString(),
      transfer.fromFacility,
      transfer.toFacility,
      transfer.itemName,
      transfer.quantity,
      transfer.status
    ]);

    (doc as any).autoTable({
      head: headers,
      body: data,
      startY: startY,
      theme: 'grid',
      headStyles: { fillColor: [255, 193, 7] }
    });
  };

  const generateAllReportsPDF = (doc: jsPDF, startY: number) => {
    let currentY = startY;

    // Summary
    doc.setFontSize(16);
    doc.text('System Summary', 20, currentY);
    currentY += 20;

    doc.setFontSize(12);
    doc.text(`Total Items: ${reportData.inventory.length}`, 20, currentY);
    currentY += 10;
    doc.text(`Total Users: ${reportData.users.length}`, 20, currentY);
    currentY += 10;
    doc.text(`Total Facilities: ${reportData.facilities.length}`, 20, currentY);
    currentY += 10;
    doc.text(`Total Transactions: ${reportData.transactions.length}`, 20, currentY);
    currentY += 10;
    doc.text(`Total Transfers: ${reportData.transfers.length}`, 20, currentY);
    currentY += 20;

    // Add each report section
    if (reportData.inventory.length > 0) {
      doc.setFontSize(14);
      doc.text('Inventory Report', 20, currentY);
      currentY += 10;
      generateInventoryPDF(doc, currentY);
      currentY = (doc as any).lastAutoTable.finalY + 20;
    }

    if (reportData.users.length > 0) {
      doc.addPage();
      currentY = 20;
      doc.setFontSize(14);
      doc.text('Users Report', 20, currentY);
      currentY += 10;
      generateUsersPDF(doc, currentY);
    }
  };

  // CSV Generation Functions
  const generateInventoryCSV = () => {
    const headers = ['Item Name', 'SKU', 'Category', 'Stock', 'Cost', 'Facility', 'Status', 'Description'];
    const rows = reportData.inventory.map(item => [
      item.name,
      item.sku,
      item.category,
      `${item.currentStock} ${item.unit}`,
      item.cost,
      item.facility,
      item.status,
      item.description
    ]);
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const generateUsersCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Facility', 'Status', 'Region', 'District', 'Phone'];
    const rows = reportData.users.map(user => [
      user.name,
      user.email,
      user.role,
      user.facilityName || '',
      user.status,
      user.region || '',
      user.district || '',
      user.phone || ''
    ]);
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const generateFacilitiesCSV = () => {
    const headers = ['Facility Name', 'Type', 'Location', 'Manager', 'Status', 'Capacity'];
    const rows = reportData.facilities.map(facility => [
      facility.name,
      facility.type,
      facility.location,
      facility.manager || '',
      facility.status,
      facility.capacity || ''
    ]);
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const generateTransactionsCSV = () => {
    const headers = ['Date', 'Type', 'Item', 'Quantity', 'Facility', 'Status', 'Notes'];
    const rows = reportData.transactions.map(transaction => [
      new Date(transaction.date).toLocaleDateString(),
      transaction.type,
      transaction.itemName,
      transaction.quantity,
      transaction.facility,
      transaction.status,
      transaction.notes || ''
    ]);
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const generateTransfersCSV = () => {
    const headers = ['Date', 'From', 'To', 'Item', 'Quantity', 'Status', 'Notes'];
    const rows = reportData.transfers.map(transfer => [
      new Date(transfer.date).toLocaleDateString(),
      transfer.fromFacility,
      transfer.toFacility,
      transfer.itemName,
      transfer.quantity,
      transfer.status,
      transfer.notes || ''
    ]);
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const generateAllReportsCSV = () => {
    const sections = [
      { title: 'INVENTORY REPORT', data: generateInventoryCSV() },
      { title: 'USERS REPORT', data: generateUsersCSV() },
      { title: 'FACILITIES REPORT', data: generateFacilitiesCSV() },
      { title: 'TRANSACTIONS REPORT', data: generateTransactionsCSV() },
      { title: 'TRANSFERS REPORT', data: generateTransfersCSV() }
    ];

    return sections.map(section => 
      `\n${'='.repeat(50)}\n${section.title}\n${'='.repeat(50)}\n\n${section.data}`
    ).join('\n');
  };

  const getReportTitle = () => {
    const titles = {
      inventory: 'Inventory Report',
      users: 'Users Report',
      facilities: 'Facilities Report',
      transactions: 'Transactions Report',
      transfers: 'Transfers Report',
      all: 'Complete System Report'
    };
    return titles[reportConfig.type];
  };

  const handleGenerateReport = () => {
    console.log('Generating report:', reportConfig);
    if (reportConfig.format === 'pdf') {
      generatePDFReport();
    } else {
      generateCSVReport();
    }
  };

  // Simple test function for debugging
  const testGenerateReport = () => {
    console.log('Test generate report clicked');
    alert('Generate Report button is working! Report config: ' + JSON.stringify(reportConfig));
  };

  const getReportStats = () => {
    const stats = {
      inventory: {
        total: reportData.inventory?.length || 0,
        lowStock: reportData.inventory?.filter(item => (item.currentStock || 0) <= (item.minStock || 0))?.length || 0,
        active: reportData.inventory?.filter(item => item.status === 'active')?.length || 0
      },
      users: {
        total: reportData.users?.length || 0,
        active: reportData.users?.filter(user => user.status === 'active')?.length || 0,
        byRole: reportData.users?.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {} as any) || {}
      },
      facilities: {
        total: reportData.facilities?.length || 0,
        active: reportData.facilities?.filter(facility => facility.status === 'active')?.length || 0
      },
      transactions: {
        total: reportData.transactions?.length || 0,
        thisMonth: reportData.transactions?.filter(t => 
          new Date(t.date).getMonth() === new Date().getMonth()
        )?.length || 0
      },
      transfers: {
        total: reportData.transfers?.length || 0,
        pending: reportData.transfers?.filter(t => t.status === 'pending')?.length || 0
      }
    };
    return stats;
  };

  const stats = getReportStats();

  // Debug section to show actual data
  console.log('Current report data:', reportData);
  console.log('Calculated stats:', stats);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Generate comprehensive reports for all system data</p>
        </div>
        <div className="flex items-center space-x-2">
          <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Debug Info - Remove this in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Info (Development Only)</h3>
          <div className="text-xs text-yellow-700 space-y-1">
            <p>Inventory Items: {reportData.inventory.length}</p>
            <p>Users: {reportData.users.length}</p>
            <p>Facilities: {reportData.facilities.length}</p>
            <p>Transactions: {reportData.transactions.length}</p>
            <p>Transfers: {reportData.transfers.length}</p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Inventory Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inventory.total}</p>
              <p className="text-xs text-red-600">{stats.inventory.lowStock} low stock</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.users.total}</p>
              <p className="text-xs text-green-600">{stats.users.active} active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Building className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Facilities</p>
              <p className="text-2xl font-bold text-gray-900">{stats.facilities.total}</p>
              <p className="text-xs text-green-600">{stats.facilities.active} active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.transactions.total}</p>
              <p className="text-xs text-blue-600">{stats.transactions.thisMonth} this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-indigo-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Transfers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.transfers.total}</p>
              <p className="text-xs text-yellow-600">{stats.transfers.pending} pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Generate Report Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Quick Report Generation</h2>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-red-600" />
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportConfig.type}
              onChange={(e) => setReportConfig(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow focus:border-transparent"
            >
              <option value="inventory">Inventory Report</option>
              <option value="users">Users Report</option>
              <option value="facilities">Facilities Report</option>
              <option value="transactions">Transactions Report</option>
              <option value="transfers">Transfers Report</option>
              <option value="all">Complete System Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="pdf"
                  checked={reportConfig.format === 'pdf'}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, format: e.target.value as 'pdf' | 'csv' }))}
                  className="w-4 h-4 text-uganda-yellow border-gray-300 focus:ring-uganda-yellow"
                />
                <span className="ml-2 text-sm">PDF</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={reportConfig.format === 'csv'}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, format: e.target.value as 'pdf' | 'csv' }))}
                  className="w-4 h-4 text-uganda-yellow border-gray-300 focus:ring-uganda-yellow"
                />
                <span className="ml-2 text-sm">CSV</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={reportConfig.dateRange}
              onChange={(e) => setReportConfig(prev => ({ ...prev, dateRange: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <p>Report: <span className="font-medium">{getReportTitle()}</span></p>
            <p>Format: <span className="font-medium">{reportConfig.format.toUpperCase()}</span></p>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="px-8 py-3 bg-uganda-yellow text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-lg"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Templates */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Report Templates</h2>
          <p className="text-sm text-gray-600 mt-1">Pre-configured reports for common needs</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Low Stock Alert', type: 'inventory', icon: AlertTriangle, color: 'text-red-600' },
              { title: 'User Activity', type: 'users', icon: Users, color: 'text-blue-600' },
              { title: 'Facility Overview', type: 'facilities', icon: Building, color: 'text-purple-600' },
              { title: 'Transaction Summary', type: 'transactions', icon: TrendingUp, color: 'text-orange-600' },
              { title: 'Transfer Status', type: 'transfers', icon: Calendar, color: 'text-indigo-600' },
              { title: 'Complete System', type: 'all', icon: BarChart3, color: 'text-green-600' }
            ].map((template) => (
              <button
                key={template.type}
                onClick={() => {
                  setReportConfig(prev => ({ ...prev, type: template.type as any }));
                  setSelectedReport(template.title);
                }}
                className={`p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                  selectedReport === template.title 
                    ? 'border-uganda-yellow bg-yellow-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <template.icon className={`w-6 h-6 ${template.color}`} />
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">{template.title}</h3>
                    <p className="text-sm text-gray-600">Quick {template.type} report</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Reports</h2>
          <p className="text-sm text-gray-600 mt-1">Your recently generated reports</p>
        </div>

        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No recent reports</p>
            <p className="text-xs text-gray-400">Generate your first report to see it here</p>
          </div>
        </div>
      </div>
    </div>
  );
}