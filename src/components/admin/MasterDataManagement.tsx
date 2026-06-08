import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Search, Database, Folder, Tag as TagIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { supabaseAdmin } from '../../lib/supabase';
import { DatabaseEngine, Category, Tag } from '../../types';
import { formatDate } from '../../utils/validation';
import { handleSupabaseError, showSuccessMessage, handleNetworkError } from '../../utils/apiErrorHandler';
import { MasterDataForm } from './MasterDataForm';
import { useAuth } from '../../hooks/useAuth';

const FALLBACK_ENGINES = [
  { id: 'engine-1', engine_name: 'MySQL', description: 'MySQL Database Engine', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'engine-2', engine_name: 'PostgreSQL', description: 'PostgreSQL Database Engine', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'engine-3', engine_name: 'MongoDB', description: 'MongoDB NoSQL Database', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'engine-4', engine_name: 'SQL Server', description: 'Microsoft SQL Server', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'engine-5', engine_name: 'Oracle', description: 'Oracle Database', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const FALLBACK_CATEGORIES = [
  { id: 'cat-1', category_name: 'Analytics', description: 'Data analytics and reporting queries', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-2', category_name: 'CRUD Operations', description: 'Create, Read, Update, Delete operations', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-3', category_name: 'Performance', description: 'Performance optimization queries', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-4', category_name: 'Maintenance', description: 'Database maintenance scripts', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const FALLBACK_TAGS = [
  { id: 'tag-1', tag_name: 'Production', description: 'Production environment queries', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tag-2', tag_name: 'Development', description: 'Development environment queries', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tag-3', tag_name: 'Testing', description: 'Testing and QA queries', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tag-4', tag_name: 'Optimization', description: 'Performance optimization', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

interface MasterDataManagementProps {
  activeSection: string;
}

export const MasterDataManagement: React.FC<MasterDataManagementProps> = ({ activeSection }) => {
  const [data, setData] = useState<(DatabaseEngine | Category | Tag)[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DatabaseEngine | Category | Tag | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { isSupabaseConnected } = useAuth();

  useEffect(() => { loadData(); }, [activeSection, isSupabaseConnected]);

  const getTableConfig = () => {
    switch (activeSection) {
      case 'databases':
        return { table: 'database_engine_master', title: 'Database Engines', nameField: 'engine_name', description: 'Manage database engines supported by the system', icon: Database, color: 'emerald' };
      case 'categories':
        return { table: 'category_master', title: 'Categories', nameField: 'category_name', description: 'Manage query categories for organisation', icon: Folder, color: 'violet' };
      case 'tags':
        return { table: 'tags_master', title: 'Tags', nameField: 'tag_name', description: 'Manage tags for query classification', icon: TagIcon, color: 'orange' };
      default:
        return { table: 'database_engine_master', title: 'Database Engines', nameField: 'engine_name', description: 'Manage database engines supported by the system', icon: Database, color: 'emerald' };
    }
  };

  const config = getTableConfig();

  const getFallback = () => {
    switch (activeSection) {
      case 'databases': return FALLBACK_ENGINES;
      case 'categories': return FALLBACK_CATEGORIES;
      case 'tags': return FALLBACK_TAGS;
      default: return FALLBACK_ENGINES;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      if (!isSupabaseConnected) { setData(getFallback()); return; }
      const { data: result, error } = await supabaseAdmin
        .from(config.table)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        handleSupabaseError(error, `load ${config.title.toLowerCase()}`);
        setData(getFallback());
        return;
      }
      setData(result || []);
    } catch (error) {
      handleNetworkError(`load ${config.title.toLowerCase()}`);
      setData(getFallback());
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${config.title.slice(0, -1).toLowerCase()}?`)) return;
    try {
      if (!isSupabaseConnected) {
        handleSupabaseError({ message: 'Delete not available in demo mode' }, `delete ${config.title.slice(0, -1).toLowerCase()}`);
        return;
      }
      const { error } = await supabaseAdmin.from(config.table).delete().eq('id', id);
      if (error) { handleSupabaseError(error, `delete ${config.title.slice(0, -1).toLowerCase()}`); return; }
      showSuccessMessage(`${config.title.slice(0, -1)} deleted successfully`);
      loadData();
    } catch (error) {
      handleNetworkError(`delete ${config.title.slice(0, -1).toLowerCase()}`);
    }
  };

  const handleItemCreated = () => { setShowCreateModal(false); loadData(); };
  const handleItemUpdated = () => { setShowEditModal(false); setSelectedItem(null); loadData(); };

  const filteredData = data.filter(item => {
    const nameValue = (item as any)[config.nameField];
    return (nameValue?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.description ?? '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-600' },
    violet: { bg: 'bg-violet-100', text: 'text-violet-700', icon: 'text-violet-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'text-orange-600' },
  };
  const colors = colorClasses[config.color] || colorClasses.emerald;
  const SectionIcon = config.icon;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading {config.title.toLowerCase()}…</p>
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
            <strong>Demo Mode:</strong> Master data management is limited without Supabase.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 ${colors.bg} rounded-xl flex items-center justify-center`}>
            <SectionIcon className={`h-5 w-5 ${colors.icon}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
            <p className="text-sm text-gray-500">{config.description}</p>
          </div>
        </div>
        {isSupabaseConnected && (
          <Button icon={Plus} onClick={() => setShowCreateModal(true)} size="sm">
            Add {config.title.slice(0, -1)}
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder={`Search ${config.title.toLowerCase()}…`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Description</th>
                <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Created</th>
                <th className="px-4 sm:px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`h-8 w-8 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <SectionIcon className={`h-4 w-4 ${colors.icon}`} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {(item as any)[config.nameField]}
                        </div>
                        <div className="sm:hidden text-xs text-gray-400 mt-0.5">
                          {item.description || 'No description'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                    <p className="text-sm text-gray-500 max-w-xs truncate">
                      {item.description || <span className="text-gray-300 italic">No description</span>}
                    </p>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                      item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${item.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-400 hidden lg:table-cell">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-end space-x-1">
                      {isSupabaseConnected && (
                        <>
                          <button
                            onClick={() => { setSelectedItem(item); setShowEditModal(true); }}
                            title="Edit"
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Delete"
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className={`h-16 w-16 ${colors.bg} rounded-2xl flex items-center justify-center mb-4`}>
              <SectionIcon className={`h-8 w-8 ${colors.icon} opacity-40`} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No {config.title.toLowerCase()} found</h3>
            <p className="text-sm text-gray-400">
              {isSupabaseConnected
                ? `Add your first ${config.title.slice(0, -1).toLowerCase()} to get started.`
                : 'Connect to Supabase to manage master data.'}
            </p>
          </div>
        )}
      </div>

      {filteredData.length > 0 && (
        <p className="text-xs text-gray-400 text-right">
          Showing {filteredData.length} of {data.length} {config.title.toLowerCase()}
        </p>
      )}

      {/* Modals */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={`Create New ${config.title.slice(0, -1)}`} size="md">
        <MasterDataForm type={activeSection} onSuccess={handleItemCreated} config={config} />
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Edit ${config.title.slice(0, -1)}`} size="md">
        {selectedItem && (
          <MasterDataForm type={activeSection} item={selectedItem} onSuccess={handleItemUpdated} config={config} />
        )}
      </Modal>
    </div>
  );
};
