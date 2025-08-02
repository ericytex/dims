import React, { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
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
  X
} from 'lucide-react';

interface Transfer {
  id: string;
  itemName: string;
  itemId: string;
  quantity: number;
  unit: string;
  fromFacility: string;
  fromFacilityId: string;
  toFacility: string;
  toFacilityId: string;
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
}

export default function TransferManagement() {
  const [transfers, setTransfers] = useState<Transfer[]>([
    {
      id: '1',
      itemName: 'Laptop Computers',
      itemId: '1',
      quantity: 25,
      unit: 'units',
      fromFacility: 'Main Warehouse',
      fromFacilityId: '1',
      toFacility: 'Regional Office',
      toFacilityId: '2',
      requestedBy: 'John Mukasa',
      requestDate: '2025-01-09',
      status: 'pending',
      reason: 'New office setup',
      priority: 'high',
      notes: 'Urgent request for new branch opening',
      trackingNumber: 'TRK-2025-001'
    },
    {
      id: '2',
      itemName: 'Office Chairs',
      itemId: '2',
      quantity: 50,
      unit: 'units',
      fromFacility: 'Distribution Center',
      fromFacilityId: '3',
      toFacility: 'Retail Store',
      toFacilityId: '4',
      requestedBy: 'Sarah Nakato',
      requestDate: '2025-01-08',
      status: 'approved',
      approvedBy: 'James Ssebunya',
      approvalDate: '2025-01-09',
      reason: 'Store expansion',
      priority: 'medium',
      notes: 'Regular inventory transfer for new store section',
      trackingNumber: 'TRK-2025-002'
    },
    {
      id: '3',
      itemName: 'Printer Cartridges',
      itemId: '4',
      quantity: 100,
      unit: 'units',
      fromFacility: 'Main Warehouse',
      fromFacilityId: '1',
      toFacility: 'Manufacturing Plant',
      toFacilityId: '3',
      requestedBy: 'David Okello',
      requestDate: '2025-01-08',
      status: 'delivered',
      approvedBy: 'Mary Nambi',
      approvalDate: '2025-01-08',
      deliveryDate: '2025-01-09',
      reason: 'Production requirement',
      priority: 'urgent',
      notes: 'Critical for production line operations',
      trackingNumber: 'TRK-2025-003'
    },
    {
      id: '4',
      itemName: 'Network Cables',
      itemId: '5',
      quantity: 200,
      unit: 'meters',
      fromFacility: 'Regional Office',
      fromFacilityId: '2',
      toFacility: 'Retail Store',
      toFacilityId: '4',
      requestedBy: 'Sarah Nakato',
      requestDate: '2025-01-07',
      status: 'rejected',
      approvedBy: 'John Mukasa',
      approvalDate: '2025-01-08',
      reason: 'IT infrastructure setup',
      priority: 'low',
      notes: 'Rejected - insufficient stock at source facility',
      trackingNumber: 'TRK-2025-004'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'view'>('add');
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const { addNotification } = useNotification();

  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const priorities = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = transfer.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.fromFacility.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.toFacility.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || transfer.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || transfer.priority === selectedPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleAddTransfer = () => {
    setModalType('add');
    setSelectedTransfer(null);
    setShowModal(true);
  };

  const handleViewTransfer = (transfer: Transfer) => {
    setModalType('view');
    setSelectedTransfer(transfer);
    setShowModal(true);
  };

  const handleApproveTransfer = (transfer: Transfer) => {
    setTransfers(transfers.map(t => 
      t.id === transfer.id 
        ? { ...t, status: 'approved', approvedBy: 'Current User', approvalDate: '2025-01-09' }
        : t
    ));
    addNotification(`Transfer request for ${transfer.itemName} has been approved.`);
  };

  const handleRejectTransfer = (transfer: Transfer) => {
    setTransfers(transfers.map(t => 
      t.id === transfer.id 
        ? { ...t, status: 'rejected', approvedBy: 'Current User', approvalDate: '2025-01-09' }
        : t
    ));
    addNotification(`Transfer request for ${transfer.itemName} has been rejected.`, 'warning');
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

  const pendingTransfers = transfers.filter(t => t.status === 'pending').length;
  const approvedTransfers = transfers.filter(t => t.status === 'approved').length;
  const deliveredTransfers = transfers.filter(t => t.status === 'delivered').length;
  const urgentTransfers = transfers.filter(t => t.priority === 'urgent' && t.status === 'pending').length;

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
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
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
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-uganda-black">
                {modalType === 'add' ? 'Request Transfer' : 'Transfer Details'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {modalType === 'view' && selectedTransfer ? (
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
                  <p className="text-gray-600">
                    Transfer request functionality will be available in the next update.
                    This will allow facilities to request inventory transfers from other locations.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}