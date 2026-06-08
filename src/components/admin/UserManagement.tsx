import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Shield, ShieldOff, Search, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { supabaseAdmin } from '../../lib/supabase';
import { User, Role, UserRight } from '../../types';
import { formatDate } from '../../utils/validation';
import toast from 'react-hot-toast';
import { UserForm } from './UserForm';

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
    role: { id: 'role-admin', role_name: 'Admin', description: 'System administrator with full access', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
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
    role: { id: 'role-user', role_name: 'User', description: 'Regular user with limited access', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
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
      if (!isSupabaseConnected) { setUsers(FALLBACK_USERS as User[]); return; }
      const { data, error } = await supabaseAdmin
        .from('users')
        .select(`*, role:roles!users_role_id_fkey(*)`)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error loading users:', error);
        toast.error(`Failed to load users: ${error.message}`);
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
      if (!isSupabaseConnected) { setRoles(FALLBACK_ROLES); return; }
      const { data, error } = await supabaseAdmin.from('roles').select('*').order('role_name');
      if (error) { setRoles(FALLBACK_ROLES); return; }
      setRoles(data || []);
    } catch (error) {
      setRoles(FALLBACK_ROLES);
    }
  };

  const loadUserRights = async () => {
    try {
      if (!isSupabaseConnected) { setUserRights(FALLBACK_RIGHTS); return; }
      const { data, error } = await supabaseAdmin.from('user_rights').select('*').order('right_name');
      if (error) { setUserRights(FALLBACK_RIGHTS); return; }
      setUserRights(data || []);
    } catch (error) {
      setUserRights(FALLBACK_RIGHTS);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      if (!isSupabaseConnected) { toast.error('User management not available in demo mode'); return; }
      const { error } = await supabaseAdmin
        .from('users')
        .update({ is_active: !user.is_active, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) { toast.error(`Failed to update user status: ${error.message}`); return; }
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
      loadUsers();
    } catch (error) {
      toast.error('Network error: Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      if (!isSupabaseConnected) { toast.error('User management not available in demo mode'); return; }
      await supabaseAdmin.from('user_role_rights').delete().eq('user_id', userId);
      const { error } = await supabaseAdmin.from('users').delete().eq('id', userId);
      if (error) { toast.error(`Failed to delete user: ${error.message}`); return; }
      toast.success('User deleted successfully');
      loadUsers();
    } catch (error) {
      toast.error('Network error: Failed to delete user');
    }
  };

  const handleUserCreated = () => { setShowCreateModal(false); loadUsers(); };
  const handleUserUpdated = () => { setShowEditModal(false); setSelectedUser(null); loadUsers(); };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading users…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Demo Mode Banner */}
      {!isSupabaseConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center space-x-3">
          <div className="h-2 w-2 bg-amber-500 rounded-full flex-shrink-0 animate-pulse" />
          <p className="text-sm text-amber-800">
            <strong>Demo Mode:</strong> User management features are limited without Supabase.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-sm text-gray-500">Manage system users and their permissions</p>
            </div>
          </div>
        </div>
        {isSupabaseConnected && (
          <Button icon={Plus} onClick={() => setShowCreateModal(true)} size="sm">
            Add User
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search users by name or email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
                <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Created</th>
                <th className="px-4 sm:px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-sm font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                        {/* Role badge shown on mobile below name */}
                        <div className="sm:hidden mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                            user.role?.role_name === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role?.role_name || 'No Role'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                      user.role?.role_name === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role?.role_name === 'Admin' && <Shield className="h-3 w-3 mr-1" />}
                      {user.role?.role_name || 'No Role'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                      user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-400 hidden lg:table-cell">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-end space-x-1">
                      {isSupabaseConnected && (
                        <>
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                            className={`p-2 rounded-lg text-sm transition-colors ${
                              user.is_active
                                ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {user.is_active ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                            title="Edit user"
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {user.id !== currentUser?.user.id && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              title="Delete user"
                              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No users found</h3>
            <p className="text-sm text-gray-400">
              {isSupabaseConnected ? 'Add your first user to get started.' : 'Connect to Supabase to manage users.'}
            </p>
          </div>
        )}
      </div>

      {/* Total count */}
      {filteredUsers.length > 0 && (
        <p className="text-xs text-gray-400 text-right">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      )}

      {/* Modals */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New User" size="md">
        <UserForm onSuccess={handleUserCreated} roles={roles} userRights={userRights} />
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User" size="md">
        {selectedUser && (
          <UserForm user={selectedUser} onSuccess={handleUserUpdated} roles={roles} userRights={userRights} />
        )}
      </Modal>
    </div>
  );
};
