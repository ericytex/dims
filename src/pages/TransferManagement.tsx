import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useOffline } from '../contexts/OfflineContext';
import { useFirebaseDatabase } from '../hooks/useFirebaseDatabase';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { FirebaseDatabaseService } from '../services/firebaseDatabase';
import ConfirmationDialog from '../components/ConfirmationDialog';
import ReportService from '../services/ReportService';
import {
  Plus,
  Search,
  ArrowRightLeft,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  MapPin,
  User,
  Calendar,
  Eye,
  Check,
  X,
  Filter,
  Download,
  RefreshCw,
  Edit
} from 'lucide-react';

interface Transfer {
  id?: string;
  itemId: string;
  itemName?: string;
  quantity: number;
  unit: string;
  fromFacilityId: string;
  fromFacility?: string;
  toFacilityId: string;
  toFacility?: string;
  requestedBy: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_transit' | 'delivered' | 'cancelled';
  approvedBy?: string;
  approvalDate?: string;
  deliveryDate?: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  trackingNumber?: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function TransferManagement() {
  const { addNotification } = useNotification();
  const { isOnline } = useOffline();
  const { user } = useFirebaseAuth();
  const { transfers, facilities, inventoryItems, loading } = useFirebaseDatabase();
  
  const [filteredTransfers, setFilteredTransfers] = useState<Transfer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [transferToDelete, setTransferToDelete] = useState<Transfer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isStartingTransit, setIsStartingTransit] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const [formData, setFormData] = useState<Partial<Transfer>>({
    itemId: '',
    quantity: 0,
    unit: '',
    fromFacilityId: '',
    toFacilityId: '',
    reason: '',
    priority: 'medium',
    notes: ''
  });

  // Load transfers and enhance with item and facility names
  useEffect(() => {
    const enhanceTransfers = async () => {
      console.log('TransferManagement: Data received:', {
        transfers: transfers?.length || 0,
        facilities: facilities?.length || 0,
        inventoryItems: inventoryItems?.length || 0
      });
      
      if (transfers && facilities && inventoryItems) {
        console.log('TransferManagement: Enhancing transfers...');
        const enhanced = transfers.map(transfer => {
          const item = inventoryItems.find(item => item.id === transfer.itemId);
          const fromFacility = facilities.find(f => f.id === transfer.fromFacilityId);
          const toFacility = facilities.find(f => f.id === transfer.toFacilityId);
          
          return {
            ...transfer,
            itemName: item?.name || 'Unknown Item',
            fromFacility: fromFacility?.name || 'Unknown Facility',
            toFacility: toFacility?.name || 'Unknown Facility'
          };
        });
        
        console.log('TransferManagement: Enhanced transfers:', enhanced);
        setFilteredTransfers(enhanced);
      } else {
        console.log('TransferManagement: Missing data for enhancement');
      }
    };

    enhanceTransfers();
  }, [transfers, facilities, inventoryItems]);

