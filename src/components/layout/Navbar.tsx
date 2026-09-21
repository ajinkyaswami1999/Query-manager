import React, { useState } from 'react';
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
  Plus
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNewQuery?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, onNewQuery }) => {
  const { user, signOut, isAdmin, hasRight, isSupabaseConnected } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const menuItems = [
    { id: 'queries', label: 'SQL Queries', icon: FileText },
    { id: 'databases', label: 'DB Engines', icon: Database },
    { id: 'categories', label: 'Categories', icon: Folder },
    { id: 'tags', label: 'Tags', icon: Tag },
  ];

  const adminMenuItems = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'admin', label: 'Admin Overview', icon: Shield },
  ];

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  const canCreateQuery = hasRight('CREATE_QUERY');

  return (
    <nav className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Navigation */}
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <div 
              onClick={() => handleTabChange('queries')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-xs group-hover:bg-indigo-700 transition-colors">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-base font-bold text-slate-900 tracking-tight">QueryMaster</span>
                  <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    v2.0
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:block">Enterprise SQL Catalog</span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1 pl-4 border-l border-slate-200">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {isAdmin() && (
                <>
                  <div className="h-4 w-px bg-slate-200 mx-2" />
                  {adminMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-purple-50 text-purple-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Right: Actions, Environment status & Profile */}
          <div className="flex items-center space-x-3">
            {/* Environment Status Badge */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 border-slate-200">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span className="text-[11px] text-slate-600">
                {isSupabaseConnected ? 'Live DB' : 'Demo Mode'}
              </span>
            </div>

            {/* Quick New Query Button */}
            {canCreateQuery && onNewQuery && (
              <Button 
                variant="primary" 
                size="sm" 
                icon={Plus} 
                onClick={onNewQuery}
                className="hidden sm:inline-flex"
              >
                New Query
              </Button>
            )}

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="h-8 w-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-xs">
                  {user?.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                    {user?.user.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {user?.role?.role_name || 'User'}
                  </div>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setUserMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-40 animate-fadeInUp">
                    {/* User Header */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 truncate">{user?.user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.user.email}</p>
                      <div className="mt-2 flex items-center space-x-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          user?.role?.role_name === 'Admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {user?.role?.role_name}
                        </span>
                        <span className="text-[10px] text-slate-400">·</span>
                        <span className="text-[10px] text-emerald-600 font-medium">Active Account</span>
                      </div>
                    </div>

                    <div className="py-1">
                      {isAdmin() && (
                        <>
                          <button
                            onClick={() => handleTabChange('users')}
                            className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Users className="h-4 w-4 text-slate-400" />
                            <span>User Management</span>
                          </button>
                          <button
                            onClick={() => handleTabChange('admin')}
                            className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Shield className="h-4 w-4 text-slate-400" />
                            <span>Admin Overview</span>
                          </button>
                          <div className="h-px bg-slate-100 my-1" />
                        </>
                      )}

                      <button
                        onClick={() => { signOut(); setUserMenuOpen(false); }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          {canCreateQuery && onNewQuery && (
            <Button 
              variant="primary" 
              size="sm" 
              icon={Plus} 
              onClick={() => { onNewQuery(); setMobileMenuOpen(false); }}
              className="w-full justify-center mb-2"
            >
              New SQL Query
            </Button>
          )}

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
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
              <div className="text-[11px] font-semibold uppercase text-slate-400 px-3.5 py-1">Administration</div>
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
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
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
