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
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, signOut, isAdmin } = useAuth();

  const menuItems = [
    { id: 'queries', label: 'SQL Queries', icon: FileText, description: 'Manage your queries' },
    { id: 'databases', label: 'Database Engines', icon: Database, description: 'Engine management' },
    { id: 'categories', label: 'Categories', icon: Folder, description: 'Organize queries' },
    { id: 'tags', label: 'Tags', icon: Tag, description: 'Tag system' },
  ];

  const adminMenuItems = [
    { id: 'users', label: 'User Management', icon: Users, description: 'Manage users' },
    { id: 'admin', label: 'Admin Panel', icon: Shield, description: 'System settings' },
  ];

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl h-full flex flex-col border-r border-slate-700/50">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Database className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">QueryMaster</h1>
            <div className="flex items-center space-x-1">
              <Sparkles className="h-3 w-3 text-purple-400" />
              <p className="text-xs text-gray-300 font-medium">Professional Platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full group flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white shadow-lg border border-blue-500/30'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 transition-colors duration-300 ${
                  activeTab === item.id ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'
                }`} />
                <div className="flex-1">
                  <span className="font-semibold text-sm">{item.label}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {isAdmin() && (
          <div className="pt-6 border-t border-slate-700/50 mt-6">
            <div className="flex items-center space-x-2 px-4 mb-3">
              <Shield className="h-4 w-4 text-purple-400" />
              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                Administration
              </p>
            </div>
            <div className="space-y-1">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full group flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white shadow-lg border border-purple-500/30'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-5 w-5 transition-colors duration-300 ${
                      activeTab === item.id ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
                    }`} />
                    <div className="flex-1">
                      <span className="font-semibold text-sm">{item.label}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center space-x-3 mb-4 p-3 bg-white/5 rounded-xl backdrop-blur-sm">
          <div className="h-10 w-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-white">
              {user?.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.user.name}
            </p>
            <div className="flex items-center space-x-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                user?.role?.role_name === 'Admin' 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {user?.role?.role_name}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 border border-red-500/30"
          icon={LogOut}
          onClick={signOut}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
};