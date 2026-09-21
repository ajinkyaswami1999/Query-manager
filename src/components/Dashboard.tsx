import React, { useState } from 'react';
import { Navbar } from './layout/Navbar';
import { QueryList } from './queries/QueryList';
import { UserManagement } from './admin/UserManagement';
import { MasterDataManagement } from './admin/MasterDataManagement';
import { AdminDashboard } from './admin/AdminDashboard';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('queries');
  const [createQueryTrigger, setCreateQueryTrigger] = useState(0);

  const handleNewQuery = () => {
    setActiveTab('queries');
    setCreateQueryTrigger(prev => prev + 1);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'queries':
        return <QueryList createTrigger={createQueryTrigger} />;
      case 'users':
        return (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <UserManagement />
          </div>
        );
      case 'admin':
        return (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <AdminDashboard onNavigate={setActiveTab} onNewQuery={handleNewQuery} />
          </div>
        );
      case 'databases':
      case 'categories':
      case 'tags':
        return (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <MasterDataManagement activeSection={activeTab} />
          </div>
        );
      default:
        return <QueryList createTrigger={createQueryTrigger} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} onNewQuery={handleNewQuery} />
      <main className="min-h-[calc(100vh-4rem)]">{renderContent()}</main>
    </div>
  );
};
