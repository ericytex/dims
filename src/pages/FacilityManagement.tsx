import React, { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import {
  Plus,
  Search,
  Edit,
  Eye,
  MapPin,
  Building,
  Users,
  Package,
  X,
  Map
} from 'lucide-react';

interface Facility {
  id: string;
  name: string;
  type: 'hospital' | 'health_center_iv' | 'health_center_iii' | 'health_center_ii' | 'clinic';
  region: string;
  district: string;
  location: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  manager: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  totalItems: number;
  users: number;
}

export default function FacilityManagement() {
  const [facilities, setFacilities] = useState<Facility[]>([
    {
      id: '1',
      name: 'Mulago National Referral Hospital',
      type: 'hospital',
      region: 'Central',
      district: 'Kampala',
      location: 'Kawempe Division, Kampala',
      gpsCoordinates: { latitude: 0.3354, longitude: 32.5851 },
      manager: 'Dr. John Mukasa',
      phone: '+256700000001',
      email: 'manager@mulago.go.ug',
      status: 'active',
      totalItems: 1247,
      users: 25
    },
    {
      id: '2',
      name: 'Kawempe Health Center IV',
      type: 'health_center_iv',
      region: 'Central',
      district: 'Kampala',
      location: 'Kawempe Division, Kampala',
      gpsCoordinates: { latitude: 0.3676, longitude: 32.5851 },
      manager: 'Mary Nambi',
      phone: '+256700000002',
      email: 'manager@kawempe.go.ug',
      status: 'active',
      totalItems: 432,
      users: 8
    },
    {
      id: '3',
      name: 'Kiruddu General Hospital',
      type: 'hospital',
      region: 'Central',
      district: 'Kampala',
      location: 'Makindye Division, Kampala',
      gpsCoordinates: { latitude: 0.2743, longitude: 32.5851 },
      manager: 'Dr. Sarah Nakato',
      phone: '+256700000003',
      email: 'manager@kiruddu.go.ug',
      status: 'active',
      totalItems: 892,
      users: 18
    },
    {
      id: '4',
      name: 'Nsambya Health Center III',
      type: 'health_center_iii',
      region: 'Central',
      district: 'Kampala',
      location: 'Makindye Division, Kampala',
      manager: 'James Ssebunya',
      phone: '+256700000004',
      email: 'manager@nsambya.go.ug',
      status: 'inactive',
      totalItems: 256,
      users: 5
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const { addNotification } = useNotification();

  const facilityTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'health_center_iv', label: 'Health Center IV' },
    { value: 'health_center_iii', label: 'Health Center III' },
    { value: 'health_center_ii', label: 'Health Center II' },
    { value: 'clinic', label: 'Clinic' }
  ];

  const regions = [
    { value: 'all', label: 'All Regions' },
    { value: 'Central', label: 'Central' },
    { value: 'Eastern', label: 'Eastern' },
    { value: 'Northern', label: 'Northern' },
    { value: 'Western', label: 'Western' }
  ];

  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facility.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || facility.type === selectedType;
    const matchesRegion = selectedRegion === 'all' || facility.region === selectedRegion;
    return matchesSearch && matchesType && matchesRegion;
  });

  const handleAddFacility = () => {
    setModalType('add');
    setSelectedFacility(null);
    setShowModal(true);
  };

  const handleEditFacility = (facility: Facility) => {
    setModalType('edit');
    setSelectedFacility(facility);
    setShowModal(true);
  };

  const handleViewFacility = (facility: Facility) => {
    setModalType('view');
    setSelectedFacility(facility);
    setShowModal(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hospital':
        return 'bg-purple-100 text-purple-800';
      case 'health_center_iv':
        return 'bg-blue-100 text-blue-800';
      case 'health_center_iii':
        return 'bg-green-100 text-green-800';
      case 'health_center_ii':
        return 'bg-yellow-100 text-yellow-800';
      case 'clinic':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const formatFacilityType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-uganda-black">Facility Management</h1>
          <p className="text-gray-600 mt-1">Manage healthcare facilities and their information</p>
        </div>
        <button
          onClick={handleAddFacility}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-uganda-yellow text-uganda-black font-medium rounded-lg hover:bg-yellow-500 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Facility
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search facilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {facilityTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {regions.map(region => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-uganda-black">{facilities.length}</p>
              <p className="text-sm text-gray-600">Total Facilities</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-uganda-black">
                {facilities.reduce((sum, f) => sum + f.totalItems, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Items</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-uganda-yellow rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-uganda-black" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-uganda-black">
                {facilities.reduce((sum, f) => sum + f.users, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-uganda-red rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-uganda-black">
                {facilities.filter(f => f.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600">Active Facilities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFacilities.map((facility) => (
          <div key={facility.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-uganda-black mb-2">
                    {facility.name}
                  </h3>
                  <div className="space-y-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(facility.type)}`}>
                      {formatFacilityType(facility.type)}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getStatusColor(facility.status)}`}>
                      {facility.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{facility.district}, {facility.region}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>Manager: {facility.manager}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-uganda-black">{facility.totalItems}</p>
                  <p className="text-xs text-gray-500">Items</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-uganda-black">{facility.users}</p>
                  <p className="text-xs text-gray-500">Users</p>
                </div>
                <div className="text-center">
                  {facility.gpsCoordinates && (
                    <>
                      <Map className="w-6 h-6 mx-auto text-green-500" />
                      <p className="text-xs text-gray-500">GPS</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewFacility(facility)}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  View
                </button>
                <button
                  onClick={() => handleEditFacility(facility)}
                  className="flex-1 bg-uganda-yellow text-uganda-black px-3 py-2 rounded-lg hover:bg-yellow-500 transition-colors text-sm font-medium"
                >
                  <Edit className="w-4 h-4 inline mr-1" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-uganda-black">
                {modalType === 'add' ? 'Add New Facility' : 
                 modalType === 'edit' ? 'Edit Facility' : 'Facility Details'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {modalType === 'view' && selectedFacility ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-uganda-black mb-4">
                        Basic Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Name</label>
                          <p className="text-gray-900">{selectedFacility.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Type</label>
                          <p className="text-gray-900">{formatFacilityType(selectedFacility.type)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedFacility.status)}`}>
                            {selectedFacility.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-uganda-black mb-4">
                        Location
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Region</label>
                          <p className="text-gray-900">{selectedFacility.region}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">District</label>
                          <p className="text-gray-900">{selectedFacility.district}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Address</label>
                          <p className="text-gray-900">{selectedFacility.location}</p>
                        </div>
                        {selectedFacility.gpsCoordinates && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">GPS Coordinates</label>
                            <p className="text-gray-900">
                              {selectedFacility.gpsCoordinates.latitude.toFixed(6)}, {selectedFacility.gpsCoordinates.longitude.toFixed(6)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-uganda-black mb-4">
                        Management
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Manager</label>
                          <p className="text-gray-900">{selectedFacility.manager}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Phone</label>
                          <p className="text-gray-900">{selectedFacility.phone}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Email</label>
                          <p className="text-gray-900">{selectedFacility.email}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-uganda-black mb-4">
                        Statistics
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Total Items</label>
                          <p className="text-2xl font-bold text-uganda-black">{selectedFacility.totalItems}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Users</label>
                          <p className="text-2xl font-bold text-uganda-black">{selectedFacility.users}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Facility form would be implemented here
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}