import React, { useEffect, useState } from 'react';
import { 
  Users, Database, Folder, Tag, FileText, Plus, 
  ShieldCheck, Activity, Server, ArrowUpRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { supabaseAdmin } from '../../lib/supabase';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
  onNewQuery: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onNewQuery }) => {
  const { isSupabaseConnected } = useAuth();
  const [stats, setStats] = useState({
    totalQueries: 3,
    sharedQueries: 3,
    totalUsers: 2,
    activeUsers: 2,
    totalEngines: 5,
    totalCategories: 4,
    totalTags: 4,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [isSupabaseConnected]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (!isSupabaseConnected) {
        setLoading(false);
        return;
      }

      const [queriesRes, usersRes, enginesRes, categoriesRes, tagsRes] = await Promise.all([
        supabaseAdmin.from('queries').select('id, engine_id, category_id, is_shared'),
        supabaseAdmin.from('users').select('id, is_active'),
        supabaseAdmin.from('database_engine_master').select('id'),
        supabaseAdmin.from('category_master').select('id'),
        supabaseAdmin.from('tags_master').select('id')
      ]);

      const qList = (queriesRes.data || []) as { is_shared?: boolean }[];
      const uList = (usersRes.data || []) as { is_active?: boolean }[];
      const eList = enginesRes.data || [];
      const cList = categoriesRes.data || [];
      const tList = tagsRes.data || [];

      setStats({
        totalQueries: qList.length,
        sharedQueries: qList.filter(q => q.is_shared).length,
        totalUsers: uList.length,
        activeUsers: uList.filter(u => u.is_active).length,
        totalEngines: eList.length,
        totalCategories: cList.length,
        totalTags: tList.length,
      });
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  const kpis = [
    {
      title: 'SQL Queries',
      value: stats.totalQueries,
      sub: `${stats.sharedQueries} shared globally`,
      icon: FileText,
      color: 'indigo',
      linkText: 'View Queries',
      tab: 'queries'
    },
    {
      title: 'System Users',
      value: stats.totalUsers,
      sub: `${stats.activeUsers} active accounts`,
      icon: Users,
      color: 'violet',
      linkText: 'Manage Users',
      tab: 'users'
    },
    {
      title: 'Database Engines',
      value: stats.totalEngines,
      sub: 'Active dialect connectors',
      icon: Database,
      color: 'emerald',
      linkText: 'Configure Engines',
      tab: 'databases'
    },
    {
      title: 'Categories & Tags',
      value: stats.totalCategories + stats.totalTags,
      sub: `${stats.totalCategories} categories · ${stats.totalTags} tags`,
      icon: Folder,
      color: 'amber',
      linkText: 'Manage Taxonomy',
      tab: 'categories'
    }
  ];

  return (
    <div className="space-y-8 animate-fadeInUp">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Administration & System Health</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
              isSupabaseConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              {isSupabaseConnected ? 'Production Connected' : 'Demo In-Memory Mode'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time telemetry, master data taxonomy, and user access oversight.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button variant="secondary" size="sm" icon={Users} onClick={() => onNavigate('users')}>
            Manage Users
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={onNewQuery}>
            New SQL Query
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {kpi.title}
                  </span>
                  <div className="text-3xl font-bold text-slate-900 mt-2 font-mono tracking-tight">
                    {loading ? '—' : kpi.value}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{kpi.sub}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <button
                  onClick={() => onNavigate(kpi.tab)}
                  className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <span>{kpi.linkText}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics & Quick Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System & Architecture Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Server className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">System Infrastructure</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            QueryMaster utilizes PostgreSQL Row Level Security (RLS) policies for granular permission isolation and zero-leak query governance.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-2.5">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium text-slate-700">Backend Engine</span>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-900">PostgreSQL 15</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-medium text-slate-700">Authorization Model</span>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-900">RBAC + Rights Matrix</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-2.5">
                <Server className="h-4 w-4 text-violet-600" />
                <span className="text-xs font-medium text-slate-700">Database Connection</span>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-900">
                {isSupabaseConnected ? 'Live Supabase' : 'Offline Mock Layer'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Folder className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Master Data Taxonomy</h2>
            </div>
            <span className="text-xs text-slate-400">Quick Configuration</span>
          </div>
          <p className="text-xs text-slate-500">
            Define engines, categories, and tags to keep your organization's query repository properly cataloged.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => onNavigate('databases')}
              className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left group"
            >
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <Database className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Database Engines
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                PostgreSQL, MySQL, MongoDB, Oracle & custom engines.
              </p>
            </button>

            <button
              onClick={() => onNavigate('categories')}
              className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left group"
            >
              <div className="h-8 w-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
                <Folder className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Categories
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Analytics, CRUD operations, Performance, Migration.
              </p>
            </button>

            <button
              onClick={() => onNavigate('tags')}
              className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left group"
            >
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <Tag className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Tag Taxonomy
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Production, Staging, QA, Optimization, Reporting.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
