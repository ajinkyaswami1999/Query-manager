import React, { useState } from 'react';
import { Sidebar } from './layout/Sidebar';
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
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 flex-shrink-0">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <div className="flex-1 overflow-hidden">
        <main className="h-full overflow-y-auto">
          <div className="p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};