  // Filter transfers based on search and filters
  useEffect(() => {
    if (!filteredTransfers.length) return; // Don't filter if no transfers loaded yet
    
    let filtered = [...filteredTransfers]; // Create a copy to avoid mutation

    if (searchTerm) {
      filtered = filtered.filter(transfer =>
        transfer.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.fromFacility?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.toFacility?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(transfer => transfer.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(transfer => transfer.priority === priorityFilter);
    }

    // Update the filtered results without overriding the main filteredTransfers
    setFilteredTransfers(filtered);
  }, [searchTerm, statusFilter, priorityFilter]);

  const handleAddTransfer = () => {
    setShowAddModal(true);
    setSelectedTransfer(null);
    setFormData({
      itemId: '',
      quantity: 0,
      unit: '',
      fromFacilityId: '',
      toFacilityId: '',
      reason: '',
      priority: 'medium',
      notes: ''
    });
  };

  const handleGenerateSampleTransfers = async () => {
    try {
      await FirebaseDatabaseService.generateSampleTransfers();
      addNotification('Sample transfers generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating sample transfers:', error);
      addNotification('Failed to generate sample transfers. Please try again.', 'error');
    }
  };

  const handleSaveTransfer = async () => {
    try {
      if (!formData.itemId || !formData.fromFacilityId || !formData.toFacilityId) {
        addNotification('Please fill in all required fields', 'error');
        return;
      }

      const transferData = {
        ...formData,
        requestedBy: user?.displayName || user?.email || 'Unknown',
        requestDate: new Date().toISOString(),
        status: 'pending' as const,
        trackingNumber: `TRK-${Date.now()}`
      };

      await FirebaseDatabaseService.addTransfer(transferData);
      addNotification('Transfer request created successfully', 'success');
      setShowAddModal(false);
      setFormData({});
    } catch (error) {
      console.error('Error creating transfer:', error);
      addNotification('Failed to create transfer request', 'error');
    }
  };

  const handleViewTransfer = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setShowViewModal(true);
  };

  const handleApproveTransfer = async (transfer: Transfer) => {
    try {
      if (!transfer.id) return;

      const updatedTransfer = {
        ...transfer,
        status: 'approved' as const,
        approvedBy: user?.displayName || user?.email || 'Unknown',
        approvalDate: new Date().toISOString()
      };

      await FirebaseDatabaseService.updateTransfer(transfer.id, updatedTransfer);
      addNotification('Transfer approved successfully', 'success');
    } catch (error) {
      console.error('Error approving transfer:', error);
      addNotification('Failed to approve transfer', 'error');
    }
  };

  const handleRejectTransfer = async (transfer: Transfer) => {
    try {
      if (!transfer.id) return;

      const updatedTransfer = {
        ...transfer,
        status: 'rejected' as const,
        approvedBy: user?.displayName || user?.email || 'Unknown',
        approvalDate: new Date().toISOString()
      };

      await FirebaseDatabaseService.updateTransfer(transfer.id, updatedTransfer);
      addNotification('Transfer rejected successfully', 'success');
    } catch (error) {
      console.error('Error rejecting transfer:', error);
      addNotification('Failed to reject transfer', 'error');
    }
  };

  const handleStartTransit = async (transfer: Transfer) => {
    try {
      if (!transfer.id) return;

      const updatedTransfer = {
        ...transfer,
        status: 'in_transit' as const,
        updatedAt: new Date().toISOString()
      };

      await FirebaseDatabaseService.updateTransfer(transfer.id, updatedTransfer);
      addNotification('Transfer started in transit', 'success');
    } catch (error) {
      console.error('Error starting transit:', error);
      addNotification('Failed to start transit', 'error');
    }
  };

  const handleDeliverTransfer = async (transfer: Transfer) => {
    try {
      if (!transfer.id) return;

      const updatedTransfer = {
        ...transfer,
        status: 'delivered' as const,
        deliveryDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await FirebaseDatabaseService.updateTransfer(transfer.id, updatedTransfer);
      addNotification('Transfer delivered successfully', 'success');
    } catch (error) {
      console.error('Error delivering transfer:', error);
      addNotification('Failed to mark as delivered', 'error');
    }
  };

  const handleCancelTransfer = async (transfer: Transfer) => {
    try {
      if (!transfer.id) return;

      const updatedTransfer = {
        ...transfer,
        status: 'cancelled' as const,
        updatedAt: new Date().toISOString()
      };

      await FirebaseDatabaseService.updateTransfer(transfer.id, updatedTransfer);
      addNotification('Transfer cancelled successfully', 'success');
    } catch (error) {
      console.error('Error cancelling transfer:', error);
      addNotification('Failed to cancel transfer', 'error');
    }
  };

  const handleDeleteTransfer = (transfer: Transfer) => {
    setTransferToDelete(transfer);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteTransfer = async () => {
    try {
      if (!transferToDelete?.id) return;

      await FirebaseDatabaseService.deleteTransfer(transferToDelete.id);
      addNotification('Transfer deleted successfully', 'success');
      setTransferToDelete(null);
    } catch (error) {
      console.error('Error deleting transfer:', error);
      addNotification('Failed to delete transfer', 'error');
    }
  };

  // Generate transfer report using ReportService
  const handleGenerateTransferReport = async () => {
    try {
      addNotification('Generating transfer report...', 'info');
      
      // Create a temporary container for the report
      const reportContainer = document.createElement('div');
      reportContainer.className = 'p-6 bg-white';
      reportContainer.style.width = '210mm';
      reportContainer.style.minHeight = '297mm';
      
      // Calculate transfer statistics
      const totalTransfers = filteredTransfers.length;
      const pendingTransfers = filteredTransfers.filter(t => t.status === 'pending').length;
      const approvedTransfers = filteredTransfers.filter(t => t.status === 'approved').length;
      const inTransitTransfers = filteredTransfers.filter(t => t.status === 'in_transit').length;
      const deliveredTransfers = filteredTransfers.filter(t => t.status === 'delivered').length;
      const urgentTransfers = filteredTransfers.filter(t => t.priority === 'urgent').length;
      
      // Generate report HTML
      reportContainer.innerHTML = `
        <div class="text-center mb-6">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">TRANSFER REPORT</h1>
          <p class="text-lg text-gray-600">GOU STORES - Government of Uganda</p>
          <p class="text-sm text-gray-500">Decentralized Inventory Management System</p>
          <p class="text-gray-600 mt-2">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-blue-800">Total Transfers</h3>
            <p class="text-2xl font-bold text-blue-600">${totalTransfers}</p>
          </div>
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-yellow-800">Pending</h3>
            <p class="text-2xl font-bold text-yellow-600">${pendingTransfers}</p>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-green-800">Delivered</h3>
            <p class="text-2xl font-bold text-green-600">${deliveredTransfers}</p>
          </div>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-red-800">Urgent</h3>
            <p class="text-2xl font-bold text-red-600">${urgentTransfers}</p>
          </div>
        </div>
        
        <div class="mb-6">
          <h2 class="text-xl font-semibold mb-4">Transfer Details</h2>
          <table class="w-full border-collapse border border-gray-300">
            <thead>
              <tr class="bg-gray-100">
                <th class="border border-gray-300 px-4 py-2 text-left">Item</th>
                <th class="border border-gray-300 px-4 py-2 text-left">From</th>
                <th class="border border-gray-300 px-4 py-2 text-left">To</th>
                <th class="border border-gray-300 px-4 py-2 text-left">Quantity</th>
                <th class="border border-gray-300 px-4 py-2 text-left">Status</th>
                <th class="border border-gray-300 px-4 py-2 text-left">Priority</th>
                <th class="border border-gray-300 px-4 py-2 text-left">Request Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransfers.map(transfer => `
                <tr>
                  <td class="border border-gray-300 px-4 py-2">${transfer.itemName || 'Unknown'}</td>
                  <td class="border border-gray-300 px-4 py-2">${transfer.fromFacility || 'Unknown'}</td>
                  <td class="border border-gray-300 px-4 py-2">${transfer.toFacility || 'Unknown'}</td>
                  <td class="border border-gray-300 px-4 py-2">${transfer.quantity} ${transfer.unit}</td>
                  <td class="border border-gray-300 px-4 py-2">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${
                      transfer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      transfer.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      transfer.status === 'in_transit' ? 'bg-purple-100 text-purple-800' :
                      transfer.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }">
                      ${transfer.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td class="border border-gray-300 px-4 py-2">
                    <span class="px-2 px-4 py-2">
                      <span class="px-2 py-1 rounded-full text-xs font-medium ${
                        transfer.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        transfer.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        transfer.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }">
                        ${transfer.priority}
                      </span>
                    </td>
                    <td class="border border-gray-300 px-4 py-2">${new Date(transfer.requestDate).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="text-center text-sm text-gray-500">
            <p>Report generated by ${user?.displayName || user?.email || 'System'}</p>
            <p>Total transfers: ${totalTransfers}</p>
          </div>
        `;
        
        // Generate PDF using ReportService
        await ReportService.generatePDFFromHTML(reportContainer, 'Transfer_Report');
        
        addNotification('Transfer report generated successfully!', 'success');
      } catch (error) {
        console.error('Error generating transfer report:', error);
        addNotification('Failed to generate transfer report', 'error');
      }
    };

  const handleEditTransfer = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setFormData({
      itemId: transfer.itemId,
      quantity: transfer.quantity,
      unit: transfer.unit,
      fromFacilityId: transfer.fromFacilityId,
      toFacilityId: transfer.toFacilityId,
      reason: transfer.reason,
      priority: transfer.priority,
      notes: transfer.notes,
      status: transfer.status,
      approvedBy: transfer.approvedBy,
      approvalDate: transfer.approvalDate,
      deliveryDate: transfer.deliveryDate,
      trackingNumber: transfer.trackingNumber
    });
    setShowAddModal(true); // Use add modal for editing
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'in_transit':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-yellow-100 text-yellow-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'in_transit':
        return <Package className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <ArrowRightLeft className="w-4 h-4" />;
    }
  };

  const pendingTransfers = filteredTransfers.filter(t => t.status === 'pending').length;
  const approvedTransfers = filteredTransfers.filter(t => t.status === 'approved').length;
  const deliveredTransfers = filteredTransfers.filter(t => t.status === 'delivered').length;
  const urgentTransfers = filteredTransfers.filter(t => t.priority === 'urgent' && t.status === 'pending').length;

  // Add sample facilities to Firebase
  const addSampleFacilities = async () => {
    try {
      addNotification('Adding sample facilities to Firebase...', 'info');
      
      const sampleFacilities = [
        {
          name: 'Main Warehouse',
          type: 'warehouse' as const,
          region: 'Central',
          district: 'Kampala',
          address: 'Industrial Area, Kampala',
          contactPerson: 'John Mukasa',
          contactPhone: '+256700000001',
          status: 'active' as const
        },
        {
          name: 'Distribution Center',
          type: 'distribution_center' as const,
          region: 'Central',
          district: 'Kampala',
          address: 'Nakawa Division, Kampala',
          contactPerson: 'Mary Nambi',
          contactPhone: '+256700000002',
          status: 'active' as const
        },
        {
          name: 'Regional Office',
          type: 'office' as const,
          region: 'Central',
          district: 'Kampala',
          address: 'City Center, Kampala',
          contactPerson: 'Sarah Nakato',
          contactPhone: '+256700000003',
          status: 'active' as const
        },
        {
          name: 'Retail Store',
          type: 'retail_outlet' as const,
          region: 'Central',
          district: 'Kampala',
          address: 'Shopping Mall, Kampala',
          contactPerson: 'James Ssebunya',
          contactPhone: '+256700000004',
          status: 'active' as const
        }
      ];

      for (const facility of sampleFacilities) {
        await FirebaseDatabaseService.addFacility(facility);
      }
      
      addNotification('Sample facilities added successfully!', 'success');
    } catch (error) {
      console.error('Error adding sample facilities:', error);
      addNotification('Failed to add sample facilities', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-uganda-black">Transfer Management</h1>
          <p className="text-gray-600 mt-1">Manage inter-facility inventory transfers</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={handleGenerateTransferReport}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Generate Report
          </button>

          <button
            onClick={handleAddTransfer}
            className="inline-flex items-center px-4 py-2 bg-uganda-yellow text-uganda-black font-medium rounded-lg hover:bg-yellow-500 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Request Transfer
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-uganda-black">{pendingTransfers}</p>
              <p className="text-sm text-gray-600">Pending Requests</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-uganda-black">{approvedTransfers}</p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-uganda-black">{deliveredTransfers}</p>
              <p className="text-sm text-gray-600">Delivered</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-uganda-red rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-uganda-black">{urgentTransfers}</p>
              <p className="text-sm text-gray-600">Urgent Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transfers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {['all', 'pending', 'approved', 'rejected', 'in_transit', 'delivered', 'cancelled'].map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {['all', 'low', 'medium', 'high', 'urgent'].map(priority => (
                <option key={priority} value={priority}>
                  {priority.replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Info (Development Only)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="font-medium">Transfers:</span> {transfers?.length || 0}
            </div>
            <div>
              <span className="font-medium">Facilities:</span> {facilities?.length || 0}
            </div>
            <div>
              <span className="font-medium">Inventory Items:</span> {inventoryItems?.length || 0}
            </div>
            <div>
              <span className="font-medium">Enhanced:</span> {filteredTransfers.length}
            </div>
          </div>
          <div className="mt-2 text-xs text-yellow-700">
            <span className="font-medium">Loading:</span> {loading ? 'Yes' : 'No'}
          </div>
        </div>
      )}

      {/* Transfers Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-uganda-black">
            Transfer Requests ({filteredTransfers.length})
          </h2>
        </div>
        
        {filteredTransfers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item & Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status & Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
          {filteredTransfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    {/* Item & Details Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    {getStatusIcon(transfer.status)}
                  </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                        {transfer.itemName}
                    </div>
                          <div className="text-sm text-gray-500">
                            {transfer.quantity} {transfer.unit}
                        </div>
                          {transfer.trackingNumber && (
                            <div className="text-xs text-gray-400 font-mono">
                              {transfer.trackingNumber}
                        </div>
                          )}
                      </div>
                        </div>
                    </td>
                    
                    {/* Route Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{transfer.fromFacility}</div>
                        <div className="text-gray-500">→</div>
                        <div className="font-medium">{transfer.toFacility}</div>
                    </div>
                    </td>
                    
                    {/* Status & Priority Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transfer.status)}`}>
                          {transfer.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(transfer.priority)}`}>
                            {transfer.priority.replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                      </div>
                      </div>
                    </td>

                    {/* Request Info Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{transfer.requestedBy}</div>
                        <div className="text-gray-500">{transfer.requestDate}</div>
                    {transfer.approvedBy && (
                          <div className="text-xs text-gray-400">
                            Approved by {transfer.approvedBy}
                      </div>
                    )}
                  </div>
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewTransfer(transfer)}
                          className="p-1 text-gray-600 hover:text-uganda-black rounded hover:bg-gray-100"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                        {/* Pending transfers - can be approved or rejected */}
                  {transfer.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveTransfer(transfer)}
                              className="p-1 text-green-600 hover:text-green-700 rounded hover:bg-green-50"
                        title="Approve transfer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRejectTransfer(transfer)}
                              className="p-1 text-uganda-red hover:text-red-700 rounded hover:bg-red-50"
                        title="Reject transfer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                        
                        {/* Approved transfers - can start transit */}
                        {transfer.status === 'approved' && (
                          <button
                            onClick={() => handleStartTransit(transfer)}
                            className="p-1 text-blue-600 hover:text-blue-700 rounded hover:bg-blue-50"
                            title="Start transit"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* In transit transfers - can be delivered */}
                        {transfer.status === 'in_transit' && (
                          <button
                            onClick={() => handleDeliverTransfer(transfer)}
                            className="p-1 text-green-600 hover:text-green-700 rounded hover:bg-green-50"
                            title="Mark as delivered"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Pending and approved transfers - can be cancelled */}
                        {(transfer.status === 'pending' || transfer.status === 'approved') && (
                          <button
                            onClick={() => handleCancelTransfer(transfer)}
                            className="p-1 text-orange-600 hover:text-orange-700 rounded hover:bg-orange-50"
                            title="Cancel transfer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* All transfers except delivered - can be edited */}
                        {transfer.status !== 'delivered' && transfer.status !== 'cancelled' && (
                          <button
                            onClick={() => handleEditTransfer(transfer)}
                            className="p-1 text-uganda-blue hover:text-blue-700 rounded hover:bg-blue-50"
                            title="Edit transfer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* All transfers can be deleted */}
                        <button
                          onClick={() => handleDeleteTransfer(transfer)}
                          className="p-1 text-uganda-red hover:text-red-700 rounded hover:bg-red-50"
                          title="Delete transfer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                </div>
                    </td>
                  </tr>
          ))}
              </tbody>
            </table>
        </div>
        ) : (
          <div className="p-12 text-center">
            <ArrowRightLeft className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transfers found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or request a new transfer.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-uganda-black">
                {selectedTransfer ? 'Edit Transfer' : 'Request Transfer'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {selectedTransfer ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-semibold text-uganda-black">
                      {selectedTransfer.itemName}
                    </h4>
                    <div className="flex space-x-2">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedTransfer.status)}`}>
                        {selectedTransfer.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(selectedTransfer.priority)}`}>
                        {selectedTransfer.priority.replace(/\b\w/g, l => l.toUpperCase())} Priority
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-semibold text-uganda-black mb-3">Transfer Details</h5>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Quantity:</span>
                          <p className="text-lg font-bold text-uganda-black">
                            {selectedTransfer.quantity.toLocaleString()} {selectedTransfer.unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">From:</span>
                          <p className="text-gray-900">{selectedTransfer.fromFacility}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">To:</span>
                          <p className="text-gray-900">{selectedTransfer.toFacility}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Reason:</span>
                          <p className="text-gray-900">{selectedTransfer.reason}</p>
                        </div>
                        {selectedTransfer.trackingNumber && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Tracking Number:</span>
                            <p className="text-gray-900 font-mono">{selectedTransfer.trackingNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold text-uganda-black mb-3">Timeline</h5>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Requested:</span>
                          <p className="text-gray-900">{selectedTransfer.requestDate} by {selectedTransfer.requestedBy}</p>
                        </div>
                        {selectedTransfer.approvalDate && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              {selectedTransfer.status === 'approved' ? 'Approved:' : 'Processed:'}
                            </span>
                            <p className="text-gray-900">{selectedTransfer.approvalDate} by {selectedTransfer.approvedBy}</p>
                          </div>
                        )}
                        {selectedTransfer.deliveryDate && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Delivered:</span>
                            <p className="text-gray-900">{selectedTransfer.deliveryDate}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedTransfer.notes && (
                    <div>
                      <h5 className="font-semibold text-uganda-black mb-2">Notes</h5>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedTransfer.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-uganda-black">Request Transfer</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="itemId" className="block text-sm font-medium text-gray-700">Item</label>
                      <select
                        id="itemId"
                        value={formData.itemId}
                        onChange={(e) => setFormData(prev => ({ ...prev, itemId: e.target.value }))}
                        className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 focus:outline-none focus:ring-uganda-yellow focus:border-uganda-yellow sm:text-sm"
                      >
                        <option value="">Select an item</option>
                        {inventoryItems?.map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        id="quantity"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                        className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 focus:outline-none focus:ring-uganda-yellow focus:border-uganda-yellow sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
                      <input
                        type="text"
                        id="unit"
                        value={formData.unit}
                        onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                        className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 focus:outline-none focus:ring-uganda-yellow focus:border-uganda-yellow sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="fromFacilityId" className="block text-sm font-medium text-gray-700">From Facility</label>
                      <select
                        id="fromFacilityId"
                        value={formData.fromFacilityId}
                        onChange={(e) => setFormData(prev => ({ ...prev, fromFacilityId: e.target.value }))}
                        className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 focus:outline-none focus:ring-uganda-yellow focus:border-uganda-yellow sm:text-sm"
                      >
                        <option value="">Select a facility</option>
                        {facilities?.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="toFacilityId" className="block text-sm font-medium text-gray-700">To Facility</label>
                      <select
                        id="toFacilityId"
                        value={formData.toFacilityId}
                        onChange={(e) => setFormData(prev => ({ ...prev, toFacilityId: e.target.value }))}
                        className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 focus:outline-none focus:ring-uganda-yellow focus:border-uganda-yellow sm:text-sm"
                      >
                        <option value="">Select a facility</option>
                        {facilities?.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason</label>
                      <textarea
                        id="reason"
                        value={formData.reason}
                        onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                        className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 focus:outline-none focus:ring-uganda-yellow focus:border-uganda-yellow sm:text-sm"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                      <select
                        id="priority"
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' }))}
                        className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 focus:outline-none focus:ring-uganda-yellow focus:border-uganda-yellow sm:text-sm"
                      >
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 focus:outline-none focus:ring-uganda-yellow focus:border-uganda-yellow sm:text-sm"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveTransfer}
                      className="px-4 py-2 bg-uganda-yellow text-uganda-black font-medium rounded-lg hover:bg-yellow-500 transition-colors"
                    >
                      {selectedTransfer ? 'Update Transfer' : 'Save Transfer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Transfer Modal */}
      {showViewModal && selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-uganda-black">
                Transfer Details
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-uganda-black mb-3">Transfer Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Item:</span>
                        <span className="text-gray-900">{selectedTransfer.itemName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Quantity:</span>
                        <span className="text-gray-900">{selectedTransfer.quantity} {selectedTransfer.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Priority:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTransfer.priority)}`}>
                          {selectedTransfer.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransfer.status)}`}>
                          {selectedTransfer.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-uganda-black mb-3">Route</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">From:</span>
                        <span className="text-gray-900">{selectedTransfer.fromFacility}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">To:</span>
                        <span className="text-gray-900">{selectedTransfer.toFacility}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Additional Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-uganda-black mb-3">Request Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Requested By:</span>
                        <span className="text-gray-900">{selectedTransfer.requestedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Request Date:</span>
                        <span className="text-gray-900">{selectedTransfer.requestDate}</span>
                      </div>
                      {selectedTransfer.approvedBy && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Approved By:</span>
                          <span className="text-gray-900">{selectedTransfer.approvedBy}</span>
                        </div>
                      )}
                      {selectedTransfer.approvalDate && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Approval Date:</span>
                          <span className="text-gray-900">{selectedTransfer.approvalDate}</span>
                        </div>
                      )}
                      {selectedTransfer.deliveryDate && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Delivery Date:</span>
                          <span className="text-gray-900">{selectedTransfer.deliveryDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedTransfer.trackingNumber && (
                    <div>
                      <h4 className="text-lg font-semibold text-uganda-black mb-3">Tracking</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="font-mono text-lg">{selectedTransfer.trackingNumber}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Reason and Notes */}
              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-uganda-black mb-2">Reason</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedTransfer.reason}</p>
                </div>
                
                {selectedTransfer.notes && (
                  <div>
                    <h4 className="text-lg font-semibold text-uganda-black mb-2">Notes</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg italic">{selectedTransfer.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDeleteTransfer}
        title="Delete Transfer"
        message={`Are you sure you want to delete the transfer for "${transferToDelete?.itemName}"? This action cannot be undone and will also remove associated transaction records.`}
        confirmText="Delete Transfer"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}