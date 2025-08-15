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
  Clock,
  Settings,
  X,
  ChevronDown,
  ChevronUp,
  Monitor
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { InventoryReportTemplate, TransactionsReportTemplate } from '../components/report-templates';

// Extend jsPDF with autoTable method
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
  };
  columns: {
    inventory: string[];
    users: string[];
    facilities: string[];
    transactions: string[];
    transfers: string[];
  };
}

export default function Reports() {
  const { user } = useFirebaseAuth();
  const { 
    inventoryItems, 
    stockTransactions, 
    facilities, 
    transfers, 
    loading, 
    error 
  } = useFirebaseDatabase();
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
    filters: {},
    columns: {
      inventory: ['Name', 'SKU', 'Category', 'Stock', 'Min Stock', 'Cost', 'Supplier', 'Facility', 'Status'],
      users: ['Name', 'Email', 'Role', 'Phone', 'Facility', 'Status'],
      facilities: ['Name', 'Type', 'Location', 'Manager', 'Status', 'Capacity'],
      transactions: ['Date', 'Type', 'Item', 'Quantity', 'Facility', 'Status', 'Notes'],
      transfers: ['Date', 'From', 'To', 'Item', 'Quantity', 'Status', 'Notes']
    }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showHTMLPreview, setShowHTMLPreview] = useState(false);
  const [filteredData, setFilteredData] = useState<any[]>([]);

  // Load all data for reports using the same source as Inventory page
  useEffect(() => {
    const loadReportData = async () => {
      try {
        // Get users data separately since it's not in useFirebaseDatabase
        const users = await FirebaseDatabaseService.getUsers();
        
        setReportData({
          inventory: inventoryItems || [],
          users: users || [],
          facilities: facilities || [],
          transactions: stockTransactions || [],
          transfers: transfers || []
        });
        
      } catch (error) {
        console.error('Error loading report data:', error);
      }
    };

    if (inventoryItems && facilities && stockTransactions && transfers) {
      loadReportData();
    }
  }, [inventoryItems, facilities, stockTransactions, transfers]);

  // Apply filters to data
  useEffect(() => {
    const applyFilters = () => {
      let data = reportData[reportConfig.type as keyof ReportData] || [];
      
      // Apply search filter
      if (reportConfig.filters.searchTerm) {
        const searchTerm = reportConfig.filters.searchTerm.toLowerCase();
        data = data.filter((item: any) => {
          return Object.values(item).some(value => 
            String(value).toLowerCase().includes(searchTerm)
          );
        });
      }

      // Apply status filter
      if (reportConfig.filters.status && reportConfig.filters.status !== 'all') {
        data = data.filter((item: any) => item.status === reportConfig.filters.status);
      }

      // Apply facility filter
      if (reportConfig.filters.facility && reportConfig.filters.facility !== 'all') {
        data = data.filter((item: any) => 
          item.facility === reportConfig.filters.facility || 
          item.facilityName === reportConfig.filters.facility
        );
      }

      // Apply category filter (for inventory)
      if (reportConfig.filters.category && reportConfig.filters.category !== 'all') {
        data = data.filter((item: any) => item.category === reportConfig.filters.category);
      }

      // Apply role filter (for users)
      if (reportConfig.filters.role && reportConfig.filters.role !== 'all') {
        data = data.filter((item: any) => item.role === reportConfig.filters.role);
      }

      // Apply date filters
      if (reportConfig.filters.dateFrom || reportConfig.filters.dateTo) {
        data = data.filter((item: any) => {
          if (!item.date) return true;
          const itemDate = new Date(item.date);
          const fromDate = reportConfig.filters.dateFrom ? new Date(reportConfig.filters.dateFrom) : null;
          const toDate = reportConfig.filters.dateTo ? new Date(reportConfig.filters.dateTo) : null;
          
          if (fromDate && itemDate < fromDate) return false;
          if (toDate && itemDate > toDate) return false;
          return true;
        });
      }

      setFilteredData(data);
    };

    applyFilters();
  }, [reportData, reportConfig.filters, reportConfig.type]);

  // Get available filter options
  const getFilterOptions = () => {
    const data = reportData[reportConfig.type as keyof ReportData] || [];
    
    return {
      statuses: [...new Set(data.map((item: any) => item.status).filter(Boolean))],
      categories: [...new Set(data.map((item: any) => item.category).filter(Boolean))],
      facilities: [...new Set(data.map((item: any) => item.facility || item.facilityName).filter(Boolean))],
      roles: [...new Set(data.map((item: any) => item.role).filter(Boolean))]
    };
  };

  // Clear all filters
  const clearFilters = () => {
    setReportConfig(prev => ({
      ...prev,
      filters: {}
    }));
  };

  // Toggle column visibility
  const toggleColumn = (column: string) => {
    const currentColumns = reportConfig.columns[reportConfig.type as keyof typeof reportConfig.columns];
    const newColumns = currentColumns.includes(column)
      ? currentColumns.filter(col => col !== column)
      : [...currentColumns, column];
    
    setReportConfig(prev => ({
      ...prev,
      columns: {
        ...prev.columns,
        [prev.type]: newColumns
      }
    }));
  };

  // Generate preview data
  const generatePreviewData = () => {
    const data = filteredData.slice(0, 10); // Show first 10 items
    const columns = reportConfig.columns[reportConfig.type as keyof typeof reportConfig.columns];
    
    return { data, columns, totalCount: filteredData.length };
  };

  // Generate PDF Report
  const generatePDFReport = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;

      // Header with proper spacing
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text('DIMS Inventory Management System', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      doc.setFontSize(14);
      doc.text(`Report: ${getReportTitle()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.text(`Generated by: ${user?.displayName || user?.email}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 25; // More space before content

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
        default:
          doc.setFontSize(14);
          doc.text('Unknown report type', 14, yPosition);
      }

      // Save PDF
      const fileName = `DIMS_${reportConfig.type}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      // addNotification('PDF report generated successfully!', 'success'); // Removed as per edit hint
    } catch (error) {
      // addNotification('Failed to generate PDF report', 'error'); // Removed as per edit hint
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

  // Simple PDF generation without autoTable
  const generateSimplePDF = (doc: jsPDF, title: string, data: any[], columns: string[]) => {
    try {
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 14;
      const columnWidth = (pageWidth - 2 * margin) / columns.length;
      
      // Title
      doc.setFontSize(16);
      doc.text(title, margin, yPosition);
      yPosition += 15;

      // Headers with proper spacing
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      columns.forEach((column, index) => {
        const xPosition = margin + (index * columnWidth);
        doc.text(column, xPosition, yPosition);
      });
      yPosition += 10;

      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Data rows
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      data.forEach((row, rowIndex) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        columns.forEach((column, colIndex) => {
          const xPosition = margin + (colIndex * columnWidth);
          const value = row[column] || row[colIndex] || 'N/A';
          const text = String(value).substring(0, Math.floor(columnWidth / 6)); // Limit text length
          doc.text(text, xPosition, yPosition);
        });
        yPosition += 8;
      });
    } catch (error) {
      console.error('Error in simple PDF generation:', error);
      doc.setFontSize(14);
      doc.text('Error generating data', 14, 20);
    }
  };

  const generateInventoryPDF = (doc: jsPDF, startY: number) => {
    try {
      const inventoryData = reportData.inventory || [];
      
      if (inventoryData.length === 0) {
        doc.setFontSize(14);
        doc.text('No inventory data available', 14, startY);
        return;
      }

      // Try autoTable first, fallback to simple PDF
      try {
        const head = [['Name', 'SKU', 'Category', 'Stock', 'Min Stock', 'Cost', 'Supplier', 'Facility', 'Status']];
        const body = inventoryData.map(item => [
          item.name || 'N/A',
          item.sku || 'N/A',
          item.category || 'N/A',
          item.currentStock?.toString() || '0',
          item.minStock?.toString() || '0',
          `UGX ${(item.cost || 0).toLocaleString()}`,
          item.supplier || 'N/A',
          item.facility || 'N/A',
          item.status || 'N/A'
        ]);

        if (typeof doc.autoTable === 'function') {
          doc.autoTable({
            head: head,
            body: body,
            startY: startY,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [255, 204, 0], textColor: [0, 0, 0] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: 10, right: 10, bottom: 10, left: 10 }
          });
        } else {
          // Fallback to simple PDF with better structure
          const columns = ['Name', 'SKU', 'Category', 'Stock', 'Min Stock', 'Cost', 'Supplier', 'Facility', 'Status'];
          const data = inventoryData.map(item => ({
            Name: item.name || 'N/A',
            SKU: item.sku || 'N/A',
            Category: item.category || 'N/A',
            Stock: item.currentStock?.toString() || '0',
            'Min Stock': item.minStock?.toString() || '0',
            Cost: `UGX ${(item.cost || 0).toLocaleString()}`,
            Supplier: item.supplier || 'N/A',
            Facility: item.facility || 'N/A',
            Status: item.status || 'N/A'
          }));
          generateSimplePDF(doc, 'Inventory Report', data, columns);
        }
      } catch (autoTableError) {
        console.error('AutoTable failed, using simple PDF:', autoTableError);
        // Fallback to simple PDF with better structure
        const columns = ['Name', 'SKU', 'Category', 'Stock', 'Min Stock', 'Cost', 'Supplier', 'Facility', 'Status'];
        const data = inventoryData.map(item => ({
          Name: item.name || 'N/A',
          SKU: item.sku || 'N/A',
          Category: item.category || 'N/A',
          Stock: item.currentStock?.toString() || '0',
          'Min Stock': item.minStock?.toString() || '0',
          Cost: `UGX ${(item.cost || 0).toLocaleString()}`,
          Supplier: item.supplier || 'N/A',
          Facility: item.facility || 'N/A',
          Status: item.status || 'N/A'
        }));
        generateSimplePDF(doc, 'Inventory Report', data, columns);
      }
    } catch (error) {
      console.error('Error generating inventory PDF:', error);
      doc.setFontSize(14);
      doc.text('Error generating inventory data', 14, startY);
    }
  };

  const generateUsersPDF = (doc: jsPDF, startY: number) => {
    try {
      const usersData = reportData.users || [];
      
      if (usersData.length === 0) {
        doc.setFontSize(14);
        doc.text('No users data available', 14, startY);
        return;
      }

      // Try autoTable first, fallback to simple PDF
      try {
        const head = [['Name', 'Email', 'Role', 'Phone', 'Facility', 'Status']];
        const body = usersData.map(user => [
          user.name || 'N/A',
          user.email || 'N/A',
          user.role || 'N/A',
          user.phone || 'N/A',
          user.facilityName || 'N/A',
          user.status || 'N/A'
        ]);

        if (typeof doc.autoTable === 'function') {
          doc.autoTable({
            head: head,
            body: body,
            startY: startY,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [255, 204, 0], textColor: [0, 0, 0] },
            alternateRowStyles: { fillColor: [245, 245, 245] }
          });
        } else {
          // Fallback to simple PDF
          const columns = ['Name', 'Email', 'Role', 'Phone', 'Facility', 'Status'];
          const data = usersData.map(user => ({
            Name: user.name || 'N/A',
            Email: user.email || 'N/A',
            Role: user.role || 'N/A',
            Phone: user.phone || 'N/A',
            Facility: user.facilityName || 'N/A',
            Status: user.status || 'N/A'
          }));
          generateSimplePDF(doc, 'Users Report', data, columns);
        }
      } catch (autoTableError) {
        console.error('AutoTable failed, using simple PDF:', autoTableError);
        // Fallback to simple PDF
        const columns = ['Name', 'Email', 'Role', 'Phone', 'Facility', 'Status'];
        const data = usersData.map(user => ({
          Name: user.name || 'N/A',
          Email: user.email || 'N/A',
          Role: user.role || 'N/A',
          Phone: user.phone || 'N/A',
          Facility: user.facilityName || 'N/A',
          Status: user.status || 'N/A'
        }));
        generateSimplePDF(doc, 'Users Report', data, columns);
      }
    } catch (error) {
      console.error('Error generating users PDF:', error);
      doc.setFontSize(14);
      doc.text('Error generating users data', 14, startY);
    }
  };

  const generateFacilitiesPDF = (doc: jsPDF, startY: number) => {
    try {
      const facilitiesData = reportData.facilities || [];
      
      if (facilitiesData.length === 0) {
        doc.setFontSize(14);
        doc.text('No facilities data available', 14, startY);
        return;
      }

      // Try autoTable first, fallback to simple PDF
      try {
        const head = [['Name', 'Type', 'Location', 'Status', 'Contact']];
        const body = facilitiesData.map(facility => [
          facility.name || 'N/A',
          facility.type || 'N/A',
          facility.location || 'N/A',
          facility.status || 'N/A',
          facility.contact || 'N/A'
        ]);

        if (typeof doc.autoTable === 'function') {
          doc.autoTable({
            head: head,
            body: body,
            startY: startY,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [255, 204, 0], textColor: [0, 0, 0] },
            alternateRowStyles: { fillColor: [245, 245, 245] }
          });
        } else {
          // Fallback to simple PDF
          const columns = ['Name', 'Type', 'Location', 'Status', 'Contact'];
          const data = facilitiesData.map(facility => ({
            Name: facility.name || 'N/A',
            Type: facility.type || 'N/A',
            Location: facility.location || 'N/A',
            Status: facility.status || 'N/A',
            Contact: facility.contact || 'N/A'
          }));
          generateSimplePDF(doc, 'Facilities Report', data, columns);
        }
      } catch (autoTableError) {
        console.error('AutoTable failed, using simple PDF:', autoTableError);
        // Fallback to simple PDF
        const columns = ['Name', 'Type', 'Location', 'Status', 'Contact'];
        const data = facilitiesData.map(facility => ({
          Name: facility.name || 'N/A',
          Type: facility.type || 'N/A',
          Location: facility.location || 'N/A',
          Status: facility.status || 'N/A',
          Contact: facility.contact || 'N/A'
        }));
        generateSimplePDF(doc, 'Facilities Report', data, columns);
      }
    } catch (error) {
      console.error('Error generating facilities PDF:', error);
      doc.setFontSize(14);
      doc.text('Error generating facilities data', 14, startY);
    }
  };

  const generateTransactionsPDF = (doc: jsPDF, startY: number) => {
    try {
      const transactionsData = reportData.transactions || [];
      
      if (transactionsData.length === 0) {
        doc.setFontSize(14);
        doc.text('No transactions data available', 14, startY);
        return;
      }

      // Try autoTable first, fallback to simple PDF
      try {
        const head = [['Date', 'Type', 'Item', 'Quantity', 'Facility', 'Status', 'Notes']];
        const body = transactionsData.map(transaction => [
          transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A',
          transaction.type || 'N/A',
          transaction.itemName || 'N/A',
          transaction.quantity?.toString() || '0',
          transaction.facility || 'N/A',
          transaction.status || 'N/A',
          transaction.notes || ''
        ]);

        if (typeof doc.autoTable === 'function') {
          doc.autoTable({
            head: head,
            body: body,
            startY: startY,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [255, 204, 0], textColor: [0, 0, 0] },
            alternateRowStyles: { fillColor: [245, 245, 245] }
          });
        } else {
          // Fallback to simple PDF
          const columns = ['Date', 'Type', 'Item', 'Quantity', 'Facility', 'Status', 'Notes'];
          const data = transactionsData.map(transaction => ({
            Date: transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A',
            Type: transaction.type || 'N/A',
            Item: transaction.itemName || 'N/A',
            Quantity: transaction.quantity?.toString() || '0',
            Facility: transaction.facility || 'N/A',
            Status: transaction.status || 'N/A',
            Notes: transaction.notes || ''
          }));
          generateSimplePDF(doc, 'Transactions Report', data, columns);
        }
      } catch (autoTableError) {
        console.error('AutoTable failed, using simple PDF:', autoTableError);
        // Fallback to simple PDF
        const columns = ['Date', 'Type', 'Item', 'Quantity', 'Facility', 'Status', 'Notes'];
        const data = transactionsData.map(transaction => ({
          Date: transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A',
          Type: transaction.type || 'N/A',
          Item: transaction.itemName || 'N/A',
          Quantity: transaction.quantity?.toString() || '0',
          Facility: transaction.facility || 'N/A',
          Status: transaction.status || 'N/A',
          Notes: transaction.notes || ''
        }));
        generateSimplePDF(doc, 'Transactions Report', data, columns);
      }
    } catch (error) {
      console.error('Error generating transactions PDF:', error);
      doc.setFontSize(14);
      doc.text('Error generating transactions data', 14, startY);
    }
  };

  const generateTransfersPDF = (doc: jsPDF, startY: number) => {
    try {
      const transfersData = reportData.transfers || [];
      
      if (transfersData.length === 0) {
        doc.setFontSize(14);
        doc.text('No transfers data available', 14, startY);
        return;
      }

      // Try autoTable first, fallback to simple PDF
      try {
        const head = [['Date', 'From', 'To', 'Item', 'Quantity', 'Status', 'Notes']];
        const body = transfersData.map(transfer => [
          transfer.date ? new Date(transfer.date).toLocaleDateString() : 'N/A',
          transfer.fromFacility || 'N/A',
          transfer.toFacility || 'N/A',
          transfer.itemName || 'N/A',
          transfer.quantity?.toString() || '0',
          transfer.status || 'N/A',
          transfer.notes || ''
        ]);

        if (typeof doc.autoTable === 'function') {
          doc.autoTable({
            head: head,
            body: body,
            startY: startY,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [255, 204, 0], textColor: [0, 0, 0] },
            alternateRowStyles: { fillColor: [245, 245, 245] }
          });
        } else {
          // Fallback to simple PDF
          const columns = ['Date', 'From', 'To', 'Item', 'Quantity', 'Status', 'Notes'];
          const data = transfersData.map(transfer => ({
            Date: transfer.date ? new Date(transfer.date).toLocaleDateString() : 'N/A',
            From: transfer.fromFacility || 'N/A',
            To: transfer.toFacility || 'N/A',
            Item: transfer.itemName || 'N/A',
            Quantity: transfer.quantity?.toString() || '0',
            Status: transfer.status || 'N/A',
            Notes: transfer.notes || ''
          }));
          generateSimplePDF(doc, 'Transfers Report', data, columns);
        }
      } catch (autoTableError) {
        console.error('AutoTable failed, using simple PDF:', autoTableError);
        // Fallback to simple PDF
        const columns = ['Date', 'From', 'To', 'Item', 'Quantity', 'Status', 'Notes'];
        const data = transfersData.map(transfer => ({
          Date: transfer.date ? new Date(transfer.date).toLocaleDateString() : 'N/A',
          From: transfer.fromFacility || 'N/A',
          To: transfer.toFacility || 'N/A',
          Item: transfer.itemName || 'N/A',
          Quantity: transfer.quantity?.toString() || '0',
          Status: transfer.status || 'N/A',
          Notes: transfer.notes || ''
        }));
        generateSimplePDF(doc, 'Transfers Report', data, columns);
      }
    } catch (error) {
      console.error('Error generating transfers PDF:', error);
      doc.setFontSize(14);
      doc.text('Error generating transfers data', 14, startY);
    }
  };

  const generateAllReportsPDF = (doc: jsPDF, startY: number) => {
    try {
      let currentY = startY;

      // Inventory Section
      doc.setFontSize(16);
      doc.text('Inventory Report', 14, currentY);
      currentY += 10;
      generateInventoryPDF(doc, currentY);
      currentY = (doc as any).lastAutoTable.finalY + 20;

      // Users Section
      doc.setFontSize(16);
      doc.text('Users Report', 14, currentY);
      currentY += 10;
      generateUsersPDF(doc, currentY);
      currentY = (doc as any).lastAutoTable.finalY + 20;

      // Facilities Section
      doc.setFontSize(16);
      doc.text('Facilities Report', 14, currentY);
      currentY += 10;
      generateFacilitiesPDF(doc, currentY);
      currentY = (doc as any).lastAutoTable.finalY + 20;

      // Transactions Section
      doc.setFontSize(16);
      doc.text('Transactions Report', 14, currentY);
      currentY += 10;
      generateTransactionsPDF(doc, currentY);
      currentY = (doc as any).lastAutoTable.finalY + 20;

      // Transfers Section
      doc.setFontSize(16);
      doc.text('Transfers Report', 14, currentY);
      currentY += 10;
      generateTransfersPDF(doc, currentY);
    } catch (error) {
      console.error('Error generating all reports PDF:', error);
      doc.setFontSize(14);
      doc.text('Error generating comprehensive report', 14, startY);
    }
  };

  // Generate PDF from HTML Preview (ensures exact visual consistency)
  const generatePDFFromHTML = async () => {
    setIsGenerating(true);
    try {
      // Find the HTML report element
      const htmlReportElement = document.querySelector('[data-html-report]');
      
      if (!htmlReportElement) {
        throw new Error('HTML report element not found. Please show the HTML preview first.');
      }

      // Capture the entire HTML content as a single canvas
      const canvas = await html2canvas(htmlReportElement as HTMLElement, {
        scale: 1, // Use scale 1 for better performance and accuracy
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: htmlReportElement.scrollWidth,
        height: htmlReportElement.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      // Create PDF with proper dimensions
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 10; // margin in mm
      const contentWidth = pageWidth - (2 * margin);
      const contentHeight = pageHeight - (2 * margin);

      // Calculate the image dimensions to fit the content width
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      // Calculate how many pages we need
      const totalPages = Math.ceil(imgHeight / contentHeight);

      // Add content to pages
      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        if (pageNum > 0) {
          doc.addPage();
        }

        // Calculate the source and destination positions for this page
        const sourceY = pageNum * contentHeight * (canvas.width / imgWidth);
        const sourceHeight = Math.min(contentHeight * (canvas.width / imgWidth), canvas.height - sourceY);
        const destHeight = Math.min(contentHeight, imgHeight - (pageNum * contentHeight));

        // Create a temporary canvas for this page's content
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = sourceHeight;

        if (tempCtx) {
          // Draw only the portion of the image that belongs to this page
          tempCtx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight, // Source rectangle
            0, 0, canvas.width, sourceHeight // Destination rectangle
          );

          // Add this page's content to the PDF
          doc.addImage(
            tempCanvas.toDataURL('image/png'),
            'PNG',
            margin, margin, imgWidth, destHeight
          );
        }
      }

      // Save PDF
      const fileName = `DIMS_${reportConfig.type}_HTML_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF from HTML:', error);
      // Fallback to regular PDF generation
      generatePDFReport();
    } finally {
      setIsGenerating(false);
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
    if (reportConfig.format === 'pdf') {
      // For inventory and transactions, try to generate from HTML first for exact visual consistency
      if ((reportConfig.type === 'inventory' || reportConfig.type === 'transactions') && showHTMLPreview) {
        generatePDFFromHTML();
      } else {
        generatePDFReport();
      }
    } else {
      generateCSVReport();
    }
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

      {/* Data Status */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-xs text-red-700">{error}</p>
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
                    checked={reportConfig.format === 'pdf'}
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

          {/* Advanced Filters Toggle */}
          <div className="mb-4">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
              {showAdvancedFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </button>
            
            {/* Active Filters Summary */}
            {Object.keys(reportConfig.filters).some(key => reportConfig.filters[key as keyof typeof reportConfig.filters]) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(reportConfig.filters).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {key === 'searchTerm' ? 'Search' : key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                      <button
                        onClick={() => setReportConfig(prev => ({
                          ...prev,
                          filters: { ...prev.filters, [key]: undefined }
                        }))}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Term */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search in data..."
                      value={reportConfig.filters.searchTerm || ''}
                      onChange={(e) => setReportConfig(prev => ({
                        ...prev,
                        filters: { ...prev.filters, searchTerm: e.target.value }
                      }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={reportConfig.filters.status || 'all'}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      filters: { ...prev.filters, status: e.target.value === 'all' ? undefined : e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    {getFilterOptions().statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Facility Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Facility</label>
                  <select
                    value={reportConfig.filters.facility || 'all'}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      filters: { ...prev.filters, facility: e.target.value === 'all' ? undefined : e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow focus:border-transparent"
                  >
                    <option value="all">All Facilities</option>
                    {getFilterOptions().facilities.map(facility => (
                      <option key={facility} value={facility}>{facility}</option>
                    ))}
                  </select>
                </div>

                {/* Category/Role Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {reportConfig.type === 'inventory' ? 'Category' : reportConfig.type === 'users' ? 'Role' : 'Type'}
                  </label>
                  <select
                    value={reportConfig.filters.category || reportConfig.filters.role || 'all'}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      filters: { 
                        ...prev.filters, 
                        category: reportConfig.type === 'inventory' ? (e.target.value === 'all' ? undefined : e.target.value) : undefined,
                        role: reportConfig.type === 'users' ? (e.target.value === 'all' ? undefined : e.target.value) : undefined
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow focus:border-transparent"
                  >
                    <option value="all">All {reportConfig.type === 'inventory' ? 'Categories' : reportConfig.type === 'users' ? 'Roles' : 'Types'}</option>
                    {(reportConfig.type === 'inventory' ? getFilterOptions().categories : 
                      reportConfig.type === 'users' ? getFilterOptions().roles : []).map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date Range Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                  <input
                    type="date"
                    value={reportConfig.filters.dateFrom || ''}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      filters: { ...prev.filters, dateFrom: e.target.value || undefined }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                  <input
                    type="date"
                    value={reportConfig.filters.dateTo || ''}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      filters: { ...prev.filters, dateTo: e.target.value || undefined }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{filteredData.length}</span> items match your filters
                </div>
                <button
                  onClick={clearFilters}
                  className="flex items-center text-sm text-red-600 hover:text-red-800 transition-colors"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear All Filters
                </button>
              </div>
            </div>
          )}

          {/* Column Selector Toggle */}
          <div className="mb-4">
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Customize Columns
              {showColumnSelector ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </button>
          </div>

          {/* Column Selector Panel */}
          {showColumnSelector && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Select columns to include in your report:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {reportConfig.columns[reportConfig.type as keyof typeof reportConfig.columns].map(column => (
                  <label key={column} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled={true}
                      className="w-4 h-4 text-uganda-yellow border-gray-300 rounded focus:ring-uganda-yellow"
                    />
                    <span className="ml-2 text-sm text-gray-700">{column}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">All columns are currently included. Column customization coming in next update.</p>
            </div>
          )}

          {/* Report Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-800">Report Summary</h4>
                <p className="text-xs text-blue-600">
                  {filteredData.length} items found • {reportConfig.type} report • {reportConfig.format.toUpperCase()} format
                </p>
              </div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>
            </div>
          </div>

          {/* Data Preview */}
          {showPreview && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Data Preview (showing first 10 items)</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {generatePreviewData().columns.map(column => (
                        <th key={column} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {generatePreviewData().data.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {generatePreviewData().columns.map(column => (
                          <td key={column} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {item[column] || item[column.toLowerCase()] || 'N/A'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-2">Total: {generatePreviewData().totalCount} items</p>
            </div>
          )}

          {/* HTML Report Preview */}
          {showHTMLPreview && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">Professional HTML Report Preview</h4>
                <div className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                  💡 Use "Exact PDF" button to download PDF that matches this preview exactly
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                {reportConfig.type === 'inventory' && (
                  <div data-html-report>
                    <InventoryReportTemplate
                      data={filteredData}
                      generatedDate={new Date().toLocaleDateString('en-UG')}
                      generatedBy={user?.displayName || user?.email || 'System User'}
                      filters={reportConfig.filters}
                    />
                  </div>
                )}
                {reportConfig.type === 'transactions' && (
                  <div data-html-report>
                    <TransactionsReportTemplate
                      data={filteredData}
                      generatedDate={new Date().toLocaleDateString('en-UG')}
                      generatedBy={user?.displayName || user?.email || 'System User'}
                      filters={reportConfig.filters}
                    />
                  </div>
                )}
                {reportConfig.type !== 'inventory' && reportConfig.type !== 'transactions' && (
                  <div className="p-8 text-center text-gray-500">
                    <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">HTML Report Preview</p>
                    <p className="text-sm">Available for Inventory and Transactions reports</p>
                    <p className="text-xs mt-2">Other report types will use the standard PDF format</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>Report: <span className="font-medium">{getReportTitle()}</span></p>
              <p>Format: <span className="font-medium">{reportConfig.format.toUpperCase()}</span></p>
              <p>Items: <span className="font-medium">{filteredData.length}</span></p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>
              <button
                onClick={() => setShowHTMLPreview(!showHTMLPreview)}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center"
              >
                <Monitor className="w-4 h-4 mr-2" />
                {showHTMLPreview ? 'Hide' : 'Show'} HTML Report
              </button>
              {(reportConfig.type === 'inventory' || reportConfig.type === 'transactions') && showHTMLPreview && (
                <button
                  onClick={generatePDFFromHTML}
                  disabled={isGenerating}
                  className="px-4 py-2 border border-green-600 text-green-700 font-medium rounded-lg hover:bg-green-50 transition-colors flex items-center"
                  title="Generate PDF that exactly matches the HTML preview"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Exact PDF
                </button>
              )}
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