import React, { useState } from 'react';
import Sidebar, { View } from './Sidebar';
import Dashboard from './Dashboard';
import DemoPage from './DemoPage';

interface DashboardPageProps {
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout }) => {
  const [activeView, setActiveView] = useState<View>('dashboard');

  const renderContent = () => {
    switch(activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'scheduling':
      case 'contracts':
      case 'delay':
        return <DemoPage onGoBack={() => setActiveView('dashboard')} title={`${activeView} analysis`} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-light text-brand-dark">
      <Sidebar onLogout={onLogout} activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 overflow-y-auto p-8">
        <div key={activeView} className="animate-fade-in-down">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;