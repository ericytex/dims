import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useFirebaseDatabase } from '../hooks/useFirebaseDatabase';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { FirebaseDatabaseService } from '../services/firebaseDatabase';
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
  Map,
  RefreshCw,
  Database
} from 'lucide-react';

interface Facility {
  id?: string;
  name: string;
  type: 'warehouse' | 'distribution_center' | 'retail_store' | 'manufacturing_plant' | 'office';
  region: string;
  district: string;
  address?: string;
  gpsCoordinates?: string;
  contactPerson?: string;
  contactPhone?: string;
  status: 'active' | 'inactive';
  createdAt?: any;
  updatedAt?: any;
}

export default function FacilityManagement() {
  const { addNotification } = useNotification();
  const { user } = useFirebaseAuth();
  const { facilities, loading } = useFirebaseDatabase();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [formData, setFormData] = useState<Partial<Facility>>({
    name: '',
    type: 'warehouse',
    region: '',
    district: '',
    address: '',
    contactPerson: '',
    contactPhone: '',
    status: 'active'
  });

  // Sample facilities data to populate Firebase
  const sampleFacilities: Omit<Facility, 'id'>[] = [
    {
      name: 'Main Warehouse',
      type: 'warehouse',
      region: 'Central',
      district: 'Kampala',
      address: 'Industrial Area, Kampala',
      gpsCoordinates: '0.3354,32.5851',
      contactPerson: 'John Mukasa',
      contactPhone: '+256700000001',
      status: 'active'
    },
    {
      name: 'Distribution Center',
      type: 'distribution_center',
      region: 'Central',
      district: 'Kampala',
      address: 'Nakawa Division, Kampala',
      gpsCoordinates: '0.3676,32.5851',
      contactPerson: 'Mary Nambi',
      contactPhone: '+256700000002',
      status: 'active'
    },
    {
      name: 'Regional Warehouse',
      type: 'warehouse',
      region: 'Central',
      district: 'Kampala',
      address: 'Makindye Division, Kampala',
      gpsCoordinates: '0.2743,32.5851',
      contactPerson: 'Sarah Nakato',
      contactPhone: '+256700000003',
      status: 'active'
    },
    {
      name: 'Retail Store',
      type: 'retail_store',
      region: 'Central',
      district: 'Kampala',
      address: 'City Center, Kampala',
      contactPerson: 'James Ssebunya',
      contactPhone: '+256700000004',
      status: 'active'
    },
    {
      name: 'Manufacturing Plant',
      type: 'manufacturing_plant',
      region: 'Eastern',
      district: 'Jinja',
      address: 'Industrial Zone, Jinja',
      gpsCoordinates: '0.4471,33.2022',
      contactPerson: 'David Okello',
      contactPhone: '+256700000005',
      status: 'active'
    }
  ];

  // Add sample facilities to Firebase
  const addSampleFacilities = async () => {
    try {
      addNotification('Adding sample facilities to Firebase...', 'info');
      
      for (const facility of sampleFacilities) {
        await FirebaseDatabaseService.addFacility(facility);
      }
      
      addNotification('Sample facilities added successfully!', 'success');
    } catch (error) {
      console.error('Error adding sample facilities:', error);
      addNotification('Failed to add sample facilities', 'error');
    }
  };

  const facilityTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'distribution_center', label: 'Distribution Center' },
    { value: 'retail_store', label: 'Retail Store' },
    { value: 'manufacturing_plant', label: 'Manufacturing Plant' },
    { value: 'office', label: 'Office' }
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
    setFormData({
      name: '',
      type: 'warehouse',
      region: '',
      district: '',
      address: '',
      contactPerson: '',
      contactPhone: '',
      status: 'active'
    });
    setShowAddModal(true);
  };

  const handleEditFacility = (facility: Facility) => {
    setSelectedFacility(facility);
    setFormData(facility);
    setShowEditModal(true);
  };

  const handleViewFacility = (facility: Facility) => {
    setSelectedFacility(facility);
    setShowViewModal(true);
  };

  const handleSaveFacility = async () => {
    try {
      if (!formData.name || !formData.region || !formData.district) {
        addNotification('Please fill in all required fields', 'error');
        return;
      }

      if (selectedFacility?.id) {
        // Update existing facility
        await FirebaseDatabaseService.updateFacility(selectedFacility.id, formData);
        addNotification('Facility updated successfully', 'success');
        setShowEditModal(false);
      } else {
        // Add new facility
        await FirebaseDatabaseService.addFacility(formData);
        addNotification('Facility added successfully', 'success');
        setShowAddModal(false);
      }
      
      setFormData({});
      setSelectedFacility(null);
    } catch (error) {
      console.error('Error saving facility:', error);
      addNotification('Failed to save facility', 'error');
    }
  };

  const handleDeleteFacility = async (facility: Facility) => {
    try {
      if (!facility.id) return;
      
      await FirebaseDatabaseService.deleteFacility(facility.id);
      addNotification('Facility deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting facility:', error);
      addNotification('Failed to delete facility', 'error');
    }
  };

  const getFacilityTypeIcon = (type: string) => {
    switch (type) {
      case 'warehouse':
        return <Building className="w-5 h-5 text-blue-500" />;
      case 'distribution_center':
        return <Package className="w-5 h-5 text-green-500" />;
      case 'retail_store':
        return <Building className="w-5 h-5 text-purple-500" />;
      case 'manufacturing_plant':
        return <Building className="w-5 h-5 text-orange-500" />;
      case 'office':
        return <Building className="w-5 h-5 text-gray-500" />;
      default:
        return <Building className="w-5 h-5 text-gray-500" />;
    }
  };

  const getFacilityTypeLabel = (type: string) => {
    switch (type) {
      case 'warehouse':
        return 'Warehouse';
      case 'distribution_center':
        return 'Distribution Center';
      case 'retail_store':
        return 'Retail Store';
      case 'manufacturing_plant':
        return 'Manufacturing Plant';
      case 'office':
        return 'Office';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facility Management</h1>
          <p className="text-gray-600 mt-1">Manage facilities and their information</p>
        </div>
        <button
          onClick={addSampleFacilities}
          className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex items-center space-x-2"
        >
          <Database className="w-4 h-4" />
          <span>Add Sample Facilities</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                placeholder="Search facilities..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {facilityTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              {regions.map(region => (
                <option key={region.value} value={region.value}>{region.label}</option>
              ))}
            </select>
      </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
                setSelectedRegion('all');
              }}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-10">
            <p>Loading facilities...</p>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <p>No facilities found matching your criteria.</p>
          </div>
        ) : (
          filteredFacilities.map((facility) => (
            <div key={facility.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getFacilityTypeIcon(facility.type)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{facility.name}</h3>
                    <p className="text-sm text-gray-500">{getFacilityTypeLabel(facility.type)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewFacility(facility)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditFacility(facility)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{facility.address || 'N/A'}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Contact:</span>
                  <span className="font-medium">{facility.contactPerson || 'N/A'}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{facility.contactPhone || 'N/A'}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    facility.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {facility.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">GPS:</span>
                  <span className="font-medium">{facility.gpsCoordinates || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Facility</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter facility name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                  >
                    <option value="warehouse">Warehouse</option>
                    <option value="distribution_center">Distribution Center</option>
                    <option value="retail_store">Retail Store</option>
                    <option value="manufacturing_plant">Manufacturing Plant</option>
                    <option value="office">Office</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region *
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                  >
                    <option value="Central">Central</option>
                    <option value="Eastern">Eastern</option>
                    <option value="Northern">Northern</option>
                    <option value="Western">Western</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter district"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter contact person"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFacility}
                className="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Add Facility
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedFacility && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Facility</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter facility name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                  >
                    <option value="warehouse">Warehouse</option>
                    <option value="distribution_center">Distribution Center</option>
                    <option value="retail_store">Retail Store</option>
                    <option value="manufacturing_plant">Manufacturing Plant</option>
                    <option value="office">Office</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region *
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                  >
                    <option value="Central">Central</option>
                    <option value="Eastern">Eastern</option>
                    <option value="Northern">Northern</option>
                    <option value="Western">Western</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter district"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter contact person"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFacility}
                className="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Update Facility
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedFacility && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Facility Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facility Name
                  </label>
                  <p className="text-gray-900">{selectedFacility.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <p className="text-gray-900">{getFacilityTypeLabel(selectedFacility.type)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region
                  </label>
                  <p className="text-gray-900">{selectedFacility.region}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <p className="text-gray-900">{selectedFacility.district}</p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <p className="text-gray-900">{selectedFacility.address || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <p className="text-gray-900">{selectedFacility.contactPerson || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <p className="text-gray-900">{selectedFacility.contactPhone || 'N/A'}</p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedFacility.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedFacility.status}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GPS Coordinates
                  </label>
                  <p className="text-gray-900">{selectedFacility.gpsCoordinates || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}