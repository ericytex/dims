import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { emailService } from '../services/emailService';
import { FirebaseDatabaseService, User } from '../services/firebaseDatabase';
import {
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  User as UserIcon,
  Mail,
  Phone,
  Building,
  MapPin,
  Lock,
  Key,
  Send,
  RefreshCw,
  X
} from 'lucide-react';
import RoleDebugger from '../components/RoleDebugger';
import RolePermissionsDisplay from '../components/RolePermissionsDisplay';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'village_health_worker',
    facilityName: '',
    region: '',
    district: '',
    status: 'active' as 'active' | 'inactive',
    password: '',
    sendCredentials: false // Changed to false since we're not using email
  });

  // Role assignment modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');

  const { addNotification } = useNotification();
  const { user: currentUser } = useFirebaseAuth();

  // Add sample users for testing
  const addSampleUsers = async () => {
    try {
      const sampleUsers = [
        {
          name: 'John Mukasa',
          email: 'john.mukasa@ims.com',
          phone: '+256 701 234 567',
          role: 'admin',
          facilityName: 'Main Office',
          status: 'active' as const,
          tempPassword: 'temp123',
          isFirstLogin: true
        },
        {
          name: 'Mary Nambi',
          email: 'mary.nambi@ims.com',
          phone: '+256 702 345 678',
          role: 'regional_supervisor',
          region: 'Central Region',
          status: 'active' as const,
          tempPassword: 'temp123',
          isFirstLogin: true
        },
        {
          name: 'James Ssebunya',
          email: 'james.ssebunya@ims.com',
          phone: '+256 703 456 789',
          role: 'facility_manager',
          facilityName: 'Kampala Hospital',
          status: 'active' as const,
          tempPassword: 'temp123',
          isFirstLogin: true
        },
        {
          name: 'Sarah Nakato',
          email: 'sarah.nakato@ims.com',
          phone: '+256 704 567 890',
          role: 'district_health_officer',
          district: 'Kampala District',
          status: 'active' as const,
          tempPassword: 'temp123',
          isFirstLogin: true
        },
        {
          name: 'David Ochieng',
          email: 'david.ochieng@ims.com',
          phone: '+256 705 678 901',
          role: 'village_health_worker',
          district: 'Wakiso District',
          status: 'inactive' as 'active' | 'inactive',
          tempPassword: 'temp123',
          isFirstLogin: true
        }
      ];

      for (const userData of sampleUsers) {
        await FirebaseDatabaseService.addUser(userData);
      }

      addNotification({
        type: 'success',
        title: 'Sample Data Added',
        message: '5 sample users have been added to the database.'
      });
    } catch (error) {
      console.error('Error adding sample users:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to add sample users.'
      });
    }
  };

  // Sync current auth user to Firestore
  const syncCurrentUser = async () => {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // Check if user already exists in Firestore
        const existingUsers = await FirebaseDatabaseService.getUsers();
        const existingUser = existingUsers.find(u => u.email === currentUser.email);
        
        if (!existingUser) {
          // Create user in Firestore
          await FirebaseDatabaseService.addUser({
            name: currentUser.displayName || 'Admin User',
            email: currentUser.email || '',
            phone: '',
            role: 'admin',
            status: 'active',
            isFirstLogin: false
          });
          
          addNotification({
            type: 'success',
            title: 'User Synced',
            message: `Current user ${currentUser.email} has been synced to Firestore database.`
          });
        } else {
          addNotification({
            type: 'info',
            title: 'User Already Exists',
            message: `User ${currentUser.email} already exists in Firestore database.`
          });
        }
      } else {
        addNotification({
          type: 'error',
          title: 'No User Logged In',
          message: 'Please log in first to sync your user account.'
        });
      }
    } catch (error) {
      console.error('Error syncing current user:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to sync current user.'
      });
    }
  };

  // Sync all existing Auth users to Firestore
  const syncAllAuthUsers = async () => {
    try {
      await FirebaseDatabaseService.syncAllAuthUsersToFirestore();
      addNotification({
        type: 'success',
        title: 'All Users Synced',
        message: 'All existing Auth users have been synced to Firestore database.'
      });
    } catch (error) {
      console.error('Error syncing all auth users:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to sync all auth users.'
      });
    }
  };

  // Load users from Firebase on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        console.log('Loading users from Firebase...');
        const usersData = await FirebaseDatabaseService.getUsers();
        console.log('Users loaded from Firebase:', usersData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load users from database.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [addNotification]);

  // Real-time listener for users changes
  useEffect(() => {
    console.log('Setting up real-time listener for users...');
    const unsubscribe = FirebaseDatabaseService.onUsersChange((usersData) => {
      console.log('Real-time users update:', usersData);
      setUsers(usersData);
    });

    return () => {
      console.log('Cleaning up real-time listener...');
      unsubscribe();
    };
  }, []);

  const roles = [
    { 
      value: 'admin', 
      label: 'System Administrator',
      permissions: ['all'],
      description: 'Full system access - can manage users, facilities, inventory, reports, and all data'
    },
    { 
      value: 'regional_supervisor', 
      label: 'Regional Supervisor',
      permissions: ['users', 'facilities', 'inventory', 'transactions', 'transfers', 'reports'],
      description: 'Can manage users, facilities, inventory, and view reports for their region'
    },
    { 
      value: 'district_health_officer', 
      label: 'District Health Officer',
      permissions: ['users', 'facilities', 'inventory', 'transactions', 'transfers', 'reports'],
      description: 'Can manage users, facilities, inventory, and view reports for their district'
    },
    { 
      value: 'facility_manager', 
      label: 'Facility Manager',
      permissions: ['users', 'facilities', 'inventory', 'transactions', 'transfers', 'reports'],
      description: 'Can manage users, facilities, inventory, and view reports for their facility'
    },
    { 
      value: 'village_health_worker', 
      label: 'Village Health Worker',
      permissions: ['inventory', 'transactions'],
      description: 'Can view and update inventory, record transactions'
    }
  ];

  // Comprehensive role permissions mapping
  const rolePermissions = {
    admin: {
      pages: ['dashboard', 'users', 'facilities', 'inventory', 'transactions', 'transfers', 'reports', 'database-test'],
      actions: ['create', 'read', 'update', 'delete', 'assign_roles', 'view_reports', 'manage_system'],
      permissions: {
        // User Management
        users: {
          view: true,
          create: true,
          edit: true,
          delete: true,
          assign_roles: true,
          reset_passwords: true
        },
        // Facility Management
        facilities: {
          view: true,
          create: true,
          edit: true,
          delete: true,
          manage_users: true
        },
        // Inventory Management
        inventory: {
          view: true,
          create: true,
          edit: true,
          delete: true,
          barcode_scan: true,
          bulk_operations: true,
          export_data: true
        },
        // Transactions
        transactions: {
          view: true,
          create: true,
          edit: true,
          delete: true,
          approve: true,
          void: true
        },
        // Transfers
        transfers: {
          view: true,
          create: true,
          edit: true,
          delete: true,
          approve: true,
          reject: true,
          track: true
        },
        // Reports
        reports: {
          view: true,
          generate: true,
          export: true,
          schedule: true
        },
        // System
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

  // Function to check if user can assign roles
  const canAssignRoles = (currentUserRole: string) => {
    return ['admin', 'regional_supervisor', 'district_health_officer'].includes(currentUserRole);
  };

  // Function to get available roles for assignment
  const getAvailableRoles = (currentUserRole: string) => {
    switch (currentUserRole) {
      case 'admin':
        return roles; // Admin can assign any role
      case 'regional_supervisor':
        return roles.filter(role => ['facility_manager', 'village_health_worker'].includes(role.value));
      case 'district_health_officer':
        return roles.filter(role => ['facility_manager', 'village_health_worker'].includes(role.value));
      default:
        return [];
    }
  };

  // Handle role assignment
  const handleAssignRole = (user: User) => {
    if (!canAssignRoles(currentUser?.role || '')) {
      addNotification({
        type: 'error',
        title: 'Permission Denied',
        message: 'You do not have permission to assign roles.'
      });
      return;
    }
    setSelectedUserForRole(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  // Save role assignment
  const handleSaveRoleAssignment = async () => {
    if (!selectedUserForRole || !newRole) return;

    try {
      await FirebaseDatabaseService.updateUser(selectedUserForRole.id!, {
        role: newRole
      });

      addNotification({
        type: 'success',
        title: 'Role Updated',
        message: `${selectedUserForRole.name}'s role has been updated to ${newRole}.`
      });

      setShowRoleModal(false);
      setSelectedUserForRole(null);
      setNewRole('');
    } catch (error: any) {
      console.error('Error updating user role:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: `Failed to update role: ${error.message || 'Unknown error'}.`
      });
    }
  };

  const facilities = [
    { value: '', label: 'Select Facility' },
    { value: 'Main Office', label: 'Main Office' },
    { value: 'Kampala Hospital', label: 'Kampala Hospital' },
    { value: 'Mulago Hospital', label: 'Mulago Hospital' },
    { value: 'Jinja Hospital', label: 'Jinja Hospital' }
  ];

  const regions = [
    { value: '', label: 'Select Region' },
    { value: 'Central Region', label: 'Central Region' },
    { value: 'Eastern Region', label: 'Eastern Region' },
    { value: 'Northern Region', label: 'Northern Region' },
    { value: 'Western Region', label: 'Western Region' }
  ];

  const districts = [
    { value: '', label: 'Select District' },
    { value: 'Kampala District', label: 'Kampala District' },
    { value: 'Wakiso District', label: 'Wakiso District' },
    { value: 'Jinja District', label: 'Jinja District' },
    { value: 'Gulu District', label: 'Gulu District' }
  ];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  );

  // Generate temporary password
  const generateTempPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Send credentials via email using real email service
  const sendCredentialsEmail = async (user: User, tempPassword: string) => {
    try {
      const success = await emailService.sendUserCredentials({
        name: user.name,
        email: user.email,
        tempPassword: tempPassword,
        role: user.role
      });

      if (success) {
        addNotification({
          type: 'success',
          title: 'Credentials Sent',
          message: `Login credentials have been sent to ${user.email}`
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Email Failed',
          message: `Failed to send credentials to ${user.email}. Please try again.`
        });
      }
    } catch (error) {
      console.error('Email sending error:', error);
      addNotification({
        type: 'error',
        title: 'Email Error',
        message: `Failed to send credentials to ${user.email}. Please try again.`
      });
    }
  };

  const handleAddUser = () => {
    setModalType('add');
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'village_health_worker',
      facilityName: '',
      region: '',
      district: '',
      status: 'active',
      password: '',
      sendCredentials: false
    });
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setModalType('edit');
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      facilityName: user.facilityName || '',
      region: user.region || '',
      district: user.district || '',
      status: user.status,
      password: '',
      sendCredentials: false
    });
    setShowModal(true);
  };

  const handleViewUser = (user: User) => {
    setModalType('view');
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      facilityName: user.facilityName || '',
      region: user.region || '',
      district: user.district || '',
      status: user.status,
      password: '',
      sendCredentials: false
    });
    setShowModal(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      try {
        await FirebaseDatabaseService.deleteUser(user.id!);
        addNotification({
          type: 'success',
          title: 'User Deleted',
          message: `${user.name} has been successfully deleted.`
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to delete user. Please try again.'
        });
      }
    }
  };

  const handleSaveUser = async () => {
    if (!formData.name || !formData.phone) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in name and phone number (email is optional).'
      });
      return;
    }

    try {
      if (modalType === 'add') {
        // Generate password if not provided
        const userPassword = formData.password || generateTempPassword();
        
        const newUserData = {
          name: formData.name,
          email: formData.email || '', // Email is optional
          phone: formData.phone,
          role: formData.role,
          status: formData.status,
          password: userPassword, // Store the password
          tempPassword: userPassword,
          isFirstLogin: true,
          ...(formData.facilityName && { facilityName: formData.facilityName }),
          ...(formData.region && { region: formData.region }),
          ...(formData.district && { district: formData.district })
        };

        console.log('Attempting to add user with data:', newUserData);

        // Add user to Firebase Firestore
        const userId = await FirebaseDatabaseService.addUser(newUserData);
        
        // Also create user in Firebase Authentication for login
        try {
          const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
          const auth = getAuth();
          
          // Create user in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@dims.go.ug`,
            userPassword
          );
          
          console.log('User created in Firebase Auth with UID:', userCredential.user.uid);
          
          // Update the Firestore document with the Auth UID
          await FirebaseDatabaseService.updateUser(userId, {
            id: userCredential.user.uid
          });
          
        } catch (authError: any) {
          console.error('Error creating user in Firebase Auth:', authError);
          // If email already exists, we can still use the user
          if (authError.code === 'auth/email-already-in-use') {
            console.log('User email already exists in Auth, but user created in Firestore');
          }
        }
        
        console.log('User added successfully with ID:', userId);
        
        // Show password to admin
        const loginEmail = formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@dims.go.ug`;
        addNotification({
          type: 'success',
          title: 'User Added Successfully',
          message: `User "${formData.name}" added. Login: ${loginEmail} | Password: ${userPassword} - Please share these credentials with the user.`
        });
      } else {
        // Update existing user
        const updateData = {
          name: formData.name,
          email: formData.email || '',
          phone: formData.phone,
          role: formData.role,
          status: formData.status,
          ...(formData.facilityName && { facilityName: formData.facilityName }),
          ...(formData.region && { region: formData.region }),
          ...(formData.district && { district: formData.district })
        };

        await FirebaseDatabaseService.updateUser(selectedUser!.id!, updateData);
        
        addNotification({
          type: 'success',
          title: 'User Updated',
          message: `${formData.name} has been successfully updated.`
        });
      }

      setShowModal(false);
    } catch (error: any) {
      console.error('Error saving user:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      addNotification({
        type: 'error',
        title: 'Error',
        message: `Failed to save user: ${error.message || 'Unknown error'}. Please try again.`
      });
    }
  };

  const handleResetPassword = async (user: User) => {
    const tempPassword = generateTempPassword();
    
    try {
      // Update user in Firebase
      await FirebaseDatabaseService.updateUser(user.id!, {
        tempPassword: tempPassword,
        isFirstLogin: true
      });
      
      // Send password reset email
      const success = await emailService.sendPasswordReset({
        name: user.name,
        email: user.email,
        tempPassword: tempPassword,
        role: user.role
      });

      if (success) {
        addNotification({
          type: 'success',
          title: 'Password Reset',
          message: `New temporary password has been sent to ${user.email}`
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Password Reset Failed',
          message: `Failed to send new password to ${user.email}. Please try again.`
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      addNotification({
        type: 'error',
        title: 'Password Reset Error',
        message: `Failed to reset password for ${user.email}. Please try again.`
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'regional_supervisor':
        return 'bg-blue-100 text-blue-800';
      case 'district_health_officer':
        return 'bg-green-100 text-green-800';
      case 'facility_manager':
        return 'bg-yellow-100 text-yellow-800';
      case 'village_health_worker':
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-uganda-black">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and their permissions</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button
            onClick={addSampleUsers}
            className="inline-flex items-center px-4 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Add Sample Data
          </button>
          <button
            onClick={syncCurrentUser}
            className="inline-flex items-center px-4 py-2 bg-uganda-yellow text-uganda-black font-medium rounded-lg hover:bg-yellow-500 transition-colors"
          >
            <UserIcon className="w-5 h-5 mr-2" />
            Sync Current User
          </button>
          <button
            onClick={syncAllAuthUsers}
            className="inline-flex items-center px-4 py-2 bg-uganda-yellow text-uganda-black font-medium rounded-lg hover:bg-yellow-500 transition-colors"
          >
            <UserIcon className="w-5 h-5 mr-2" />
            Sync All Users
          </button>
          <button
            onClick={handleAddUser}
            className="inline-flex items-center px-4 py-2 bg-uganda-yellow text-uganda-black font-medium rounded-lg hover:bg-yellow-500 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uganda-yellow"></div>
            <span className="ml-3 text-gray-600">Loading users...</span>
          </div>
        </div>
      )}

      {/* Filters */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Users Table - Desktop */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-uganda-yellow rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-uganda-black">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-uganda-black">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.facilityName || user.region || user.district || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin || 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="text-gray-600 hover:text-uganda-black"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {canAssignRoles(currentUser?.role || '') && (
                        <button
                          onClick={() => handleAssignRole(user)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Assign role"
                        >
                          <UserIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Reset password"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-uganda-red hover:text-red-900"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Users</h3>
          <div className="text-sm text-gray-500">
            {filteredUsers.length} users
          </div>
        </div>
        
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            {/* Header with User Info */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-uganda-yellow rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-uganda-black">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">{user.name}</h4>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500">{user.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewUser(user)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-md hover:bg-gray-100"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditUser(user)}
                  className="text-blue-400 hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-blue-50"
                  title="Edit User"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleResetPassword(user)}
                  className="text-yellow-400 hover:text-yellow-600 transition-colors p-2 rounded-md hover:bg-yellow-50"
                  title="Reset Password"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteUser(user)}
                  className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-md hover:bg-red-50"
                  title="Delete User"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* User Details */}
            <div className="space-y-3">
              {/* Role and Status */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                  {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                  {user.status}
                </span>
              </div>

              {/* Location */}
              <div className="text-sm">
                <span className="text-gray-500">Location:</span>
                <span className="text-gray-900 ml-1">{user.facilityName || user.region || user.district || 'Not assigned'}</span>
              </div>

              {/* Last Login */}
              <div className="text-sm">
                <span className="text-gray-500">Last Login:</span>
                <span className="text-gray-900 ml-1">{user.lastLogin || 'Never'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-uganda-black">
                {modalType === 'add' ? 'Add New User' : 
                 modalType === 'edit' ? 'Edit User' : 'User Details'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {modalType === 'view' && selectedUser ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-uganda-yellow rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-uganda-black">
                        {selectedUser.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-uganda-black">
                        {selectedUser.name}
                      </h4>
                      <p className="text-gray-600">
                        {selectedUser.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{selectedUser.phone}</span>
                    </div>
                    {(selectedUser.facilityName || selectedUser.region || selectedUser.district) && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">
                          {selectedUser.facilityName || selectedUser.region || selectedUser.district}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                        placeholder="Enter full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                        placeholder="user@dims.go.ug (optional)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                        placeholder="+256700000000"
                      />
                    </div>

                    {modalType === 'add' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password (Optional - will generate if empty)
                        </label>
                        <input
                          type="text"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                          placeholder="Leave empty to auto-generate"
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                      >
                        <option value="admin">Administrator</option>
                        <option value="regional_supervisor">Regional Supervisor</option>
                        <option value="district_health_officer">District Health Officer</option>
                        <option value="facility_manager">Facility Manager</option>
                        <option value="village_health_worker">Village Health Worker</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
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
                    
                    {(formData.role === 'facility_manager' || formData.role === 'village_health_worker') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Facility Name
                        </label>
                        <input
                          type="text"
                          value={formData.facilityName}
                          onChange={(e) => setFormData({...formData, facilityName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                          placeholder="Enter facility name"
                        />
                      </div>
                    )}
                    
                    {formData.role === 'regional_supervisor' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Region
                        </label>
                        <select
                          value={formData.region}
                          onChange={(e) => setFormData({...formData, region: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                        >
                          <option value="">Select Region</option>
                          <option value="Central">Central</option>
                          <option value="Eastern">Eastern</option>
                          <option value="Northern">Northern</option>
                          <option value="Western">Western</option>
                        </select>
                      </div>
                    )}
                    
                    {formData.role === 'district_health_officer' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          District
                        </label>
                        <input
                          type="text"
                          value={formData.district}
                          onChange={(e) => setFormData({...formData, district: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                          placeholder="Enter district name"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Password Management Section - Only for new users */}
                  {modalType === 'add' && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <Lock className="w-4 h-4 mr-2" />
                        Password Management
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="sendCredentials"
                            checked={formData.sendCredentials}
                            onChange={(e) => setFormData({...formData, sendCredentials: e.target.checked})}
                            className="h-4 w-4 text-uganda-yellow focus:ring-uganda-yellow border-gray-300 rounded"
                          />
                          <label htmlFor="sendCredentials" className="text-sm text-gray-700">
                            Send login credentials via email
                          </label>
                        </div>
                        
                        {formData.sendCredentials && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start space-x-2">
                              <Send className="w-4 h-4 text-blue-600 mt-0.5" />
                              <div className="text-sm text-blue-800">
                                <p className="font-medium">Credentials will be sent to: {formData.email}</p>
                                <p className="text-blue-700 mt-1">
                                  User will receive a temporary password and must change it on first login.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {!formData.sendCredentials && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-start space-x-2">
                              <Key className="w-4 h-4 text-yellow-600 mt-0.5" />
                              <div className="text-sm text-yellow-800">
                                <p className="font-medium">Manual Password Setup</p>
                                <p className="text-yellow-700 mt-1">
                                  You'll need to manually provide the temporary password to the user.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveUser}
                      className="flex-1 px-4 py-2 bg-uganda-yellow text-uganda-black font-medium rounded-lg hover:bg-yellow-500 transition-colors"
                    >
                      {modalType === 'add' ? 'Add User' : 'Update User'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {showRoleModal && selectedUserForRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-uganda-black">
                Assign Role to {selectedUserForRole.name}
              </h3>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Role
                  </label>
                  <div className="px-3 py-2 bg-gray-100 rounded-lg">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(selectedUserForRole.role)}`}>
                      {selectedUserForRole.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-uganda-yellow focus:border-uganda-yellow"
                  >
                    {getAvailableRoles(currentUser?.role || '').map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {newRole && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Role Permissions:</p>
                      <p className="mt-1">
                        {roles.find(r => r.value === newRole)?.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Detailed Permissions Display */}
                {newRole && rolePermissions[newRole as keyof typeof rolePermissions]?.permissions && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Detailed Permissions:</h4>
                    <RolePermissionsDisplay 
                      role={newRole} 
                      permissions={rolePermissions[newRole as keyof typeof rolePermissions]?.permissions} 
                    />
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRoleAssignment}
                  disabled={newRole === selectedUserForRole.role}
                  className="flex-1 px-4 py-2 bg-uganda-yellow text-uganda-black font-medium rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}