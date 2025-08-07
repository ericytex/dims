import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useOffline } from '../contexts/OfflineContext';
import { useFirebaseDatabase } from '../hooks/useFirebaseDatabase';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { FirebaseDatabaseService } from '../services/firebaseDatabase';
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
      if (transfers && facilities && inventoryItems) {
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
        
        setFilteredTransfers(enhanced);
      }
    };

    enhanceTransfers();
  }, [transfers, facilities, inventoryItems]);

  // Filter transfers based on search and filters
  useEffect(() => {
    let filtered = filteredTransfers;

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

    setFilteredTransfers(filtered);
  }, [searchTerm, statusFilter, priorityFilter, transfers, facilities, inventoryItems]);

  const handleAddTransfer = () => {
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
    setShowAddModal(true);
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
        status: 'in_transit' as const
      };

      await FirebaseDatabaseService.updateTransfer(transfer.id, updatedTransfer);
      addNotification('Transfer marked as in transit', 'success');
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
        deliveryDate: new Date().toISOString()
      };

      await FirebaseDatabaseService.updateTransfer(transfer.id, updatedTransfer);
      addNotification('Transfer marked as delivered', 'success');
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
        status: 'cancelled' as const
      };

      await FirebaseDatabaseService.updateTransfer(transfer.id, updatedTransfer);
      addNotification('Transfer cancelled successfully', 'success');
    } catch (error) {
      console.error('Error cancelling transfer:', error);
      addNotification('Failed to cancel transfer', 'error');
    }
  };

  const handleDeleteTransfer = async (transfer: Transfer) => {
    try {
      if (!transfer.id) return;

      await FirebaseDatabaseService.deleteTransfer(transfer.id);
      addNotification('Transfer deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting transfer:', error);
      addNotification('Failed to delete transfer', 'error');
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
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
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
        <button
          onClick={handleAddTransfer}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-uganda-yellow text-uganda-black font-medium rounded-lg hover:bg-yellow-500 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Request Transfer
        </button>
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

      {/* Transfers List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-uganda-black">
            Transfer Requests ({filteredTransfers.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredTransfers.map((transfer) => (
            <div key={transfer.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getStatusIcon(transfer.status)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-uganda-black">
                        {transfer.itemName}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transfer.status)}`}>
                        {transfer.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(transfer.priority)}`}>
                        {transfer.priority.replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Package className="w-4 h-4 mr-2" />
                          <span className="font-medium">{transfer.quantity.toLocaleString()} {transfer.unit}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <ArrowRightLeft className="w-4 h-4 mr-2" />
                          <span>{transfer.fromFacility} → {transfer.toFacility}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="w-4 h-4 mr-2" />
                          <span>Requested by {transfer.requestedBy}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{transfer.requestDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Reason:</span> {transfer.reason}
                    </div>

                    {transfer.trackingNumber && (
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Tracking:</span> {transfer.trackingNumber}
                      </div>
                    )}

                    {transfer.notes && (
                      <div className="text-sm text-gray-600 mt-2 italic">
                        {transfer.notes}
                      </div>
                    )}

                    {transfer.approvedBy && (
                      <div className="text-sm text-gray-500 mt-2">
                        {transfer.status === 'approved' ? 'Approved' : 'Processed'} by {transfer.approvedBy} on {transfer.approvalDate}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleViewTransfer(transfer)}
                    className="p-2 text-gray-600 hover:text-uganda-black rounded-lg hover:bg-gray-100"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  {transfer.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveTransfer(transfer)}
                        className="p-2 text-green-600 hover:text-green-700 rounded-lg hover:bg-green-50"
                        title="Approve transfer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRejectTransfer(transfer)}
                        className="p-2 text-uganda-red hover:text-red-700 rounded-lg hover:bg-red-50"
                        title="Reject transfer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {transfer.status !== 'pending' && (
                    <button
                      onClick={() => handleEditTransfer(transfer)}
                      className="p-2 text-uganda-blue hover:text-blue-700 rounded-lg hover:bg-blue-50"
                      title="Edit transfer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteTransfer(transfer)}
                    className="p-2 text-uganda-red hover:text-red-700 rounded-lg hover:bg-red-50"
                    title="Delete transfer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTransfers.length === 0 && (
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
    </div>
  );
}