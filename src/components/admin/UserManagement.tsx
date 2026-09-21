import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Shield, ShieldOff, Search, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { supabaseAdmin } from '../../lib/supabase';
import { User, Role, UserRight } from '../../types';
import { formatDate } from '../../utils/validation';
import toast from 'react-hot-toast';
import { UserForm } from './UserForm';

const FALLBACK_USERS: User[] = [
  {
    id: 'admin-1',
    role_id: 'role-admin',
    name: 'System Administrator',
    email: 'admin@example.com',
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
    role: { id: 'role-admin', role_name: 'Admin', description: 'System administrator with full access', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  },
  {
    id: 'user-1',
    role_id: 'role-user',
    name: 'Demo Analyst',
    email: 'user@example.com',
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date().toISOString(),
    role: { id: 'role-user', role_name: 'User', description: 'Regular user with limited access', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  }
];

const FALLBACK_ROLES: Role[] = [
  { id: 'role-admin', role_name: 'Admin', description: 'System administrator with full access', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'role-user', role_name: 'User', description: 'Regular user with limited access', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const FALLBACK_RIGHTS: UserRight[] = [
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
        setUsers(FALLBACK_USERS); 
        return; 
      }
      const { data, error } = await supabaseAdmin
        .from('users')
        .select(`*, role:roles!users_role_id_fkey(*)`)
        .order('created_at', { ascending: false });
      if (error) {
        toast.error(`Failed to load users: ${error.message}`);
        setUsers(FALLBACK_USERS);
        return;
      }
      setUsers(data || []);
    } catch {
      toast.error('Failed to connect to users repository');
      setUsers(FALLBACK_USERS);
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
    } catch {
      setRoles(FALLBACK_ROLES);
    }
  };

  const loadUserRights = async () => {
    try {
      if (!isSupabaseConnected) { setUserRights(FALLBACK_RIGHTS); return; }
      const { data, error } = await supabaseAdmin.from('user_rights').select('*').order('right_name');
      if (error) { setUserRights(FALLBACK_RIGHTS); return; }
      setUserRights(data || []);
    } catch {
      setUserRights(FALLBACK_RIGHTS);
    }
  };

  const handleToggleUserStatus = async (targetUser: User) => {
    try {
      if (!isSupabaseConnected) { 
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, is_active: !u.is_active } : u));
        toast.success(`User ${targetUser.is_active ? 'deactivated' : 'activated'} (Session Mode)`); 
        return; 
      }
      const { error } = await supabaseAdmin
        .from('users')
        .update({ is_active: !targetUser.is_active, updated_at: new Date().toISOString() })
        .eq('id', targetUser.id);
      if (error) { toast.error(`Failed to update status: ${error.message}`); return; }
      toast.success(`User ${targetUser.is_active ? 'deactivated' : 'activated'} successfully`);
      loadUsers();
    } catch {
      toast.error('Network error: Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      if (!isSupabaseConnected) { 
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast.success('User deleted (Session Mode)'); 
        return; 
      }
      await supabaseAdmin.from('user_role_rights').delete().eq('user_id', userId);
      const { error } = await supabaseAdmin.from('users').delete().eq('id', userId);
      if (error) { toast.error(`Failed to delete user: ${error.message}`); return; }
      toast.success('User deleted successfully');
      loadUsers();
    } catch {
      toast.error('Network error: Failed to delete user');
    }
  };

  const handleUserCreated = (newUser?: User) => {
    setShowCreateModal(false);
    if (!isSupabaseConnected && newUser) {
      setUsers(prev => [newUser, ...prev]);
    } else {
      loadUsers();
    }
  };

  const handleUserUpdated = (updatedUser?: User) => {
    setShowEditModal(false);
    setSelectedUser(null);
    if (!isSupabaseConnected && updatedUser) {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    } else {
      loadUsers();
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Loading user directory…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-200/80 text-slate-700">
              {filteredUsers.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Control employee access, RBAC assignment, and functional rights across the organization.
          </p>
        </div>

        <Button 
          icon={Plus} 
          size="sm" 
          onClick={() => setShowCreateModal(true)}
        >
          Add New User
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search users by full name or email address…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">User Identity</th>
                <th className="px-5 py-3.5">Role Tier</th>
                <th className="px-5 py-3.5">Account Status</th>
                <th className="px-5 py-3.5 hidden md:table-cell">Created Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* User info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 bg-indigo-100 text-indigo-700 font-bold rounded-xl flex items-center justify-center text-xs flex-shrink-0 shadow-xs">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-slate-400 text-[11px]">{item.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                      item.role?.role_name === 'Admin'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}>
                      {item.role?.role_name === 'Admin' && <Shield className="h-3 w-3 mr-1 text-purple-600" />}
                      {item.role?.role_name || 'Member'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      item.is_active 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${item.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {item.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 whitespace-nowrap text-slate-400 font-mono hidden md:table-cell">
                    {formatDate(item.created_at)}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => handleToggleUserStatus(item)}
                        title={item.is_active ? 'Deactivate User' : 'Activate User'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.is_active 
                            ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' 
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {item.is_active ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      </button>

                      <button
                        onClick={() => { setSelectedUser(item); setShowEditModal(true); }}
                        title="Edit User"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      {item.id !== currentUser?.user.id && (
                        <button
                          onClick={() => handleDeleteUser(item.id)}
                          title="Delete User"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center p-6">
            <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-2">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No users found</h3>
            <p className="text-xs text-slate-400 mt-0.5">Try searching with a different name or email address.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New System User" subtitle="Assign credentials, roles, and granular permissions" size="lg">
        <UserForm onSuccess={handleUserCreated} roles={roles} userRights={userRights} />
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User Account" subtitle="Update profile, change password, or adjust rights" size="lg">
        {selectedUser && (
          <UserForm user={selectedUser} onSuccess={handleUserUpdated} roles={roles} userRights={userRights} />
        )}
      </Modal>
    </div>
  );
};
