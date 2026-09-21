import React, { useState, useEffect } from 'react';
import {
  Database,
  FileText,
  Users,
  Tag,
  Folder,
  LogOut,
  Shield,
  Menu,
  X,
  ChevronDown,
  Plus,
  Search,
  Command,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNewQuery?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, onNewQuery }) => {
  const { user, signOut, isAdmin, hasRight, isSupabaseConnected } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K for search, N for new query)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onTabChange('queries');
        // Focus query search input if present
        setTimeout(() => {
          const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
          if (searchInput) searchInput.focus();
        }, 100);
      }

      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey && onNewQuery && hasRight('CREATE_QUERY')) {
        e.preventDefault();
        onNewQuery();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTabChange, onNewQuery, hasRight]);

  const navItems = [
    { id: 'queries', label: 'SQL Queries', icon: FileText },
    { id: 'databases', label: 'DB Engines', icon: Database },
    { id: 'categories', label: 'Categories', icon: Folder },
    { id: 'tags', label: 'Tags', icon: Tag },
  ];

  const adminNavItems = [
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'admin', label: 'Admin Overview', icon: Shield },
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  const handleSearchShortcutClick = () => {
    onTabChange('queries');
    setTimeout(() => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) searchInput.focus();
    }, 100);
  };

  const canCreateQuery = hasRight('CREATE_QUERY');

  return (
    <header className="bg-white/85 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-40 transition-all shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Brand & Workspace Context */}
          <div className="flex items-center space-x-6">
            <div 
              onClick={() => handleTabClick('queries')}
              className="flex items-center space-x-2.5 cursor-pointer group select-none"
            >
              {/* Premium Icon Badge */}
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-700/60 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Database className="h-4 w-4 text-indigo-400" />
              </div>
              
              {/* Brand Name & Workspace Breadcrumb */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold tracking-tight text-slate-900">
                  QueryMaster
                </span>
                <span className="text-slate-300 font-light select-none">/</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5" />
                  Workspace
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 pl-4 border-l border-slate-200/80">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`relative flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                      isActive
                        ? 'text-indigo-600 after:absolute after:-bottom-[16.5px] after:left-1 after:right-1 after:h-[2.5px] after:bg-indigo-600 after:rounded-full after:shadow-[0_1px_6px_rgba(79,70,229,0.5)]'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {isAdmin() && (
                <>
                  <div className="h-3.5 w-px bg-slate-200 mx-2" />
                  {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={`relative flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                          isActive
                            ? 'text-purple-700 after:absolute after:-bottom-[16.5px] after:left-1 after:right-1 after:h-[2.5px] after:bg-purple-600 after:rounded-full after:shadow-[0_1px_6px_rgba(147,51,234,0.5)]'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </nav>
          </div>

          {/* Right Section: Quick Search, Environment Pill, Action CTA & Profile */}
          <div className="flex items-center space-x-2.5">
            
            {/* Quick Command / Search Trigger (Linear style) */}
            <button
              onClick={handleSearchShortcutClick}
              className="hidden md:flex items-center space-x-2 px-2.5 py-1.5 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs text-slate-400 hover:text-slate-600 transition-all cursor-pointer group shadow-2xs"
              title="Search repository (⌘K / Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
              <span className="text-[11px] font-medium text-slate-500">Quick search...</span>
              <div className="flex items-center space-x-0.5 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-500 shadow-2xs">
                <Command className="h-2.5 w-2.5 mr-0.5" />
                <span>K</span>
              </div>
            </button>

            {/* Live Environment Status Badge */}
            <div 
              className={`hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border shadow-2xs ${
                isSupabaseConnected 
                  ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-800'
                  : 'bg-amber-50/70 border-amber-200/80 text-amber-800'
              }`}
              title={isSupabaseConnected ? 'Connected to live PostgreSQL database' : 'Running in offline in-memory session mode'}
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSupabaseConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </span>
              <span>{isSupabaseConnected ? 'PostgreSQL Live' : 'Demo Mode'}</span>
            </div>

            {/* Quick New Query Action Button */}
            {canCreateQuery && onNewQuery && (
              <button 
                onClick={onNewQuery}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs hover:shadow transition-all border border-slate-800 active:scale-95 group"
                title="Create New Query (Shortcut: N)"
              >
                <Plus className="h-3.5 w-3.5 text-indigo-400 group-hover:rotate-90 transition-transform duration-200" />
                <span>New Query</span>
                <span className="hidden xl:inline-block ml-1 px-1 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
                  N
                </span>
              </button>
            )}

            {/* User Profile Capsule Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 p-1 sm:pl-2 sm:pr-2.5 sm:py-1 rounded-xl hover:bg-slate-100/80 transition-all border border-transparent hover:border-slate-200/70 cursor-pointer group"
                aria-label="User profile menu"
              >
                {/* Avatar with subtle ring */}
                <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs ring-2 ring-indigo-500/20">
                  {user?.user.name.charAt(0).toUpperCase()}
                </div>

                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-none truncate max-w-[110px]">
                    {user?.user.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                    {user?.role?.role_name || 'Member'}
                  </div>
                </div>

                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setUserMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-40 animate-fadeInUp">
                    {/* User Header Profile */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                      <div className="flex items-center space-x-2.5">
                        <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          {user?.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{user?.user.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{user?.user.email}</p>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center space-x-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          user?.role?.role_name === 'Admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {user?.role?.role_name}
                        </span>
                        <span className="text-[10px] text-slate-400">·</span>
                        <span className="inline-flex items-center text-[10px] text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
                          Authenticated
                        </span>
                      </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="py-1">
                      {isAdmin() && (
                        <>
                          <button
                            onClick={() => handleTabClick('users')}
                            className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span>User Management</span>
                          </button>
                          <button
                            onClick={() => handleTabClick('admin')}
                            className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Shield className="h-3.5 w-3.5 text-slate-400" />
                            <span>Admin Analytics Overview</span>
                          </button>
                          <div className="h-px bg-slate-100 my-1" />
                        </>
                      )}

                      <button
                        onClick={() => { signOut(); setUserMenuOpen(false); }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out of QueryMaster</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 py-3 space-y-2">
          {canCreateQuery && onNewQuery && (
            <button 
              onClick={() => { onNewQuery(); setMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xs mb-2"
            >
              <Plus className="h-4 w-4" />
              <span>New SQL Query</span>
            </button>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {isAdmin() && (
            <>
              <div className="h-px bg-slate-100 my-2" />
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3.5 py-1">Administration</div>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isActive ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </>
          )}

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center space-x-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
