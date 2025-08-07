import React, { useState } from 'react';
import { SchedulerProject, Tab } from '../types';
import { ChartBarIcon, DocumentTextIcon, ExclamationTriangleIcon, SparklesIcon } from './Icons';
import ProjectDashboardTab from './tabs/ProjectDashboardTab';
import ScheduleTab from './tabs/ScheduleTab';
import ContractsTab from './tabs/ContractsTab';
import DelayAnalysisTab from './tabs/DelayAnalysisTab';

interface ProjectViewProps {
  project: SchedulerProject;
}

const ProjectView: React.FC<ProjectViewProps> = ({ project }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs: { id: Tab; name: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', name: 'Dashboard', icon: <SparklesIcon className="w-5 h-5 mr-2" /> },
    { id: 'schedules', name: 'Schedules', icon: <ChartBarIcon className="w-5 h-5 mr-2" /> },
    { id: 'contracts', name: 'Contracts', icon: <DocumentTextIcon className="w-5 h-5 mr-2" /> },
    { id: 'delayAnalysis', name: 'Delay Analysis', icon: <ExclamationTriangleIcon className="w-5 h-5 mr-2" /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ProjectDashboardTab project={project} />;
      case 'schedules':
        return <ScheduleTab project={project} />;
      case 'contracts':
        return <ContractsTab project={project} />;
      case 'delayAnalysis':
        return <DelayAnalysisTab project={project} />;
      default:
        return null;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-base-content">{project.name}</h1>
        <p className="text-lg text-base-content-secondary mt-1">{project.projectInput.description}</p>
      </div>

      <div className="border-b border-base-300">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-base-content-secondary hover:text-base-content hover:border-base-content-secondary'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ProjectView;