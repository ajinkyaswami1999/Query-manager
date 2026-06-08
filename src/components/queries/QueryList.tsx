import React, { useState, useEffect } from 'react';
import {
  Plus, Search, SlidersHorizontal, Copy, CreditCard as Edit, Share, Trash2, Eye,
  Database, Tag, Folder, FileText, Calendar, User, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { supabaseAdmin } from '../../lib/supabase';
import { Query, DatabaseEngine, Category, Tag as TagType } from '../../types';
import { formatDate, copyToClipboard } from '../../utils/validation';
import { handleSupabaseError, showSuccessMessage, handleNetworkError } from '../../utils/apiErrorHandler';
import { QueryForm } from './QueryForm';

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
        setQueries(FALLBACK_QUERIES);
        setLoading(false);
        return;
      }
      const { data, error } = await supabaseAdmin
        .from('queries')
        .select(`*, engine:database_engine_master(*), category:category_master(*), tag:tags_master(*), creator:users!queries_created_by_fkey(name, email)`)
        .order('created_at', { ascending: false });
      if (error) {
        handleSupabaseError(error, 'load queries');
        setQueries(FALLBACK_QUERIES);
        return;
      }
      setQueries(data || []);
    } catch (error) {
      handleNetworkError('load queries');
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
      const [enginesRes, categoriesRes, tagsRes] = await Promise.all([
        supabaseAdmin.from('database_engine_master').select('*').eq('is_active', true).order('engine_name'),
        supabaseAdmin.from('category_master').select('*').eq('is_active', true).order('category_name'),
        supabaseAdmin.from('tags_master').select('*').eq('is_active', true).order('tag_name')
      ]);
      setEngines(enginesRes.error ? FALLBACK_ENGINES : (enginesRes.data || []));
      setCategories(categoriesRes.error ? FALLBACK_CATEGORIES : (categoriesRes.data || []));
      setTags(tagsRes.error ? FALLBACK_TAGS : (tagsRes.data || []));
    } catch (error) {
      handleNetworkError('load master data');
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
    if (selectedEngine) filtered = filtered.filter(q => q.engine_id === selectedEngine);
    if (selectedCategory) filtered = filtered.filter(q => q.category_id === selectedCategory);
    if (selectedTag) filtered = filtered.filter(q => q.tag_id === selectedTag);
    setFilteredQueries(filtered);
  };

  const handleCopyQuery = async (queryText: string) => {
    const success = await copyToClipboard(queryText);
    if (success) {
      showSuccessMessage('Query copied to clipboard');
    } else {
      handleSupabaseError({ message: 'Failed to copy query to clipboard' }, 'copy query');
    }
  };

  const handleShareQuery = async (query: Query) => {
    try {
      if (!isSupabaseConnected) {
        handleSupabaseError({ message: 'Sharing not available in demo mode' }, 'share query');
        return;
      }
      const { error } = await supabaseAdmin
        .from('queries')
        .update({ is_shared: !query.is_shared, updated_at: new Date().toISOString(), updated_by: user?.user.id })
        .eq('id', query.id);
      if (error) { handleSupabaseError(error, 'share query'); return; }
      showSuccessMessage(`Query ${query.is_shared ? 'unshared' : 'shared'} successfully`);
      loadQueries();
    } catch (error) {
      handleNetworkError('update query sharing status');
    }
  };

  const handleDeleteQuery = async (queryId: string) => {
    if (!window.confirm('Are you sure you want to delete this query?')) return;
    try {
      if (!isSupabaseConnected) {
        handleSupabaseError({ message: 'Delete not available in demo mode' }, 'delete query');
        return;
      }
      const { error } = await supabaseAdmin.from('queries').delete().eq('id', queryId);
      if (error) { handleSupabaseError(error, 'delete query'); return; }
      showSuccessMessage('Query deleted successfully');
      loadQueries();
    } catch (error) {
      handleNetworkError('delete query');
    }
  };

  const handleQueryCreated = () => { setShowCreateModal(false); loadQueries(); };
  const handleQueryUpdated = () => { setShowEditModal(false); setSelectedQuery(null); loadQueries(); };

  const canCreateQuery = hasRight('CREATE_QUERY');
  const canUpdateQuery = hasRight('UPDATE_QUERY');
  const canDeleteQuery = hasRight('DELETE_QUERY');
  const canShareQuery = hasRight('SHARE_QUERY');

  const hasActiveFilters = selectedEngine || selectedCategory || selectedTag;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-500">Loading queries…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 57px)' }}>
      {/* Mobile overlay — must be a sibling of the sidebar, not nested inside it */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* Filter Sidebar */}
      <aside
        className={`
          flex-shrink-0 bg-white border-r border-gray-200 overflow-hidden
          transition-all duration-300 ease-in-out
          fixed inset-y-0 left-0 z-40 lg:relative lg:z-auto lg:inset-y-auto
          ${showFilters ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0'}
        `}
        style={{ top: '57px' }}
      >
        <div className="w-72 h-full overflow-y-auto p-5 space-y-5">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <SlidersHorizontal className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="font-bold text-gray-900 text-sm">Filters</h2>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors hidden lg:flex"
            >
              <ChevronLeft className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* Filter Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Database Engine
              </label>
              <select
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm text-gray-700"
              >
                <option value="">All Engines</option>
                {engines.map(engine => (
                  <option key={engine.id} value={engine.id}>{engine.engine_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm text-gray-700"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.category_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Tags
              </label>
              <div className="space-y-1">
                {tags.map(tag => (
                  <label
                    key={tag.id}
                    className="flex items-center space-x-3 p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTag === tag.id}
                      onChange={(e) => setSelectedTag(e.target.checked ? tag.id : '')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{tag.tag_name}</span>
                  </label>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => { setSelectedEngine(''); setSelectedCategory(''); setSelectedTag(''); }}
                className="w-full py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-100"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="border-t border-gray-100 pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <FileText className="h-4 w-4" />
                <span>Total</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{queries.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Shown</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{filteredQueries.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Folder className="h-4 w-4" />
                <span>Categories</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{categories.length}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content — sibling of sidebar, not nested inside it */}
      <div className="flex-1 min-w-0 bg-gray-50">
        {/* Floating button to re-open sidebar */}
        {!showFilters && (
          <button
            onClick={() => setShowFilters(true)}
            className="hidden lg:block fixed left-4 z-20 bg-white shadow-lg rounded-xl p-2.5 border border-gray-200 hover:shadow-xl transition-all duration-200"
            style={{ top: '75px' }}
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        )}

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Demo Mode Banner */}
          {!isSupabaseConnected && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5 flex items-center space-x-3">
              <div className="h-2 w-2 bg-amber-500 rounded-full flex-shrink-0 animate-pulse" />
              <p className="text-sm text-amber-800">
                <strong>Demo Mode:</strong> Supabase not connected. Using sample data.
              </p>
            </div>
          )}

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-2xl font-bold text-gray-900">SQL Queries</h1>
                <span className="text-lg font-normal text-gray-400">({filteredQueries.length})</span>
              </div>
              <p className="text-gray-500 text-sm mt-0.5">Manage and organize your SQL query collection</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-150 ${
                  showFilters
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                {hasActiveFilters && (
                  <span className="h-2 w-2 rounded-full bg-blue-600 inline-block" />
                )}
              </button>
              {canCreateQuery && (
                <Button icon={Plus} onClick={() => setShowCreateModal(true)} size="sm">
                  <span className="hidden sm:inline">New Query</span>
                  <span className="sm:hidden">New</span>
                </Button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, description or SQL content…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm text-sm placeholder-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Empty State */}
          {filteredQueries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">No queries found</h3>
              <p className="text-sm text-gray-400 text-center max-w-xs mb-4">
                {searchTerm || hasActiveFilters
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by creating your first SQL query.'}
              </p>
              {canCreateQuery && !searchTerm && !hasActiveFilters && (
                <Button icon={Plus} onClick={() => setShowCreateModal(true)} size="sm">
                  Create your first query
                </Button>
              )}
            </div>
          ) : (
            /* Query Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {filteredQueries.map((query) => (
                <div
                  key={query.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden"
                >
                  {/* Card Body */}
                  <div className="p-5 flex-1 space-y-3">
                    {/* Title & Description */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-1">
                        {query.query_name}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {query.description || 'No description provided'}
                      </p>
                    </div>

                    {/* Badge Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {query.engine && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <Database className="w-3 h-3" />
                          {query.engine.engine_name}
                        </span>
                      )}
                      {query.category && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100">
                          <Folder className="w-3 h-3" />
                          {query.category.category_name}
                        </span>
                      )}
                      {query.tag && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                          <Tag className="w-3 h-3" />
                          {query.tag.tag_name}
                        </span>
                      )}
                      {query.is_shared && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          <Share className="w-3 h-3" />
                          Shared
                        </span>
                      )}
                    </div>

                    {/* SQL Code Preview */}
                    <div className="bg-gray-950 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
                        <div className="flex items-center space-x-1.5">
                          <div className="h-2 w-2 bg-red-500 rounded-full" />
                          <div className="h-2 w-2 bg-yellow-400 rounded-full" />
                          <div className="h-2 w-2 bg-green-500 rounded-full" />
                        </div>
                        <button
                          onClick={() => { setSelectedQuery(query); setShowViewModal(true); }}
                          className="text-xs text-gray-500 hover:text-gray-300 transition-colors font-mono"
                        >
                          View full →
                        </button>
                      </div>
                      <pre className="px-3 pb-3 text-xs text-green-400 font-mono whitespace-pre-wrap line-clamp-4 leading-relaxed">
                        {query.query_text}
                      </pre>
                    </div>
                  </div>

                  {/* Card Footer — always visible action buttons */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <User className="h-3 w-3" />
                      <span className="truncate max-w-[80px]">{query.creator?.name || '—'}</span>
                      <span className="mx-1">·</span>
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(query.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-0.5">
                      <button
                        onClick={() => { setSelectedQuery(query); setShowViewModal(true); }}
                        title="View query"
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleCopyQuery(query.query_text)}
                        title="Copy SQL"
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {canUpdateQuery && (
                        <button
                          onClick={() => { setSelectedQuery(query); setShowEditModal(true); }}
                          title="Edit query"
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {canShareQuery && (
                        <button
                          onClick={() => handleShareQuery(query)}
                          title={query.is_shared ? 'Unshare' : 'Share'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            query.is_shared
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <Share className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {canDeleteQuery && (
                        <button
                          onClick={() => handleDeleteQuery(query.id)}
                          title="Delete query"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Query" size="lg">
        <QueryForm onSuccess={handleQueryCreated} engines={engines} categories={categories} tags={tags} />
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Query" size="lg">
        {selectedQuery && (
          <QueryForm query={selectedQuery} onSuccess={handleQueryUpdated} engines={engines} categories={categories} tags={tags} />
        )}
      </Modal>

      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Query Details" size="lg">
        {selectedQuery && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedQuery.query_name}</h3>
              <p className="text-sm text-gray-500">{selectedQuery.description || 'No description'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Database Engine', value: selectedQuery.engine?.engine_name },
                { label: 'Category', value: selectedQuery.category?.category_name },
                { label: 'Tag', value: selectedQuery.tag?.tag_name },
                { label: 'Created', value: formatDate(selectedQuery.created_at) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</span>
                  <p className="text-sm font-medium text-gray-900">{value || 'N/A'}</p>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">SQL Query</span>
                <Button size="sm" variant="secondary" icon={Copy} onClick={() => handleCopyQuery(selectedQuery.query_text)}>
                  Copy
                </Button>
              </div>
              <div className="bg-gray-950 rounded-xl p-4 overflow-x-auto">
                <pre className="text-sm text-green-400 font-mono whitespace-pre leading-relaxed">
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
