import React from 'react';
import { 
  Database, 
  FileText, 
  Settings, 
  Users, 
  Tag, 
  Folder, 
  LogOut,
  Shield,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

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
    { id: 'databases', label: 'Database Engines', icon: Database },
    { id: 'categories', label: 'Categories', icon: Folder },
    { id: 'tags', label: 'Tags', icon: Tag },
  ];

  const adminMenuItems = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'admin', label: 'Admin Panel', icon: Shield },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50 sticky top-0 z-50 transition-all duration-300">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg floating pulse-glow">
              <Database className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent animate-gradient">QueryMaster</h1>
              <div className="hidden md:flex items-center space-x-1">
                <Sparkles className="h-3 w-3 text-purple-500" />
                <p className="text-xs text-gray-500 font-medium">Professional Platform</p>
              </div>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent sm:hidden">QM</h1>
          </div>

          {/* Desktop Navigation Menu */}
          <div className="hidden lg:flex items-center space-x-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 glow-on-hover ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-lg border border-blue-200 transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:scale-105'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden xl:inline">{item.label}</span>
                </button>
              );
            })}

            {isAdmin() && (
              <>
                <div className="h-6 w-px bg-gray-300 mx-1"></div>
                {adminMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 glow-on-hover ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 shadow-lg border border-purple-200 transform scale-105'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50 hover:scale-105'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden xl:inline">{item.label}</span>
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-300 hover:scale-110"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* User Profile & Sign Out */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-300 hover:scale-105"
              >
                <div className="h-8 w-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-md floating">
                  <span className="text-sm font-bold text-white">
                    {user?.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden xl:block">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role?.role_name}
                  </p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 py-2 z-50 bounce-in">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-sm font-bold text-white">
                          {user?.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.user.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user?.user.email}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                          user?.role?.role_name === 'Admin' 
                            ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800' 
                            : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800'
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
                          onClick={() => {
                            onTabChange('users');
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-gray-900 transition-all duration-200"
                        >
                          <Users className="h-4 w-4" />
                          <span>User Management</span>
                        </button>
                        <button
                          onClick={() => {
                            onTabChange('admin');
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-gray-900 transition-all duration-200"
                        >
                          <Shield className="h-4 w-4" />
                          <span>Admin Panel</span>
                        </button>
                        <div className="h-px bg-gray-200 my-1"></div>
                      </>
                    )}
                    <button
                      onClick={() => {
                        signOut();
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Click outside to close dropdown */}
          {userMenuOpen && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setUserMenuOpen(false)}
            />
          )}
        </div>
      </div>
    </nav>
  );
};