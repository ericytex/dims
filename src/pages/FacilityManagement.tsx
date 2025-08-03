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
  type: 'warehouse' | 'distribution_center' | 'retail_store' | 'manufacturing_plant' | 'office';
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
      name: 'Main Warehouse',
      type: 'warehouse',
      region: 'Central',
      district: 'Kampala',
      location: 'Industrial Area, Kampala',
      gpsCoordinates: { latitude: 0.3354, longitude: 32.5851 },
      manager: 'John Mukasa',
      phone: '+256700000001',
      email: 'manager@ims.com',
      status: 'active',
      totalItems: 1247,
      users: 25
    },
    {
      id: '2',
      name: 'Distribution Center',
      type: 'distribution_center',
      region: 'Central',
      district: 'Kampala',
      location: 'Nakawa Division, Kampala',
      gpsCoordinates: { latitude: 0.3676, longitude: 32.5851 },
      manager: 'Mary Nambi',
      phone: '+256700000002',
      email: 'manager@ims.com',
      status: 'active',
      totalItems: 432,
      users: 8
    },
    {
      id: '3',
      name: 'Regional Warehouse',
      type: 'warehouse',
      region: 'Central',
      district: 'Kampala',
      location: 'Makindye Division, Kampala',
      gpsCoordinates: { latitude: 0.2743, longitude: 32.5851 },
      manager: 'Sarah Nakato',
      phone: '+256700000003',
      email: 'manager@ims.com',
      status: 'active',
      totalItems: 892,
      users: 18
    },
    {
      id: '4',
      name: 'Retail Store',
      type: 'retail_store',
      region: 'Central',
      district: 'Kampala',
      location: 'City Center, Kampala',
      manager: 'James Ssebunya',
      phone: '+256700000004',
      email: 'manager@ims.com',
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
  const [formData, setFormData] = useState({
    name: '',
    type: 'warehouse' as const,
    region: 'Central',
    district: '',
    location: '',
    manager: '',
    phone: '',
    email: '',
    status: 'active' as const
  });
  const { addNotification } = useNotification();

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
    setModalType('add');
    setSelectedFacility(null);
    setFormData({
      name: '',
      type: 'warehouse',
      region: 'Central',
      district: '',
      location: '',
      manager: '',
      phone: '',
      email: '',
      status: 'active'
    });
    setShowModal(true);
  };

  const handleEditFacility = (facility: Facility) => {
    setModalType('edit');
    setSelectedFacility(facility);
    setFormData({
      name: facility.name,
      type: facility.type,
      region: facility.region,
      district: facility.district,
      location: facility.location,
      manager: facility.manager,
      phone: facility.phone,
      email: facility.email,
      status: facility.status
    });
    setShowModal(true);
  };

  const handleViewFacility = (facility: Facility) => {
    setModalType('view');
    setSelectedFacility(facility);
    setShowModal(true);
  };

  const handleSaveFacility = () => {
    if (!formData.name || !formData.district || !formData.location || !formData.manager || !formData.phone || !formData.email) {
      addNotification('Please fill in all required fields', 'error');
      return;
    }

    if (modalType === 'add') {
      const newFacility: Facility = {
        id: Date.now().toString(),
        ...formData,
        totalItems: 0,
        users: 0
      };
      setFacilities([...facilities, newFacility]);
      addNotification('Facility added successfully', 'success');
    } else if (modalType === 'edit' && selectedFacility) {
      setFacilities(facilities.map(f => 
        f.id === selectedFacility.id ? { ...f, ...formData } : f
      ));
      addNotification('Facility updated successfully', 'success');
    }

    setShowModal(false);
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
          onClick={handleAddFacility}
          className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Facility</span>
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
        {filteredFacilities.map((facility) => (
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
                <span>{facility.location}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Manager:</span>
                <span className="font-medium">{facility.manager}</span>
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
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{facility.totalItems}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Users:</span>
                <span className="font-medium">{facility.users}</span>
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
              <h2 className="text-xl font-semibold text-gray-900">
                {modalType === 'add' ? 'Add New Facility' : 
                 modalType === 'edit' ? 'Edit Facility' : 'Facility Details'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {modalType === 'view' && selectedFacility ? (
                <div className="space-y-4">
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
                        Location
                      </label>
                          <p className="text-gray-900">{selectedFacility.location}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Manager
                      </label>
                          <p className="text-gray-900">{selectedFacility.manager}</p>
                        </div>
                    
                        <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                          <p className="text-gray-900">{selectedFacility.phone}</p>
                        </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                          <p className="text-gray-900">{selectedFacility.email}</p>
                        </div>
                    
                    <div>
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
                        Total Items
                      </label>
                      <p className="text-gray-900">{selectedFacility.totalItems}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
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
                        Location *
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                        placeholder="Enter location"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Manager *
                      </label>
                      <input
                        type="text"
                        value={formData.manager}
                        onChange={(e) => setFormData({...formData, manager: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                        placeholder="Enter manager name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                        placeholder="Enter phone number"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                        placeholder="Enter email address"
                      />
                    </div>
                    
                    <div>
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
              )}
                  </div>
                  
            {modalType !== 'view' && (
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                    <button
                      onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveFacility}
                  className="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 transition-colors"
                    >
                      {modalType === 'add' ? 'Add Facility' : 'Update Facility'}
                    </button>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}