import React from 'react';
import {
  Database,
  FileText,
  Users,
  Tag,
  Folder,
  LogOut,
  Shield,
  Sparkles,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const { user, signOut, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const menuItems = [
    { id: 'queries', label: 'SQL Queries', icon: FileText },
    { id: 'databases', label: 'DB Engines', icon: Database },
    { id: 'categories', label: 'Categories', icon: Folder },
    { id: 'tags', label: 'Tags', icon: Tag },
  ];

  const adminMenuItems = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'admin', label: 'Admin Panel', icon: Shield },
  ];

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      {/* Main Bar */}
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">QueryMaster</h1>
              <div className="hidden sm:flex items-center space-x-1">
                <Sparkles className="h-2.5 w-2.5 text-indigo-500" />
                <p className="text-xs text-gray-400 font-medium">Professional Platform</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden xl:inline">{item.label}</span>
                </button>
              );
            })}

            {isAdmin() && (
              <>
                <div className="h-5 w-px bg-gray-200 mx-1" />
                {adminMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-200'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="hidden xl:inline">{item.label}</span>
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Desktop User Profile */}
            <div className="hidden lg:block relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="text-sm font-bold text-white">
                    {user?.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.user.name}</p>
                  <p className="text-xs text-gray-400">{user?.role?.role_name}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop User Dropdown */}
              {userMenuOpen && (
                <>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 overflow-hidden">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                          <span className="text-base font-bold text-white">
                            {user?.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user?.user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user?.user.email}</p>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium mt-1 ${
                            user?.role?.role_name === 'Admin'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user?.role?.role_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      {isAdmin() && (
                        <>
                          <button
                            onClick={() => handleTabChange('users')}
                            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Users className="h-4 w-4 text-gray-400" />
                            <span>User Management</span>
                          </button>
                          <button
                            onClick={() => handleTabChange('admin')}
                            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Shield className="h-4 w-4 text-gray-400" />
                            <span>Admin Panel</span>
                          </button>
                          <div className="h-px bg-gray-100 my-1" />
                        </>
                      )}
                      <button
                        onClick={() => { signOut(); setUserMenuOpen(false); }}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            {/* Nav Items */}
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {isAdmin() && (
              <>
                <div className="h-px bg-gray-100 my-2" />
                <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
                {adminMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </>
            )}

            {/* Mobile User Info & Sign Out */}
            <div className="pt-2 mt-2 border-t border-gray-100">
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="h-9 w-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="text-sm font-bold text-white">
                      {user?.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.user.name}</p>
                    <p className="text-xs text-gray-400">{user?.role?.role_name}</p>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
