import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { supabaseAdmin } from '../../lib/supabase';
import { DatabaseEngine, Category, Tag } from '../../types';
import { formatDate } from '../../utils/validation';
import toast from 'react-hot-toast';
import { MasterDataForm } from './MasterDataForm';
import { useAuth } from '../../hooks/useAuth';

// Fallback data
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

  useEffect(() => {
    loadData();
  }, [activeSection, isSupabaseConnected]);

  const getTableConfig = () => {
    switch (activeSection) {
      case 'databases':
        return {
          table: 'database_engine_master',
          title: 'Database Engines',
          nameField: 'engine_name',
          description: 'Manage database engines supported by the system'
        };
      case 'categories':
        return {
          table: 'category_master',
          title: 'Categories',
          nameField: 'category_name',
          description: 'Manage query categories for organization'
        };
      case 'tags':
        return {
          table: 'tags_master',
          title: 'Tags',
          nameField: 'tag_name',
          description: 'Manage tags for query classification'
        };
      default:
        return {
          table: 'database_engine_master',
          title: 'Database Engines',
          nameField: 'engine_name',
          description: 'Manage database engines supported by the system'
        };
    }
  };

  const config = getTableConfig();

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (!isSupabaseConnected) {
        // Use fallback data based on section
        switch (activeSection) {
          case 'databases':
            setData(FALLBACK_ENGINES);
            break;
          case 'categories':
            setData(FALLBACK_CATEGORIES);
            break;
          case 'tags':
            setData(FALLBACK_TAGS);
            break;
          default:
            setData(FALLBACK_ENGINES);
        }
        return;
      }

      // Use service role to bypass RLS
      const { data: result, error } = await supabaseAdmin
        .from(config.table)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading data:', error);
        toast.error(`Failed to load ${config.title.toLowerCase()}`);
        // Fallback to demo data on error
        switch (activeSection) {
          case 'databases':
            setData(FALLBACK_ENGINES);
            break;
          case 'categories':
            setData(FALLBACK_CATEGORIES);
            break;
          case 'tags':
            setData(FALLBACK_TAGS);
            break;
          default:
            setData(FALLBACK_ENGINES);
        }
        return;
      }

      setData(result || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(`Failed to load ${config.title.toLowerCase()}`);
      // Fallback to demo data on error
      switch (activeSection) {
        case 'databases':
          setData(FALLBACK_ENGINES);
          break;
        case 'categories':
          setData(FALLBACK_CATEGORIES);
          break;
        case 'tags':
          setData(FALLBACK_TAGS);
          break;
        default:
          setData(FALLBACK_ENGINES);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${config.title.slice(0, -1).toLowerCase()}?`)) {
      return;
    }

    try {
      if (!isSupabaseConnected) {
        toast.error('Delete not available in demo mode');
        return;
      }

      // Use service role to bypass RLS
      const { error } = await supabaseAdmin
        .from(config.table)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting item:', error);
        if (error.code === '23503') {
          toast.error(`Cannot delete: ${config.title.slice(0, -1).toLowerCase()} is being used by existing queries`);
        } else {
          toast.error(`Failed to delete ${config.title.slice(0, -1).toLowerCase()}`);
        }
        return;
      }

      toast.success(`${config.title.slice(0, -1)} deleted successfully`);
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(`Failed to delete ${config.title.slice(0, -1).toLowerCase()}`);
    }
  };

  const handleItemCreated = () => {
    setShowCreateModal(false);
    loadData();
  };

  const handleItemUpdated = () => {
    setShowEditModal(false);
    setSelectedItem(null);
    loadData();
  };

  const filteredData = data.filter(item => {
    const nameValue = (item as any)[config.nameField];
    return nameValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
              <strong>Demo Mode:</strong> Master data management features are limited without Supabase connection.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
          <p className="text-gray-600">{config.description}</p>
        </div>
        {isSupabaseConnected && (
          <Button
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            Add {config.title.slice(0, -1)}
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="max-w-md">
          <Input
            placeholder={`Search ${config.title.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
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
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {(item as any)[config.nameField]}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">
                    {item.description || 'No description'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(item.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {isSupabaseConnected && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Edit}
                          onClick={() => {
                            setSelectedItem(item);
                            setShowEditModal(true);
                          }}
                        >
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Trash2}
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No {config.title.toLowerCase()} found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isSupabaseConnected ? `Get started by adding your first ${config.title.slice(0, -1).toLowerCase()}.` : 'Connect to Supabase to manage master data.'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={`Add New ${config.title.slice(0, -1)}`}
        size="md"
      >
        <MasterDataForm
          type={activeSection}
          onSuccess={handleItemCreated}
          config={config}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit ${config.title.slice(0, -1)}`}
        size="md"
      >
        {selectedItem && (
          <MasterDataForm
            type={activeSection}
            item={selectedItem}
            onSuccess={handleItemUpdated}
            config={config}
          />
        )}
      </Modal>
    </div>
  );
};