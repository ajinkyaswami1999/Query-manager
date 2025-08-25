import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Copy, 
  Edit, 
  Share, 
  Trash2,
  Eye,
  Database,
  Tag,
  Folder
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Query, DatabaseEngine, Category, Tag as TagType } from '../../types';
import { formatDate, copyToClipboard } from '../../utils/validation';
import toast from 'react-hot-toast';
import { QueryForm } from './QueryForm';

export const QueryList: React.FC = () => {
  const [queries, setQueries] = useState<Query[]>([]);
  const [filteredQueries, setFilteredQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  
  const [engines, setEngines] = useState<DatabaseEngine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  
  const { user, hasRight } = useAuth();

  useEffect(() => {
    loadQueries();
    loadMasterData();
  }, []);

  useEffect(() => {
    filterQueries();
  }, [queries, searchTerm, selectedEngine, selectedCategory, selectedTag]);

  const loadQueries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('queries')
        .select(`
          *,
          engine:database_engine_master(*),
          category:category_master(*),
          tag:tags_master(*),
          creator:users(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQueries(data || []);
    } catch (error) {
      console.error('Error loading queries:', error);
      toast.error('Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  const loadMasterData = async () => {
    try {
      const [enginesRes, categoriesRes, tagsRes] = await Promise.all([
        supabase.from('database_engine_master').select('*').eq('is_active', true),
        supabase.from('category_master').select('*').eq('is_active', true),
        supabase.from('tags_master').select('*').eq('is_active', true)
      ]);

      if (enginesRes.data) setEngines(enginesRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (tagsRes.data) setTags(tagsRes.data);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const filterQueries = () => {
    let filtered = queries;

    if (searchTerm) {
      filtered = filtered.filter(query =>
        query.query_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.query_text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedEngine) {
      filtered = filtered.filter(query => query.engine_id === selectedEngine);
    }

    if (selectedCategory) {
      filtered = filtered.filter(query => query.category_id === selectedCategory);
    }

    if (selectedTag) {
      filtered = filtered.filter(query => query.tag_id === selectedTag);
    }

    setFilteredQueries(filtered);
  };

  const handleCopyQuery = async (queryText: string) => {
    const success = await copyToClipboard(queryText);
    if (success) {
      toast.success('Query copied to clipboard');
    } else {
      toast.error('Failed to copy query');
    }
  };

  const handleShareQuery = async (query: Query) => {
    try {
      const { error } = await supabase
        .from('queries')
        .update({ 
          is_shared: !query.is_shared,
          updated_at: new Date().toISOString(),
          updated_by: user?.user.id
        })
        .eq('id', query.id);

      if (error) throw error;

      toast.success(`Query ${query.is_shared ? 'unshared' : 'shared'} successfully`);
      loadQueries();
    } catch (error) {
      console.error('Error sharing query:', error);
      toast.error('Failed to share query');
    }
  };

  const handleDeleteQuery = async (queryId: string) => {
    if (!window.confirm('Are you sure you want to delete this query?')) return;

    try {
      const { error } = await supabase
        .from('queries')
        .delete()
        .eq('id', queryId);

      if (error) throw error;

      toast.success('Query deleted successfully');
      loadQueries();
    } catch (error) {
      console.error('Error deleting query:', error);
      toast.error('Failed to delete query');
    }
  };

  const handleQueryCreated = () => {
    setShowCreateModal(false);
    loadQueries();
  };

  const handleQueryUpdated = () => {
    setShowEditModal(false);
    setSelectedQuery(null);
    loadQueries();
  };

  const canCreateQuery = hasRight('CREATE_QUERY');
  const canUpdateQuery = hasRight('UPDATE_QUERY');
  const canDeleteQuery = hasRight('DELETE_QUERY');
  const canShareQuery = hasRight('SHARE_QUERY');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Query Management</h1>
          <p className="text-gray-600">Manage and organize your database queries</p>
        </div>
        {canCreateQuery && (
          <Button
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            New Query
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          <select
            value={selectedEngine}
            onChange={(e) => setSelectedEngine(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Engines</option>
            {engines.map(engine => (
              <option key={engine.id} value={engine.id}>{engine.engine_name}</option>
            ))}
          </select>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.category_name}</option>
            ))}
          </select>
          
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Tags</option>
            {tags.map(tag => (
              <option key={tag.id} value={tag.id}>{tag.tag_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Query List */}
      <div className="grid gap-4">
        {filteredQueries.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No queries found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first query.
            </p>
          </div>
        ) : (
          filteredQueries.map((query) => (
            <div key={query.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{query.query_name}</h3>
                      {query.is_shared && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Share className="w-3 h-3 mr-1" />
                          Shared
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{query.description || 'No description'}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
                      {query.engine && (
                        <div className="flex items-center space-x-1">
                          <Database className="w-3 h-3" />
                          <span>{query.engine.engine_name}</span>
                        </div>
                      )}
                      {query.category && (
                        <div className="flex items-center space-x-1">
                          <Folder className="w-3 h-3" />
                          <span>{query.category.category_name}</span>
                        </div>
                      )}
                      {query.tag && (
                        <div className="flex items-center space-x-1">
                          <Tag className="w-3 h-3" />
                          <span>{query.tag.tag_name}</span>
                        </div>
                      )}
                      <span>Created {formatDate(query.created_at)}</span>
                      {query.creator && <span>by {query.creator.name}</span>}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap line-clamp-3">
                        {query.query_text}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Eye}
                    onClick={() => {
                      setSelectedQuery(query);
                      setShowViewModal(true);
                    }}
                  >
                    View
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Copy}
                    onClick={() => handleCopyQuery(query.query_text)}
                  >
                    Copy
                  </Button>

                  {canShareQuery && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Share}
                      onClick={() => handleShareQuery(query)}
                    >
                      {query.is_shared ? 'Unshare' : 'Share'}
                    </Button>
                  )}

                  {canUpdateQuery && query.created_by === user?.user.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Edit}
                      onClick={() => {
                        setSelectedQuery(query);
                        setShowEditModal(true);
                      }}
                    >
                      Edit
                    </Button>
                  )}

                  {canDeleteQuery && query.created_by === user?.user.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Trash2}
                      onClick={() => handleDeleteQuery(query.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Query"
        size="xl"
      >
        <QueryForm
          onSuccess={handleQueryCreated}
          engines={engines}
          categories={categories}
          tags={tags}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Query"
        size="xl"
      >
        {selectedQuery && (
          <QueryForm
            query={selectedQuery}
            onSuccess={handleQueryUpdated}
            engines={engines}
            categories={categories}
            tags={tags}
          />
        )}
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Query Details"
        size="xl"
      >
        {selectedQuery && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">{selectedQuery.query_name}</h3>
              <p className="text-gray-600 text-sm">{selectedQuery.description || 'No description'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Database Engine:</span>
                <p className="text-gray-600">{selectedQuery.engine?.engine_name || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Category:</span>
                <p className="text-gray-600">{selectedQuery.category?.category_name || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Tag:</span>
                <p className="text-gray-600">{selectedQuery.tag?.tag_name || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <p className="text-gray-600">{formatDate(selectedQuery.created_at)}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">Query:</span>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Copy}
                  onClick={() => handleCopyQuery(selectedQuery.query_text)}
                >
                  Copy
                </Button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                  {selectedQuery.query_text}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};