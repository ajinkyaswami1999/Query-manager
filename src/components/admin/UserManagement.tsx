import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Shield, ShieldOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { supabaseAdmin } from '../../lib/supabase';
import { User, Role, UserRight } from '../../types';
import { formatDate } from '../../utils/validation';
import toast from 'react-hot-toast';
import { UserForm } from './UserForm';

// Fallback data
const FALLBACK_USERS = [
  {
    id: 'admin-1',
    role_id: 'role-admin',
    name: 'System Administrator',
    email: 'admin@example.com',
    password_hash: 'Admin123!@#$4567',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    role: {
      id: 'role-admin',
      role_name: 'Admin',
      description: 'System administrator with full access',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: 'user-1',
    role_id: 'role-user',
    name: 'Demo User',
    email: 'user@example.com',
    password_hash: 'User123!@#$4567',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    role: {
      id: 'role-user',
      role_name: 'User',
      description: 'Regular user with limited access',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
];

const FALLBACK_ROLES = [
  { id: 'role-admin', role_name: 'Admin', description: 'System administrator with full access', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'role-user', role_name: 'User', description: 'Regular user with limited access', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const FALLBACK_RIGHTS = [
  { id: 'right-1', right_name: 'CREATE_QUERY', description: 'Can create new queries', created_at: new Date().toISOString() },
  { id: 'right-2', right_name: 'UPDATE_QUERY', description: 'Can update existing queries', created_at: new Date().toISOString() },
  { id: 'right-3', right_name: 'DELETE_QUERY', description: 'Can delete queries', created_at: new Date().toISOString() },
  { id: 'right-4', right_name: 'SHARE_QUERY', description: 'Can share queries with others', created_at: new Date().toISOString() },
  { id: 'right-5', right_name: 'CREATE_USER', description: 'Can create new users', created_at: new Date().toISOString() },
  { id: 'right-6', right_name: 'MANAGE_MASTERS', description: 'Can manage master data', created_at: new Date().toISOString() },
  { id: 'right-7', right_name: 'VIEW_ADMIN_PANEL', description: 'Can access admin panel', created_at: new Date().toISOString() }
];

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRights, setUserRights] = useState<UserRight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { user: currentUser, isSupabaseConnected } = useAuth();

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadUserRights();
  }, [isSupabaseConnected]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      if (!isSupabaseConnected) {
        setUsers(FALLBACK_USERS as User[]);
        return;
      }

      // Use service role to bypass RLS
      const { data, error } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          role:roles!users_role_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        if (error.code === 'PGRST301') {
          toast.error('Access denied: insufficient permissions to load users');
        } else if (error.code === 'PGRST116') {
          toast.error('Database tables not found. Please ensure migrations are applied.');
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          toast.error('Database schema incomplete. Please run migrations.');
        } else {
          toast.error(`Failed to load users: ${error.message}`);
        }
        setUsers(FALLBACK_USERS as User[]);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Network error: Failed to connect to database');
      setUsers(FALLBACK_USERS as User[]);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      if (!isSupabaseConnected) {
        setRoles(FALLBACK_ROLES);
        return;
      }

      // Use service role to bypass RLS
      const { data, error } = await supabaseAdmin
        .from('roles')
        .select('*')
        .order('role_name');

      if (error) {
        console.error('Error loading roles:', error);
        setRoles(FALLBACK_ROLES);
        return;
      }

      setRoles(data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
      setRoles(FALLBACK_ROLES);
    }
  };

  const loadUserRights = async () => {
    try {
      if (!isSupabaseConnected) {
        setUserRights(FALLBACK_RIGHTS);
        return;
      }

      // Use service role to bypass RLS
      const { data, error } = await supabaseAdmin
        .from('user_rights')
        .select('*')
        .order('right_name');

      if (error) {
        console.error('Error loading user rights:', error);
        setUserRights(FALLBACK_RIGHTS);
        return;
      }

      setUserRights(data || []);
    } catch (error) {
      console.error('Error loading user rights:', error);
      setUserRights(FALLBACK_RIGHTS);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      if (!isSupabaseConnected) {
        toast.error('User management not available in demo mode');
        return;
      }

      // Use service role to bypass RLS
      const { error } = await supabaseAdmin
        .from('users')
        .update({ 
          is_active: !user.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user status:', error);
        if (error.code === 'PGRST301') {
          toast.error('Access denied: insufficient permissions to update user status');
        } else if (error.code === 'PGRST116') {
          toast.error('User not found');
        } else {
          toast.error(`Failed to update user status: ${error.message}`);
        }
        return;
      }

      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
      loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Network error: Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      if (!isSupabaseConnected) {
        toast.error('User management not available in demo mode');
        return;
      }

      // Use service role to bypass RLS - First delete user role rights
      const { error: rightsError } = await supabaseAdmin
        .from('user_role_rights')
        .delete()
        .eq('user_id', userId);

      if (rightsError) {
        console.error('Error deleting user rights:', rightsError);
      }

      // Then delete the user
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        if (error.code === 'PGRST301') {
          toast.error('Access denied: insufficient permissions to delete user');
        } else if (error.code === 'PGRST116') {
          toast.error('User not found');
        } else if (error.code === '23503') {
          toast.error('Cannot delete user: user has associated queries or data');
        } else {
          toast.error(`Failed to delete user: ${error.message}`);
        }
        return;
      }

      toast.success('User deleted successfully');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Network error: Failed to delete user');
    }
  };

  const handleUserCreated = () => {
    setShowCreateModal(false);
    loadUsers();
  };

  const handleUserUpdated = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    loadUsers();
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Banner */}
      {!isSupabaseConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
            <p className="text-sm text-amber-800">
              <strong>Demo Mode:</strong> User management features are limited without Supabase connection.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and their permissions</p>
        </div>
        {isSupabaseConnected && (
          <Button
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            Add User
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="max-w-md">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role?.role_name === 'Admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role?.role_name || 'No Role'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {isSupabaseConnected && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={user.is_active ? ShieldOff : Shield}
                          onClick={() => handleToggleUserStatus(user)}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Edit}
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                        >
                          Edit
                        </Button>

                        {user.id !== currentUser?.user.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={Trash2}
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isSupabaseConnected ? 'Get started by adding your first user.' : 'Connect to Supabase to manage users.'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New User"
        size="lg"
      >
        <UserForm
          onSuccess={handleUserCreated}
          roles={roles}
          userRights={userRights}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
        size="lg"
      >
        {selectedUser && (
          <UserForm
            user={selectedUser}
            onSuccess={handleUserUpdated}
            roles={roles}
            userRights={userRights}
          />
        )}
      </Modal>
    </div>
  );
};