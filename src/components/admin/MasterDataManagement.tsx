import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Search, Database, Folder, Tag as TagIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { supabaseAdmin } from '../../lib/supabase';
import { DatabaseEngine, Category, Tag } from '../../types';
import { formatDate } from '../../utils/validation';
import { handleSupabaseError, showSuccessMessage, handleNetworkError } from '../../utils/apiErrorHandler';
import { MasterDataForm } from './MasterDataForm';
import { useAuth } from '../../hooks/useAuth';

const INITIAL_ENGINES: DatabaseEngine[] = [
  { id: 'engine-1', engine_name: 'PostgreSQL', description: 'PostgreSQL Database Engine with JSONB support', is_active: true, created_at: new Date(Date.now() - 86400000 * 30).toISOString(), updated_at: new Date().toISOString() },
  { id: 'engine-2', engine_name: 'MySQL', description: 'MySQL Community & Enterprise Engine', is_active: true, created_at: new Date(Date.now() - 86400000 * 25).toISOString(), updated_at: new Date().toISOString() },
  { id: 'engine-3', engine_name: 'MongoDB', description: 'MongoDB NoSQL Document Database', is_active: true, created_at: new Date(Date.now() - 86400000 * 20).toISOString(), updated_at: new Date().toISOString() },
  { id: 'engine-4', engine_name: 'SQL Server', description: 'Microsoft SQL Server Enterprise', is_active: true, created_at: new Date(Date.now() - 86400000 * 15).toISOString(), updated_at: new Date().toISOString() },
  { id: 'engine-5', engine_name: 'Oracle', description: 'Oracle Database Cloud Service', is_active: true, created_at: new Date(Date.now() - 86400000 * 10).toISOString(), updated_at: new Date().toISOString() }
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', category_name: 'Analytics', description: 'Data analytics, KPI metrics, and reporting queries', is_active: true, created_at: new Date(Date.now() - 86400000 * 30).toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-2', category_name: 'CRUD Operations', description: 'Create, Read, Update, Delete operational queries', is_active: true, created_at: new Date(Date.now() - 86400000 * 25).toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-3', category_name: 'Performance', description: 'Slow query analysis and performance optimization', is_active: true, created_at: new Date(Date.now() - 86400000 * 20).toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-4', category_name: 'Maintenance', description: 'Vacuum, index reindexing, and routine cleanup', is_active: true, created_at: new Date(Date.now() - 86400000 * 15).toISOString(), updated_at: new Date().toISOString() }
];

