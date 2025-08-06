import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { useNotification } from '../contexts/NotificationContext';
import { FirebaseDatabaseService } from '../services/firebaseDatabase';
import { 
  Shield, 
  Users, 
  Building, 
  Package, 
  FileText, 
  ArrowLeftRight, 
  BarChart3, 
  Database,
  Check,
  X,
  Eye,
  Plus,
  Edit,
  Trash2,
  Download,
  Settings,
  Key,
  Lock,
  UserPlus,
  UserCheck,
  UserX,
  User,
  Mail,
  Phone,
  Search,
  Grid3X3,
  Table
} from 'lucide-react';
import RolePermissionsDisplay from '../components/RolePermissionsDisplay';

interface Role {
  value: string;
  label: string;
  description: string;
  permissions: any;
  totalPermissions: number;
  allowedAreas: number;
  userCount: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  facilityName: string;
  status: 'active' | 'inactive';
  region: string;
  district: string;
  createdAt: any;
  updatedAt: any;
}

export default function RolesManagement() {
  const { user: currentUser } = useFirebaseAuth();
  const { addNotification } = useNotification();
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'users'>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState<'cards' | 'table'>('cards');

  // Comprehensive role permissions mapping
  const rolePermissions = {
    admin: {
      pages: ['dashboard', 'users', 'facilities', 'inventory', 'transactions', 'transfers', 'reports', 'database-test'],
      actions: ['create', 'read', 'update', 'delete', 'assign_roles', 'view_reports', 'manage_system'],
      permissions: {
        users: {
          view: true,
          create: true,
          edit: true,
          delete: true,
          assign_roles: true,
          reset_passwords: true
        },
        facilities: {
          view: true,
          create: true,
          edit: true,
          delete: true,
          manage_users: true
        },
        inventory: {
          view: true,
          create: true,
          edit: true,
          delete: true,
          barcode_scan: true,
          bulk_operations: true,
          export_data: true
        },
        transactions: {
          view: true,
          create: true,
          edit: true,
          delete: true,
          approve: true,
          void: true
        },
        transfers: {
          view: true,
          create: true,
          edit: true,
          delete: true,
          approve: true,
          reject: true,
          track: true
        },
        reports: {
          view: true,
          generate: true,
          export: true,
          schedule: true
        },
        system: {
          database_test: true,
          backup: true,
          restore: true,
          settings: true
        }
      }
    },
    regional_supervisor: {
      pages: ['dashboard', 'users', 'facilities', 'inventory', 'transactions', 'transfers', 'reports'],
      actions: ['create', 'read', 'update', 'delete', 'view_reports'],
      permissions: {
        users: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          assign_roles: true,
          reset_passwords: true
        },
        facilities: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          manage_users: true
        },
        inventory: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          barcode_scan: true,
          bulk_operations: true,
          export_data: true
        },
        transactions: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          approve: true,
          void: false
        },
        transfers: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          approve: true,
          reject: true,
          track: true
        },
        reports: {
          view: true,
          generate: true,
          export: true,
          schedule: false
        },
        system: {
          database_test: false,
          backup: false,
          restore: false,
          settings: false
        }
      }
    },
    district_health_officer: {
      pages: ['dashboard', 'users', 'facilities', 'inventory', 'transactions', 'transfers', 'reports'],
      actions: ['create', 'read', 'update', 'delete', 'view_reports'],
      permissions: {
        users: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          assign_roles: true,
          reset_passwords: true
        },
        facilities: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          manage_users: true
        },
        inventory: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          barcode_scan: true,
          bulk_operations: true,
          export_data: true
        },
        transactions: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          approve: true,
          void: false
        },
        transfers: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          approve: true,
          reject: true,
          track: true
        },
        reports: {
          view: true,
          generate: true,
          export: true,
          schedule: false
        },
        system: {
          database_test: false,
          backup: false,
          restore: false,
          settings: false
        }
      }
    },
    facility_manager: {
      pages: ['dashboard', 'users', 'facilities', 'inventory', 'transactions', 'transfers', 'reports'],
      actions: ['create', 'read', 'update', 'delete', 'view_reports'],
      permissions: {
        users: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          assign_roles: false,
          reset_passwords: true
        },
        facilities: {
          view: true,
          create: false,
          edit: true,
          delete: false,
          manage_users: true
        },
        inventory: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          barcode_scan: true,
          bulk_operations: true,
          export_data: true
        },
        transactions: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          approve: true,
          void: false
        },
        transfers: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          approve: false,
          reject: false,
          track: true
        },
        reports: {
          view: true,
          generate: true,
          export: true,
          schedule: false
        },
        system: {
          database_test: false,
          backup: false,
          restore: false,
          settings: false
        }
      }
    },
    village_health_worker: {
      pages: ['dashboard', 'inventory', 'transactions'],
      actions: ['read', 'update'],
      permissions: {
        users: {
          view: false,
          create: false,
          edit: false,
          delete: false,
          assign_roles: false,
          reset_passwords: false
        },
        facilities: {
          view: false,
          create: false,
          edit: false,
          delete: false,
          manage_users: false
        },
        inventory: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          barcode_scan: true,
          bulk_operations: false,
          export_data: false
        },
        transactions: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          approve: false,
          void: false
        },
        transfers: {
          view: false,
          create: false,
          edit: false,
          delete: false,
          approve: false,
          reject: false,
          track: false
        },
        reports: {
          view: false,
          generate: false,
          export: false,
          schedule: false
        },
        system: {
          database_test: false,
          backup: false,
          restore: false,
          settings: false
        }
      }
    }
  };

  // Load users from Firebase
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const usersData = await FirebaseDatabaseService.getUsers();
        setUsers(usersData);
        console.log('Users loaded for role management:', usersData.length);
      } catch (error) {
        console.error('Error loading users:', error);
        addNotification('Failed to load users', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Get users by role
  const getUsersByRole = (roleValue: string) => {
    return users.filter(user => user.role === roleValue);
  };

  // Filter users by search term
  const getFilteredUsers = (roleValue: string) => {
    const roleUsers = getUsersByRole(roleValue);
    if (!searchTerm) return roleUsers;
    
    return roleUsers.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.facilityName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Determine view type based on user count
  const getViewTypeForRole = (roleValue: string) => {
    const userCount = getUsersByRole(roleValue).length;
    return userCount <= 6 ? 'cards' : 'table';
  };

  // Handle role assignment
  const handleAssignRole = (user: User) => {
    setSelectedUserForRole(user);
    setNewRole(user.role);
    setShowAssignRoleModal(true);
  };

  // Save role assignment
  const handleSaveRoleAssignment = async () => {
    if (!selectedUserForRole || !newRole) {
      addNotification('Please select a user and role', 'error');
      return;
    }

    try {
      await FirebaseDatabaseService.updateUser(selectedUserForRole.id, { role: newRole });
      addNotification(`Role updated successfully for ${selectedUserForRole.name}`, 'success');
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUserForRole.id 
            ? { ...user, role: newRole }
            : user
        )
      );
      
      setShowAssignRoleModal(false);
      setSelectedUserForRole(null);
      setNewRole('');
    } catch (error) {
      console.error('Error updating user role:', error);
      addNotification('Failed to update user role', 'error');
    }
  };

  const roles: Role[] = [
    {
      value: 'admin',
      label: 'System Administrator',
      description: 'Full system access - can manage users, facilities, inventory, reports, and all data',
      permissions: rolePermissions.admin.permissions,
      totalPermissions: Object.values(rolePermissions.admin.permissions).flatMap(Object.values).filter(Boolean).length,
      allowedAreas: Object.keys(rolePermissions.admin.permissions).length,
      userCount: 3
    },
    {
      value: 'regional_supervisor',
      label: 'Regional Supervisor',
      description: 'Can manage users, facilities, inventory, and view reports for their region',
      permissions: rolePermissions.regional_supervisor.permissions,
      totalPermissions: Object.values(rolePermissions.regional_supervisor.permissions).flatMap(Object.values).filter(Boolean).length,
      allowedAreas: Object.keys(rolePermissions.regional_supervisor.permissions).length,
      userCount: 5
    },
    {
      value: 'district_health_officer',
      label: 'District Health Officer',
      description: 'Can manage users, facilities, inventory, and view reports for their district',
      permissions: rolePermissions.district_health_officer.permissions,
      totalPermissions: Object.values(rolePermissions.district_health_officer.permissions).flatMap(Object.values).filter(Boolean).length,
      allowedAreas: Object.keys(rolePermissions.district_health_officer.permissions).length,
      userCount: 8
    },
    {
      value: 'facility_manager',
      label: 'Facility Manager',
      description: 'Can manage users, facilities, inventory, and view reports for their facility',
      permissions: rolePermissions.facility_manager.permissions,
      totalPermissions: Object.values(rolePermissions.facility_manager.permissions).flatMap(Object.values).filter(Boolean).length,
      allowedAreas: Object.keys(rolePermissions.facility_manager.permissions).length,
      userCount: 12
    },
    {
      value: 'village_health_worker',
      label: 'Village Health Worker',
      description: 'Can view and update inventory, record transactions',
      permissions: rolePermissions.village_health_worker.permissions,
      totalPermissions: Object.values(rolePermissions.village_health_worker.permissions).flatMap(Object.values).filter(Boolean).length,
      allowedAreas: Object.keys(rolePermissions.village_health_worker.permissions).length,
      userCount: 25
    }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'regional_supervisor':
        return 'bg-blue-100 text-blue-800';
      case 'district_health_officer':
        return 'bg-green-100 text-green-800';
      case 'facility_manager':
        return 'bg-purple-100 text-purple-800';
      case 'village_health_worker':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedRoleConfig = roles.find(role => role.value === selectedRole);

  const handleCreateRole = () => {
    setShowCreateModal(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role.value);
    setShowEditModal(true);
  };

  const handleDeleteRole = (role: Role) => {
    if (role.userCount > 0) {
      addNotification({
        type: 'error',
        title: 'Cannot Delete Role',
        message: `Cannot delete role "${role.label}" because ${role.userCount} users are assigned to it.`
      });
      return;
    }
    
    addNotification({
      type: 'success',
      title: 'Role Deleted',
      message: `Role "${role.label}" has been deleted successfully.`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Roles Management</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Manage system roles and permissions
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {currentUser?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'No Role'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'overview'
                ? 'bg-uganda-yellow text-uganda-black'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'detailed'
                ? 'bg-uganda-yellow text-uganda-black'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Detailed View
          </button>
          <button
            onClick={() => setViewMode('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'users'
                ? 'bg-uganda-yellow text-uganda-black'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Users by Role
          </button>
        </div>
        
        <button
          onClick={handleCreateRole}
          className="px-4 py-2 bg-uganda-yellow text-uganda-black font-medium rounded-lg hover:bg-yellow-500 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Role
        </button>
      </div>

      {viewMode === 'overview' ? (
        /* Overview Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.value} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-uganda-yellow" />
                    <span>{role.label}</span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(role.value)}`}>
                    {role.value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Permissions:</span>
                    <span className="text-sm font-bold text-uganda-yellow">{role.totalPermissions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">System Areas:</span>
                    <span className="text-sm font-bold text-blue-600">{role.allowedAreas}/7</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Users Assigned:</span>
                    <span className="text-sm font-bold text-green-600">{role.userCount}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Access Areas:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-1">
                      {role.permissions.users.view ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />}
                      <span>Users</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {role.permissions.facilities.view ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />}
                      <span>Facilities</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {role.permissions.inventory.view ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />}
                      <span>Inventory</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {role.permissions.transactions.view ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />}
                      <span>Transactions</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {role.permissions.transfers.view ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />}
                      <span>Transfers</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {role.permissions.reports.view ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />}
                      <span>Reports</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedRole(role.value);
                      setViewMode('detailed');
                    }}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleEditRole(role)}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Edit Role"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    title="Delete Role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'detailed' ? (
        /* Detailed Mode */
        <div className="space-y-6">
          {/* Role Selector */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Role to View Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRole === role.value
                      ? 'border-uganda-yellow bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{role.label}</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(role.value)}`}>
                      {role.value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{role.description}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    {role.totalPermissions} permissions • {role.allowedAreas}/7 areas • {role.userCount} users
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Permissions Display */}
          {selectedRoleConfig && (
            <RolePermissionsDisplay 
              role={selectedRoleConfig.value} 
              permissions={selectedRoleConfig.permissions} 
            />
          )}
        </div>
      ) : (
        /* Users by Role Mode */
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Users by Role</h3>
              <div className="flex items-center space-x-4">
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow focus:border-transparent text-sm"
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
                
                {/* View Toggle */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewType('cards')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewType === 'cards' 
                        ? 'bg-uganda-yellow text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title="Card View"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewType('table')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewType === 'table' 
                        ? 'bg-uganda-yellow text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title="Table View"
                  >
                    <Table className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uganda-yellow mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading users...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {roles.map((role) => {
                  const roleUsers = getFilteredUsers(role.value);
                  const totalRoleUsers = getUsersByRole(role.value).length;
                  const effectiveViewType = viewType === 'cards' && roleUsers.length > 6 ? 'table' : viewType;
                  
                  return (
                    <div key={role.value} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Shield className="w-5 h-5 text-uganda-yellow" />
                          <div>
                            <h3 className="font-medium text-gray-900">{role.label}</h3>
                            <p className="text-sm text-gray-600">{role.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {searchTerm && (
                            <span className="text-sm text-gray-500">
                              {roleUsers.length} of {totalRoleUsers} users
                            </span>
                          )}
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleColor(role.value)}`}>
                            {totalRoleUsers} users
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total Permissions:</span>
                          <span className="font-medium">{role.totalPermissions}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">System Areas:</span>
                          <span className="font-medium">{role.allowedAreas}/7</span>
                        </div>
                      </div>

                      {/* Users List */}
                      {roleUsers.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-700">Users with this role:</h4>
                            {effectiveViewType === 'table' && roleUsers.length > 6 && (
                              <span className="text-xs text-gray-500">Showing table view for better performance</span>
                            )}
                          </div>
                          
                          {effectiveViewType === 'cards' ? (
                            /* Card View */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {roleUsers.map((user) => (
                                <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <User className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium text-sm">{user.name}</span>
                                    </div>
                                    <button
                                      onClick={() => handleAssignRole(user)}
                                      className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                      title="Change Role"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="space-y-1 text-xs text-gray-600">
                                    <div className="flex items-center space-x-1">
                                      <Mail className="w-3 h-3" />
                                      <span>{user.email}</span>
                                    </div>
                                    {user.phone && (
                                      <div className="flex items-center space-x-1">
                                        <Phone className="w-3 h-3" />
                                        <span>{user.phone}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center space-x-1">
                                      <Building className="w-3 h-3" />
                                      <span>{user.facilityName || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                        {user.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* Table View */
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Facility
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {roleUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <User className="w-4 h-4 text-gray-500 mr-2" />
                                          <div>
                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.email}</div>
                                        {user.phone && (
                                          <div className="text-sm text-gray-500">{user.phone}</div>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.facilityName || 'N/A'}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                          {user.status}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                          onClick={() => handleAssignRole(user)}
                                          className="text-blue-600 hover:text-blue-900 transition-colors"
                                          title="Change Role"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <UserX className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">
                            {searchTerm ? 'No users found matching your search' : 'No users assigned to this role'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {showAssignRoleModal && selectedUserForRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Assign Role to User</h3>
              <button
                onClick={() => setShowAssignRoleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Name:</strong> {selectedUserForRole.name}</p>
                  <p><strong>Email:</strong> {selectedUserForRole.email}</p>
                  <p><strong>Current Role:</strong> {selectedUserForRole.role}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow focus:border-transparent"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAssignRoleModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoleAssignment}
                className="flex-1 px-4 py-2 bg-uganda-yellow text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 