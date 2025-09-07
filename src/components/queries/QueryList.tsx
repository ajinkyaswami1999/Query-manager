import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  FilterX,
  Copy, 
  Edit, 
  Share, 
  Trash2,
  Eye,
  Database,
  Tag,
  Folder,
  FileText,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { Query, DatabaseEngine, Category, Tag as TagType } from '../../types';
import { formatDate, copyToClipboard } from '../../utils/validation';
import toast from 'react-hot-toast';
import { QueryForm } from './QueryForm';

// Fallback data when Supabase is not connected
const FALLBACK_ENGINES = [
  { id: 'engine-1', engine_name: 'MySQL', description: 'MySQL Database Engine', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'engine-2', engine_name: 'PostgreSQL', description: 'PostgreSQL Database Engine', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'engine-3', engine_name: 'MongoDB', description: 'MongoDB NoSQL Database', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const FALLBACK_CATEGORIES = [
  { id: 'cat-1', category_name: 'Analytics', description: 'Data analytics and reporting queries', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-2', category_name: 'CRUD Operations', description: 'Create, Read, Update, Delete operations', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-3', category_name: 'Performance', description: 'Performance optimization queries', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const FALLBACK_TAGS = [
  { id: 'tag-1', tag_name: 'Production', description: 'Production environment queries', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tag-2', tag_name: 'Development', description: 'Development environment queries', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tag-3', tag_name: 'Testing', description: 'Testing and QA queries', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const FALLBACK_QUERIES = [
  {
    id: 'query-1',
    query_name: 'MTD & LMTD & FTD & LM Sale_Executive-wise Comparison',
    engine_id: 'engine-2',
    category_id: 'cat-1',
    tag_id: 'tag-1',
    query_text: `-- MTD & LMTD & FTD & LM Sale_Executive-wise Comparison
SELECT 
  COALESCE(p.sales_executive_code, 'NOT AVAILABLE') AS 'Sales Executive Code',
  COALESCE(p.sales_executive_name, 'NOT AVAILABLE') AS 'Sales Executive Name',
  -- MTD: from 1st of current month
  ROUND(SUM(CASE 
    WHEN a.invoice_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01') 
    AND a.invoice_date <= CURDATE() 
    THEN a.net_amount 
    ELSE 0 
  END), 2) AS 'MTD Amount'`,
    description: 'Monthly, Last Month, Financial Year and Last Year sales comparison by executive',
    is_shared: true,
    created_by: 'admin-1',
    updated_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    engine: FALLBACK_ENGINES[1],
    category: FALLBACK_CATEGORIES[0],
    tag: FALLBACK_TAGS[0],
    creator: { name: 'Admin', email: 'admin@example.com' }
  },
  {
    id: 'query-2',
    query_name: 'Rate Plan sale Executive_wise',
    engine_id: 'engine-2',
    category_id: 'cat-1',
    tag_id: 'tag-1',
    query_text: `-- Rate Plan sale Executive_wise
SELECT 
  e.sales_executive_code,
  e.sales_executive_name,
  -- MTD: from 1st of current month
  ROUND(SUM(CASE 
    WHEN a.invoice_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01') 
    AND a.invoice_date <= CURDATE() 
    THEN a.net_amount 
    ELSE 0 
  END), 2) AS 'MTD Amount'`,
    description: 'Rate plan analysis by sales executive performance',
    is_shared: true,
    created_by: 'admin-1',
    updated_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    engine: FALLBACK_ENGINES[1],
    category: FALLBACK_CATEGORIES[0],
    tag: FALLBACK_TAGS[0],
    creator: { name: 'Admin', email: 'admin@example.com' }
  },
  {
    id: 'query-3',
    query_name: 'MTD & LMTD & FTD & LM Retailer-wise Comparison',
    engine_id: 'engine-2',
    category_id: 'cat-1',
    tag_id: 'tag-1',
    query_text: `-- MTD & LMTD & FTD & LM Retailer-wise Comparison
SELECT 
  r.party_code AS 'Retailer Party Code',
  r.name AS branch_name,
  r.sales_executive_name,
  -- Current month data
  ROUND(SUM(CASE 
    WHEN DATE(s.date) >= DATE_FORMAT(CURDATE(), '%Y-%m-01') 
    AND DATE(s.date) <= CURDATE() 
    THEN s.amount 
    ELSE 0 
  END), 2) AS 'MTD'`,
    description: 'MTD & LMTD & FTD & LM Retailer-wise Comparison',
    is_shared: true,
    created_by: 'admin-1',
    updated_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    engine: FALLBACK_ENGINES[1],
    category: FALLBACK_CATEGORIES[0],
    tag: FALLBACK_TAGS[0],
    creator: { name: 'Admin', email: 'admin@example.com' }
  }
];

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
  const [showFilters, setShowFilters] = useState(true);
  
  const [engines, setEngines] = useState<DatabaseEngine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  
  const { user, hasRight, isSupabaseConnected } = useAuth();

  useEffect(() => {
    loadQueries();
    loadMasterData();
  }, [isSupabaseConnected]);

  useEffect(() => {
    filterQueries();
  }, [queries, searchTerm, selectedEngine, selectedCategory, selectedTag]);

  const loadQueries = async () => {
    try {
      setLoading(true);
      
      if (!isSupabaseConnected) {
        // Use fallback data
        setQueries(FALLBACK_QUERIES);
        setLoading(false);
        return;
      }

      // Use service role to bypass RLS for loading queries
      const { data, error } = await supabaseAdmin
        .from('queries')
        .select(`
          *,
          engine:database_engine_master(*),
          category:category_master(*),
          tag:tags_master(*),
          creator:users!queries_created_by_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading queries:', error);
        if (error.code === 'PGRST301') {
          toast.error('Access denied: insufficient permissions to load queries');
        } else if (error.code === 'PGRST116') {
          toast.error('Database tables not found. Please ensure migrations are applied.');
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          toast.error('Database schema incomplete. Please run migrations.');
        } else if (error.message.includes('foreign key')) {
          toast.error('Database relationship error. Please contact administrator.');
        } else {
          toast.error(`Failed to load queries: ${error.message}`);
        }
        // Fallback to demo data on error
        setQueries(FALLBACK_QUERIES);
        return;
      }

      setQueries(data || []);
    } catch (error) {
      console.error('Error loading queries:', error);
      toast.error('Network error: Failed to connect to database');
      // Fallback to demo data on error
      setQueries(FALLBACK_QUERIES);
    } finally {
      setLoading(false);
    }
  };

  const loadMasterData = async () => {
    try {
      if (!isSupabaseConnected) {
        setEngines(FALLBACK_ENGINES);
        setCategories(FALLBACK_CATEGORIES);
        setTags(FALLBACK_TAGS);
        return;
      }

      // Use service role to bypass RLS for master data - load in parallel for better performance
      const [enginesRes, categoriesRes, tagsRes] = await Promise.all([
        supabaseAdmin.from('database_engine_master').select('*').eq('is_active', true).order('engine_name'),
        supabaseAdmin.from('category_master').select('*').eq('is_active', true).order('category_name'),
        supabaseAdmin.from('tags_master').select('*').eq('is_active', true).order('tag_name')
      ]);

      if (enginesRes.error) {
        console.error('Error loading engines:', enginesRes.error);
        setEngines(FALLBACK_ENGINES);
      } else {
        setEngines(enginesRes.data || []);
      }

      if (categoriesRes.error) {
        console.error('Error loading categories:', categoriesRes.error);
        setCategories(FALLBACK_CATEGORIES);
      } else {
        setCategories(categoriesRes.data || []);
      }

      if (tagsRes.error) {
        console.error('Error loading tags:', tagsRes.error);
        setTags(FALLBACK_TAGS);
      } else {
        setTags(tagsRes.data || []);
      }
    } catch (error) {
      console.error('Error loading master data:', error);
      // Fallback to demo data on error
      setEngines(FALLBACK_ENGINES);
      setCategories(FALLBACK_CATEGORIES);
      setTags(FALLBACK_TAGS);
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
      if (!isSupabaseConnected) {
        toast.error('Sharing not available in demo mode');
        return;
      }

      // Use service role to bypass RLS for sharing
      const { error } = await supabaseAdmin
        .from('queries')
        .update({ 
          is_shared: !query.is_shared,
          updated_at: new Date().toISOString(),
          updated_by: user?.user.id
        })
        .eq('id', query.id);

      if (error) {
        console.error('Error sharing query:', error);
        if (error.code === 'PGRST301') {
          toast.error('Access denied: insufficient permissions to share query');
        } else if (error.code === 'PGRST116') {
          toast.error('Query not found');
        } else {
          toast.error(`Failed to share query: ${error.message}`);
        }
        return;
      }

      toast.success(`Query ${query.is_shared ? 'unshared' : 'shared'} successfully`);
      loadQueries();
    } catch (error) {
      console.error('Error sharing query:', error);
      toast.error('Network error: Failed to update query sharing status');
    }
  };

  const handleDeleteQuery = async (queryId: string) => {
    if (!window.confirm('Are you sure you want to delete this query?')) return;

    try {
      if (!isSupabaseConnected) {
        toast.error('Delete not available in demo mode');
        return;
      }

      // Use service role to bypass RLS for deletion
      const { error } = await supabaseAdmin
        .from('queries')
        .delete()
        .eq('id', queryId);

      if (error) {
        console.error('Error deleting query:', error);
        if (error.code === 'PGRST301') {
          toast.error('Access denied: insufficient permissions to delete query');
        } else if (error.code === 'PGRST116') {
          toast.error('Query not found');
        } else if (error.code === '23503') {
          toast.error('Cannot delete: query is referenced by other data');
        } else {
          toast.error(`Failed to delete query: ${error.message}`);
        }
        return;
      }

      toast.success('Query deleted successfully');
      loadQueries();
    } catch (error) {
      console.error('Error deleting query:', error);
      toast.error('Network error: Failed to delete query');
    }
  };

  const handleQueryCreated = () => {
    setShowCreateModal(false);
    loadQueries(); // Refresh the list
  };

  const handleQueryUpdated = () => {
    setShowEditModal(false);
    setSelectedQuery(null);
    loadQueries(); // Refresh the list
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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Left Sidebar - Filters */}
      <div className={`${showFilters ? 'w-80 lg:w-96' : 'w-0'} transition-all duration-300 overflow-hidden bg-white shadow-xl border-r border-gray-200 fixed lg:relative h-full lg:h-auto z-40 lg:z-auto`}>
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 w-80 lg:w-96 h-full overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-700">
              <Filter className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-base lg:text-lg">Smart Filters</h2>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:p-1"
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          <div className="space-y-3 lg:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                Database Engine
              </label>
              <select
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 lg:px-4 lg:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                <option value="">All Engines</option>
                {engines.map(engine => (
                  <option key={engine.id} value={engine.id}>{engine.engine_name}</option>
                ))}
              </select>
            </div>
        </div>



            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.category_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                <Tag className="inline h-4 w-4 mr-1" />
                Tags
              </label>
              <div className="space-y-1 lg:space-y-2">
                {tags.map(tag => (
                  <div key={tag.id} className="flex items-center space-x-2 lg:space-x-3">
                    <input
                      type="checkbox"
                      id={`tag_${tag.id}`}
                      checked={selectedTag === tag.id}
                      onChange={(e) => setSelectedTag(e.target.checked ? tag.id : '')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`tag_${tag.id}`}
                      className="text-sm text-gray-700 cursor-pointer flex-1"
                    >
                      {tag.tag_name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 lg:pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Total Queries: {queries.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Folder className="h-4 w-4" />
                <span>Categories: {categories.length}</span>
              </div>
            </div>
          </div>
        </div>

      {/* Overlay for mobile */}
      {showFilters && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Filter Toggle Button */}
        {!showFilters && (
          <button
            onClick={() => setShowFilters(true)}
            className="fixed left-2 top-20 sm:left-4 sm:top-24 z-30 bg-white shadow-lg rounded-xl p-2 sm:p-3 hover:shadow-xl transition-all duration-200 border border-gray-200"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        )}

        {/* Connection Status Banner */}
        {!isSupabaseConnected && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-amber-800">
                <strong>Demo Mode:</strong> Supabase not connected. Using sample data for demonstration.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              SQL Queries ({filteredQueries.length})
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage and organize your SQL query collection</p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button
              variant="ghost"
              icon={showFilters ? FilterX : Filter}
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-600 text-sm"
              size="sm"
            >
              <span className="hidden sm:inline">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              <span className="sm:hidden">Filters</span>
            </Button>
            {canCreateQuery && (
              <Button
                icon={Plus}
                onClick={() => setShowCreateModal(true)}
                size="sm"
              >
                <span className="hidden sm:inline">New Query</span>
                <span className="sm:hidden">New</span>
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm hover:shadow-md transition-all duration-200 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Query Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredQueries.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No queries found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first query.
              </p>
            </div>
          ) : (
            filteredQueries.map((query) => (
              <div key={query.id} className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 group">
                <div className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
                        {query.query_name}
                      </h3>
                      <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">
                        {query.description || 'No description'}
                      </p>
                      
                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span className="hidden sm:inline">{formatDate(query.created_at)}</span>
                          <span className="sm:hidden">{new Date(query.created_at).toLocaleDateString()}</span>
                        </div>
                        {query.creator && (
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span className="truncate max-w-20 sm:max-w-none">{query.creator.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1 ml-2 sm:ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Copy}
                        onClick={() => handleCopyQuery(query.query_text)}
                        className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-1.5 sm:p-2"
                      />
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Edit}
                        onClick={() => {
                          setSelectedQuery(query);
                          setShowEditModal(true);
                        }}
                        className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-1.5 sm:p-2"
                      />

                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Trash2}
                        onClick={() => handleDeleteQuery(query.id)}
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-1.5 sm:p-2"
                      />
                    </div>
                  </div>

                  {/* Query Preview */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 shadow-inner mb-3 sm:mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">SQL</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedQuery(query);
                          setShowViewModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs hover:bg-white px-2 sm:px-3 py-1 rounded-lg"
                      >
                        <span className="hidden sm:inline">View Full →</span>
                        <span className="sm:hidden">View →</span>
                      </Button>
                    </div>
                    <div className="relative">
                      <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap overflow-hidden line-clamp-3 sm:line-clamp-4">
                        {query.query_text}
                      </pre>
                      {query.query_text.length > 150 && (
                        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-slate-50 to-transparent"></div>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap gap-1">
                      {query.engine && (
                        <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 shadow-sm">
                          <Database className="w-3 h-3 mr-1" />
                          <span className="truncate max-w-16 sm:max-w-none">{query.engine.engine_name}</span>
                        </span>
                      )}
                      {query.category && (
                        <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 shadow-sm">
                          <Folder className="w-3 h-3 mr-1" />
                          <span className="truncate max-w-16 sm:max-w-none">{query.category.category_name}</span>
                        </span>
                      )}
                      {query.tag && (
                        <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-semibold bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 shadow-sm">
                          <Tag className="w-3 h-3 mr-1" />
                          <span className="truncate max-w-16 sm:max-w-none">{query.tag.tag_name}</span>
                        </span>
                      )}
                    </div>
                    {query.is_shared && (
                        <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-medium bg-blue-100 text-blue-800 self-start sm:self-auto">
                          <Share className="w-3 h-3 mr-1" />
                          Shared
                        </span>
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
          size="lg"
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
          size="lg"
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
          size="lg"
        >
          {selectedQuery && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{selectedQuery.query_name}</h3>
                <p className="text-gray-600">{selectedQuery.description || 'No description'}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Database Engine:</span>
                  <p className="text-gray-600 mt-1">{selectedQuery.engine?.engine_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <p className="text-gray-600 mt-1">{selectedQuery.category?.category_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tag:</span>
                  <p className="text-gray-600 mt-1">{selectedQuery.tag?.tag_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <p className="text-gray-600 mt-1">{formatDate(selectedQuery.created_at)}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-700">SQL Query:</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Copy}
                    onClick={() => handleCopyQuery(selectedQuery.query_text)}
                  >
                    <span className="hidden sm:inline">Copy Query</span>
                    <span className="sm:hidden">Copy</span>
                  </Button>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border">
                  <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                    {selectedQuery.query_text}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};