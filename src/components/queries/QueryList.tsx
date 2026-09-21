import React, { useState, useEffect } from 'react';
import {
  Plus, Search, SlidersHorizontal, Copy, Edit3, Share2, Trash2, Eye,
  Database, Tag, Folder, FileText, Calendar, User, ChevronLeft, ChevronRight,
  X, LayoutGrid, Table as TableIcon, Check
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SqlHighlighter } from '../ui/SqlHighlighter';
import { useAuth } from '../../hooks/useAuth';
import { supabaseAdmin } from '../../lib/supabase';
import { Query, DatabaseEngine, Category, Tag as TagType } from '../../types';
import { formatDate, copyToClipboard } from '../../utils/validation';
import { handleSupabaseError, showSuccessMessage, handleNetworkError } from '../../utils/apiErrorHandler';
import { QueryForm } from './QueryForm';

const FALLBACK_ENGINES: DatabaseEngine[] = [
  { id: 'engine-1', engine_name: 'MySQL', description: 'MySQL Database Engine', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'engine-2', engine_name: 'PostgreSQL', description: 'PostgreSQL Database Engine', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'engine-3', engine_name: 'MongoDB', description: 'MongoDB NoSQL Database', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const FALLBACK_CATEGORIES: Category[] = [
  { id: 'cat-1', category_name: 'Analytics', description: 'Data analytics and reporting queries', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-2', category_name: 'CRUD Operations', description: 'Create, Read, Update, Delete operations', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-3', category_name: 'Performance', description: 'Performance optimization queries', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const FALLBACK_TAGS: TagType[] = [
  { id: 'tag-1', tag_name: 'Production', description: 'Production environment queries', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tag-2', tag_name: 'Development', description: 'Development environment queries', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'tag-3', tag_name: 'Testing', description: 'Testing and QA queries', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const INITIAL_DEMO_QUERIES: Query[] = [
  {
    id: 'query-1',
    query_name: 'MTD & LMTD Sales Executive Comparison',
    engine_id: 'engine-2',
    category_id: 'cat-1',
    tag_id: 'tag-1',
    query_text: `-- Sales Executive performance comparison (MTD vs Previous Period)
SELECT
  COALESCE(p.sales_executive_code, 'NOT AVAILABLE') AS 'Sales Executive Code',
  COALESCE(p.sales_executive_name, 'NOT AVAILABLE') AS 'Sales Executive Name',
  ROUND(SUM(CASE
    WHEN a.invoice_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
    AND a.invoice_date <= CURDATE()
    THEN a.net_amount
    ELSE 0
  END), 2) AS 'MTD Amount',
  COUNT(DISTINCT a.invoice_id) as total_invoices
FROM sales_records a
LEFT JOIN profile p ON a.executive_id = p.id
WHERE a.status = 'COMPLETED'
GROUP BY p.sales_executive_code, p.sales_executive_name
ORDER BY 'MTD Amount' DESC;`,
    description: 'Monthly, Last Month, and Financial Year sales metrics broken down by representative',
    is_shared: true,
    created_by: 'admin-1',
    updated_by: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    engine: FALLBACK_ENGINES[1],
    category: FALLBACK_CATEGORIES[0],
    tag: FALLBACK_TAGS[0],
    creator: { id: 'admin-1', name: 'Ajinkya (Admin)', email: 'admin@example.com', role_id: 'role-admin', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  },
  {
    id: 'query-2',
    query_name: 'Rate Plan Sales Executive Breakdown',
    engine_id: 'engine-2',
    category_id: 'cat-1',
    tag_id: 'tag-1',
    query_text: `-- Rate Plan distribution by sales representative
SELECT
  e.sales_executive_code,
  e.sales_executive_name,
  rp.plan_name,
  ROUND(SUM(a.net_amount), 2) AS 'Total Revenue',
  ROUND(AVG(a.net_amount), 2) AS 'Average Ticket'
FROM invoice_items a
JOIN rate_plans rp ON a.plan_id = rp.id
JOIN sales_executives e ON a.executive_id = e.id
WHERE a.invoice_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY e.sales_executive_code, e.sales_executive_name, rp.plan_name;`,
    description: 'Rate plan breakdown and margin metrics by sales executive tier',
    is_shared: true,
    created_by: 'admin-1',
    updated_by: null,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    engine: FALLBACK_ENGINES[1],
    category: FALLBACK_CATEGORIES[0],
    tag: FALLBACK_TAGS[0],
    creator: { id: 'admin-1', name: 'Ajinkya (Admin)', email: 'admin@example.com', role_id: 'role-admin', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  },
  {
    id: 'query-3',
    query_name: 'Retailer Hierarchy & Performance Comparison',
    engine_id: 'engine-1',
    category_id: 'cat-2',
    tag_id: 'tag-2',
    query_text: `-- Retailer transaction volume and store comparison
SELECT
  r.party_code AS 'Retailer Code',
  r.name AS branch_name,
  r.region,
  ROUND(SUM(CASE
    WHEN DATE(s.date) >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
    THEN s.amount
    ELSE 0
  END), 2) AS 'MTD Revenue',
  COUNT(s.transaction_id) as orders_count
FROM retailers r
LEFT JOIN sales_transactions s ON r.id = s.retailer_id
GROUP BY r.party_code, r.name, r.region
ORDER BY 'MTD Revenue' DESC;`,
    description: 'MTD & LMTD Retailer-wise performance and order volumes across store branches',
    is_shared: true,
    created_by: 'admin-1',
    updated_by: null,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
    engine: FALLBACK_ENGINES[0],
    category: FALLBACK_CATEGORIES[1],
    tag: FALLBACK_TAGS[1],
    creator: { id: 'admin-1', name: 'Ajinkya (Admin)', email: 'admin@example.com', role_id: 'role-admin', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  }
];

interface QueryListProps {
  createTrigger?: number;
}

export const QueryList: React.FC<QueryListProps> = ({ createTrigger = 0 }) => {
  const [queries, setQueries] = useState<Query[]>([]);
  const [filteredQueries, setFilteredQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);

  // Master Data
  const [engines, setEngines] = useState<DatabaseEngine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);

  // Copy indicator for cards
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { user, hasRight, isSupabaseConnected } = useAuth();

  // Listen to header create trigger
  useEffect(() => {
    if (createTrigger > 0) {
      setShowCreateModal(true);
    }
  }, [createTrigger]);

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
        setQueries(INITIAL_DEMO_QUERIES);
        setLoading(false);
        return;
      }

      const { data, error } = await supabaseAdmin
        .from('queries')
        .select(`*, engine:database_engine_master(*), category:category_master(*), tag:tags_master(*), creator:users!queries_created_by_fkey(name, email)`)
        .order('created_at', { ascending: false });

      if (error) {
        handleSupabaseError(error, 'load queries');
        setQueries(INITIAL_DEMO_QUERIES);
        return;
      }
      setQueries(data || []);
    } catch {
      handleNetworkError('load queries');
      setQueries(INITIAL_DEMO_QUERIES);
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
    } catch {
      handleNetworkError('load master data');
      setEngines(FALLBACK_ENGINES);
      setCategories(FALLBACK_CATEGORIES);
      setTags(FALLBACK_TAGS);
    }
  };

  const filterQueries = () => {
    let filtered = queries;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(query =>
        query.query_name.toLowerCase().includes(term) ||
        query.description.toLowerCase().includes(term) ||
        query.query_text.toLowerCase().includes(term)
      );
    }
    if (selectedEngine) filtered = filtered.filter(q => q.engine_id === selectedEngine);
    if (selectedCategory) filtered = filtered.filter(q => q.category_id === selectedCategory);
    if (selectedTag) filtered = filtered.filter(q => q.tag_id === selectedTag);
    setFilteredQueries(filtered);
  };

  const handleCopyQuery = async (queryText: string, queryId?: string) => {
    const success = await copyToClipboard(queryText);
    if (success) {
      if (queryId) {
        setCopiedId(queryId);
        setTimeout(() => setCopiedId(null), 1800);
      }
      showSuccessMessage('Query copied to clipboard');
    } else {
      handleSupabaseError({ message: 'Failed to copy query to clipboard' }, 'copy query');
    }
  };

  const handleShareQuery = async (query: Query) => {
    try {
      if (!isSupabaseConnected) {
        // Session mode update
        setQueries(prev => prev.map(q => q.id === query.id ? { ...q, is_shared: !q.is_shared } : q));
        showSuccessMessage(`Query ${query.is_shared ? 'unshared' : 'shared'} (Session Mode)`);
        return;
      }
      const { error } = await supabaseAdmin
        .from('queries')
        .update({ is_shared: !query.is_shared, updated_at: new Date().toISOString(), updated_by: user?.user.id })
        .eq('id', query.id);
      if (error) { handleSupabaseError(error, 'share query'); return; }
      showSuccessMessage(`Query ${query.is_shared ? 'unshared' : 'shared'} successfully`);
      loadQueries();
    } catch {
      handleNetworkError('update query sharing status');
    }
  };

  const handleDeleteQuery = async (queryId: string) => {
    if (!window.confirm('Are you sure you want to delete this query?')) return;
    try {
      if (!isSupabaseConnected) {
        setQueries(prev => prev.filter(q => q.id !== queryId));
        showSuccessMessage('Query deleted (Session Mode)');
        return;
      }
      const { error } = await supabaseAdmin.from('queries').delete().eq('id', queryId);
      if (error) { handleSupabaseError(error, 'delete query'); return; }
      showSuccessMessage('Query deleted successfully');
      loadQueries();
    } catch {
      handleNetworkError('delete query');
    }
  };

  const handleQueryCreated = (newQ?: Query) => {
    setShowCreateModal(false);
    if (!isSupabaseConnected && newQ) {
      setQueries(prev => [newQ, ...prev]);
    } else {
      loadQueries();
    }
  };

  const handleQueryUpdated = (updatedQ?: Query) => {
    setShowEditModal(false);
    setSelectedQuery(null);
    if (!isSupabaseConnected && updatedQ) {
      setQueries(prev => prev.map(q => q.id === updatedQ.id ? updatedQ : q));
    } else {
      loadQueries();
    }
  };

  const canCreateQuery = hasRight('CREATE_QUERY');
  const canUpdateQuery = hasRight('UPDATE_QUERY');
  const canDeleteQuery = hasRight('DELETE_QUERY');
  const canShareQuery = hasRight('SHARE_QUERY');

  const hasActiveFilters = Boolean(selectedEngine || selectedCategory || selectedTag);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-9 w-9 border-3 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Loading query repository…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 65px)' }}>
      {/* Mobile filter overlay */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* Filter Sidebar */}
      <aside
        className={`
          flex-shrink-0 bg-white
          transition-all duration-300 ease-in-out overflow-hidden
          fixed top-14 bottom-0 left-0 z-40
          lg:relative lg:top-auto lg:bottom-auto lg:z-auto
          ${showFilters
            ? 'w-72 translate-x-0 opacity-100 border-r border-slate-200/90 shadow-2xl lg:shadow-none'
            : '-translate-x-full lg:translate-x-0 lg:w-0 opacity-0 border-r-0 pointer-events-none'
          }
        `}
      >
        <div className="w-72 h-full overflow-y-auto p-5 space-y-6">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <h2 className="font-bold text-slate-900 text-sm">Query Filters</h2>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Close filter panel"
              aria-label="Close filter panel"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Filter Controls */}
          <div className="space-y-5">
            {/* Database Engine */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Database Engine
                </label>
                {selectedEngine && (
                  <button 
                    onClick={() => setSelectedEngine('')}
                    className="text-[11px] text-indigo-600 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <select
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="">All Engines ({engines.length})</option>
                {engines.map(engine => (
                  <option key={engine.id} value={engine.id}>{engine.engine_name}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Category
                </label>
                {selectedCategory && (
                  <button 
                    onClick={() => setSelectedCategory('')}
                    className="text-[11px] text-indigo-600 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="">All Categories ({categories.length})</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.category_name}</option>
                ))}
              </select>
            </div>

            {/* Tags Checkbox List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tag Taxonomy
                </label>
                {selectedTag && (
                  <button 
                    onClick={() => setSelectedTag('')}
                    className="text-[11px] text-indigo-600 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {tags.map(tag => {
                  const isChecked = selectedTag === tag.id;
                  return (
                    <label
                      key={tag.id}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                        isChecked ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setSelectedTag(e.target.checked ? tag.id : '')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                        />
                        <span className="text-xs">{tag.tag_name}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => { setSelectedEngine(''); setSelectedCategory(''); setSelectedTag(''); }}
                className="w-full py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
              >
                Reset All Filters
              </button>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center space-x-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span>Repository Total</span>
              </span>
              <span className="font-mono font-semibold text-slate-900">{queries.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center space-x-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filtered Results</span>
              </span>
              <span className="font-mono font-semibold text-slate-900">{filteredQueries.length}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Catalog View */}
      <div className="flex-1 min-w-0 bg-slate-50 transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          {/* Top Bar: Title, Search, View Mode Toggle & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">SQL Queries</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-200/80 text-slate-700">
                  {filteredQueries.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Centralized library of tested production queries, reporting scripts, and analytical workflows.
              </p>
            </div>

            <div className="flex items-center space-x-2.5">
              {/* View Switcher: Grid vs Table */}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-slate-100 text-indigo-600 shadow-xs'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'table'
                      ? 'bg-slate-100 text-indigo-600 shadow-xs'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Compact Table View"
                >
                  <TableIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Filter toggle button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                  showFilters
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
                title={showFilters ? 'Hide filter sidebar' : 'Show filter sidebar'}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                )}
              </button>

              {/* New Query */}
              {canCreateQuery && (
                <Button 
                  icon={Plus} 
                  size="sm" 
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Query
                </Button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by query title, description, or SQL syntax…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Content: Empty State vs Cards vs Table */}
          {filteredQueries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-xs text-center p-6">
              <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No matching SQL queries found</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                {searchTerm || hasActiveFilters
                  ? 'Try clearing selected filters or refining your search keywords.'
                  : 'Start building your team query catalog by creating your first query.'}
              </p>
              {canCreateQuery && (
                <Button 
                  variant="primary" 
                  size="sm" 
                  icon={Plus} 
                  onClick={() => setShowCreateModal(true)}
                >
                  New SQL Query
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredQueries.map((query) => (
                <div
                  key={query.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col overflow-hidden"
                >
                  {/* Card Header & Badges */}
                  <div className="p-5 flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                        {query.query_name}
                      </h3>
                      {query.is_shared && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 flex-shrink-0">
                          Shared
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {query.description || 'No description provided.'}
                    </p>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {query.engine && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <Database className="w-3 h-3 text-emerald-600" />
                          {query.engine.engine_name}
                        </span>
                      )}
                      {query.category && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-100">
                          <Folder className="w-3 h-3 text-violet-600" />
                          {query.category.category_name}
                        </span>
                      )}
                      {query.tag && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-100">
                          <Tag className="w-3 h-3 text-amber-600" />
                          {query.tag.tag_name}
                        </span>
                      )}
                    </div>

                    {/* Syntax Highlighted Preview */}
                    <div 
                      onClick={() => { setSelectedQuery(query); setShowViewModal(true); }}
                      className="cursor-pointer group pt-1"
                    >
                      <SqlHighlighter
                        code={query.query_text}
                        maxLines={4}
                        showCopyButton={false}
                        headerTitle="SQL Preview (Click to expand)"
                      />
                    </div>
                  </div>

                  {/* Card Footer: Metadata and Actions */}
                  <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                      <User className="h-3 w-3" />
                      <span className="truncate max-w-[90px] font-medium text-slate-600">
                        {query.creator?.name || 'Admin'}
                      </span>
                      <span>·</span>
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(query.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {/* Full View */}
                      <button
                        onClick={() => { setSelectedQuery(query); setShowViewModal(true); }}
                        title="View Query"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      {/* Copy SQL */}
                      <button
                        onClick={() => handleCopyQuery(query.query_text, query.id)}
                        title="Copy SQL"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        {copiedId === query.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* Edit */}
                      {canUpdateQuery && (
                        <button
                          onClick={() => { setSelectedQuery(query); setShowEditModal(true); }}
                          title="Edit Query"
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Share */}
                      {canShareQuery && (
                        <button
                          onClick={() => handleShareQuery(query)}
                          title={query.is_shared ? 'Unshare with team' : 'Share with team'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            query.is_shared 
                              ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' 
                              : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                          }`}
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Delete */}
                      {canDeleteQuery && (
                        <button
                          onClick={() => handleDeleteQuery(query.id)}
                          title="Delete Query"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-5 py-3.5">Query Name</th>
                      <th className="px-4 py-3.5">Dialect</th>
                      <th className="px-4 py-3.5">Taxonomy</th>
                      <th className="px-4 py-3.5">Author</th>
                      <th className="px-4 py-3.5">Updated</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQueries.map((query) => (
                      <tr 
                        key={query.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div 
                            className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer"
                            onClick={() => { setSelectedQuery(query); setShowViewModal(true); }}
                          >
                            {query.query_name}
                          </div>
                          <div className="text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                            {query.description || 'No description'}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {query.engine && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px]">
                              {query.engine.engine_name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            {query.category && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md font-medium bg-violet-50 text-violet-700 border border-violet-100 text-[11px]">
                                {query.category.category_name}
                              </span>
                            )}
                            {query.tag && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-800 border border-amber-100 text-[11px]">
                                {query.tag.tag_name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-medium">
                          {query.creator?.name || 'Admin'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 font-mono">
                          {new Date(query.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => { setSelectedQuery(query); setShowViewModal(true); }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                              title="View full"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleCopyQuery(query.query_text, query.id)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                              title="Copy SQL"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            {canUpdateQuery && (
                              <button
                                onClick={() => { setSelectedQuery(query); setShowEditModal(true); }}
                                className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100"
                                title="Edit"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canDeleteQuery && (
                              <button
                                onClick={() => handleDeleteQuery(query.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New SQL Query" subtitle="Store, document, and catalog a reusable SQL script" size="xl">
        <QueryForm onSuccess={handleQueryCreated} engines={engines} categories={categories} tags={tags} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit SQL Query" subtitle="Modify query parameters, SQL code, or catalog taxonomy" size="xl">
        {selectedQuery && (
          <QueryForm query={selectedQuery} onSuccess={handleQueryUpdated} engines={engines} categories={categories} tags={tags} />
        )}
      </Modal>

      {/* Full View Modal with Syntax Highlighting */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={selectedQuery?.query_name || 'Query Inspector'} size="xl">
        {selectedQuery && (
          <div className="space-y-5">
            {selectedQuery.description && (
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {selectedQuery.description}
              </p>
            )}

            {/* Metadata Pills Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] font-bold uppercase text-slate-400">Dialect Engine</span>
                <span className="text-xs font-semibold text-slate-900 mt-0.5 block">{selectedQuery.engine?.engine_name || 'Generic'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] font-bold uppercase text-slate-400">Category</span>
                <span className="text-xs font-semibold text-slate-900 mt-0.5 block">{selectedQuery.category?.category_name || 'Unassigned'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] font-bold uppercase text-slate-400">Tag</span>
                <span className="text-xs font-semibold text-slate-900 mt-0.5 block">{selectedQuery.tag?.tag_name || 'None'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] font-bold uppercase text-slate-400">Created Date</span>
                <span className="text-xs font-semibold text-slate-900 mt-0.5 block">{formatDate(selectedQuery.created_at)}</span>
              </div>
            </div>

            {/* Code Highlighting */}
            <div className="space-y-1.5">
              <SqlHighlighter
                code={selectedQuery.query_text}
                showLineNumbers
                showCopyButton
                headerTitle={selectedQuery.query_name}
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-400">
                Created by <span className="font-medium text-slate-700">{selectedQuery.creator?.name || 'Admin'}</span>
              </div>
              <div className="flex items-center space-x-2">
                {canUpdateQuery && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Edit3}
                    onClick={() => {
                      setShowViewModal(false);
                      setShowEditModal(true);
                    }}
                  >
                    Edit Query
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  icon={Copy}
                  onClick={() => handleCopyQuery(selectedQuery.query_text)}
                >
                  Copy SQL
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
