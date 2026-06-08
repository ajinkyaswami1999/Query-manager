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
        return (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <UserManagement />
          </div>
        );
      case 'databases':
      case 'categories':
      case 'tags':
      case 'admin':
        return (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <MasterDataManagement activeSection={activeTab} />
          </div>
        );
      default:
        return <QueryList />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main>{renderContent()}</main>
    </div>
  );
};
