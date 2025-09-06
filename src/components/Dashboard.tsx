import React, { useState } from 'react';
import { Navbar } from './layout/Navbar';
import { QueryList } from './queries/QueryList';
import { UserManagement } from './admin/UserManagement';
import { MasterDataManagement } from './admin/MasterDataManagement';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('queries');

  const renderContent = () => {
    switch (activeTab) {
      case 'queries':
        return <QueryList />;
      case 'users':
        return <UserManagement />;
      case 'databases':
      case 'categories':
      case 'tags':
      case 'admin':
        return <MasterDataManagement activeSection={activeTab} />;
      default:
        return <QueryList />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex">
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};