const INITIAL_TAGS: Tag[] = [
  { id: 'tag-1', tag_name: 'Production', description: 'Production-ready critical queries', is_active: true, created_at: new Date(Date.now() - 86400000 * 30).toISOString(), updated_at: new Date().toISOString() },
  { id: 'tag-2', tag_name: 'Development', description: 'Local and staging development scripts', is_active: true, created_at: new Date(Date.now() - 86400000 * 25).toISOString(), updated_at: new Date().toISOString() },
  { id: 'tag-3', tag_name: 'Testing', description: 'QA verification and test scenario assertions', is_active: true, created_at: new Date(Date.now() - 86400000 * 20).toISOString(), updated_at: new Date().toISOString() },
  { id: 'tag-4', tag_name: 'Optimization', description: 'Tuned index scans and low-latency lookups', is_active: true, created_at: new Date(Date.now() - 86400000 * 15).toISOString(), updated_at: new Date().toISOString() }
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

  const { isSupabaseConnected, hasRight } = useAuth();

  const getTableConfig = () => {
    switch (activeSection) {
      case 'databases':
        return { table: 'database_engine_master', title: 'Database Engines', nameField: 'engine_name', description: 'Manage database dialect engines supported by the system', icon: Database, badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'categories':
        return { table: 'category_master', title: 'Query Categories', nameField: 'category_name', description: 'Organize queries into logical business domains and functional categories', icon: Folder, badgeBg: 'bg-violet-50 text-violet-700 border-violet-200' };
      case 'tags':
        return { table: 'tags_master', title: 'Query Tags', nameField: 'tag_name', description: 'Manage metadata tags for query classification and lifecycle stages', icon: TagIcon, badgeBg: 'bg-amber-50 text-amber-800 border-amber-200' };
      default:
        return { table: 'database_engine_master', title: 'Database Engines', nameField: 'engine_name', description: 'Manage database dialect engines supported by the system', icon: Database, badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  const config = getTableConfig();

  const getFallback = () => {
    switch (activeSection) {
      case 'databases': return INITIAL_ENGINES;
      case 'categories': return INITIAL_CATEGORIES;
      case 'tags': return INITIAL_TAGS;
      default: return INITIAL_ENGINES;
    }
  };

  useEffect(() => { 
    loadData(); 
  }, [activeSection, isSupabaseConnected]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!isSupabaseConnected) { 
        setData(getFallback()); 
        return; 
      }
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
    } catch {
      handleNetworkError(`load ${config.title.toLowerCase()}`);
      setData(getFallback());
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const itemLabel = config.title.slice(0, -1);
    if (!window.confirm(`Are you sure you want to delete this ${itemLabel.toLowerCase()}?`)) return;
    try {
      if (!isSupabaseConnected) {
        setData(prev => prev.filter(item => item.id !== id));
        showSuccessMessage(`${itemLabel} deleted (Session Mode)`);
        return;
      }
      const { error } = await supabaseAdmin.from(config.table).delete().eq('id', id);
      if (error) { handleSupabaseError(error, `delete ${config.title.slice(0, -1).toLowerCase()}`); return; }
      showSuccessMessage(`${itemLabel} deleted successfully`);
      loadData();
    } catch {
      handleNetworkError(`delete ${config.title.slice(0, -1).toLowerCase()}`);
    }
  };

  const handleItemCreated = (newItem?: any) => {
    setShowCreateModal(false);
    if (!isSupabaseConnected && newItem) {
      setData(prev => [newItem, ...prev]);
    } else {
      loadData();
    }
  };

  const handleItemUpdated = (updatedItem?: any) => {
    setShowEditModal(false);
    setSelectedItem(null);
    if (!isSupabaseConnected && updatedItem) {
      setData(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    } else {
      loadData();
    }
  };

  const filteredData = data.filter(item => {
    const nameValue = (item as any)[config.nameField];
    return (nameValue?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.description ?? '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const SectionIcon = config.icon;
  const canManageMasters = hasRight('MANAGE_MASTERS');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Loading {config.title.toLowerCase()}…</p>
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{config.title}</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-200/80 text-slate-700">
              {filteredData.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{config.description}</p>
        </div>

        {canManageMasters && (
          <Button 
            icon={Plus} 
            size="sm" 
            onClick={() => setShowCreateModal(true)}
          >
            Add {config.title.slice(0, -1)}
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder={`Search ${config.title.toLowerCase()} by title or description…`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
        />
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Name</th>
                <th className="px-5 py-3.5 hidden sm:table-cell">Description</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 hidden md:table-cell">Created</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Name column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                        <SectionIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {(item as any)[config.nameField]}
                        </div>
                        <div className="sm:hidden text-slate-400 text-[11px] mt-0.5">
                          {item.description || 'No description'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Description */}
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-slate-500 max-w-sm line-clamp-1">
                      {item.description || <span className="text-slate-300 italic">No description provided</span>}
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
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 whitespace-nowrap text-slate-400 font-mono hidden md:table-cell">
                    {formatDate(item.created_at)}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1">
                      {canManageMasters && (
                        <>
                          <button
                            onClick={() => { setSelectedItem(item); setShowEditModal(true); }}
                            title="Edit"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Delete"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
          <div className="flex flex-col items-center justify-center py-16 text-center p-6">
            <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-2">
              <SectionIcon className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No {config.title.toLowerCase()} found</h3>
            <p className="text-xs text-slate-400 mt-0.5">Adjust your search term or add a new entry.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={`Create ${config.title.slice(0, -1)}`} subtitle={`Add a new ${config.title.slice(0, -1).toLowerCase()} entry to the taxonomy`} size="md">
        <MasterDataForm onSuccess={handleItemCreated} config={config} />
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Edit ${config.title.slice(0, -1)}`} subtitle={`Modify the ${config.title.slice(0, -1).toLowerCase()} properties`} size="md">
        {selectedItem && (
          <MasterDataForm item={selectedItem} onSuccess={handleItemUpdated} config={config} />
        )}
      </Modal>
    </div>
  );
};
