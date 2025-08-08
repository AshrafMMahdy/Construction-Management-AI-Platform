import React, { useState } from 'react';
import { SchedulerProject } from '../types';
import { 
    FolderIcon, ArrowTopRightOnSquareIcon, ChartBarIcon, DocumentTextIcon, ExclamationTriangleIcon,
    ChevronDownIcon, DatabaseIcon, LogoutIcon
} from './Icons';
import { APP_URLS } from '../constants';

interface SidebarProps {
  projects: SchedulerProject[];
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onSignOut: () => void;
}

const connectedApps = [
  { name: 'Baseline Scheduler', url: APP_URLS.baselineScheduler, icon: <ChartBarIcon className="w-5 h-5 mr-3 flex-shrink-0" /> },
  { name: 'Contracts Analysis', url: APP_URLS.contractsAnalysis, icon: <DocumentTextIcon className="w-5 h-5 mr-3 flex-shrink-0" /> },
  { name: 'Delay Analysis', url: APP_URLS.delayAnalysis, icon: <ExclamationTriangleIcon className="w-5 h-5 mr-3 flex-shrink-0" /> },
];

const Sidebar: React.FC<SidebarProps> = ({ projects, selectedProjectId, onSelectProject, onSignOut }) => {
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);

  return (
    <div className="w-72 bg-base-100 border-r border-base-300 flex flex-col h-full">
      <div className="p-4 border-b border-base-300 cursor-pointer" onClick={() => onSelectProject(null)}>
        <h1 className="text-2xl font-bold text-brand-primary">AI Platform Hub</h1>
        <p className="text-sm text-base-content-secondary">Central Project Database</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <button 
            onClick={() => setIsProjectsOpen(!isProjectsOpen)}
            className="w-full flex justify-between items-center text-xs font-bold uppercase text-base-content-secondary mb-2 hover:text-base-content"
          >
            <span>Projects</span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${isProjectsOpen ? 'rotate-180' : ''}`} />
          </button>
          {isProjectsOpen && (
            <ul className="space-y-1 animate-fade-in">
              {projects.length > 0 ? (
                projects.map(project => (
                    <li key={project.id}>
                    <button
                        onClick={() => onSelectProject(project.id)}
                        className={`w-full text-left flex items-center p-2 rounded-md transition-colors duration-200 ${
                        selectedProjectId === project.id 
                        ? 'bg-brand-primary text-white font-semibold' 
                        : 'text-base-content hover:bg-base-300'
                        }`}
                    >
                        <FolderIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="truncate font-medium">{project.name}</span>
                    </button>
                    </li>
                ))
              ) : (
                <li className="p-2 text-sm text-base-content-secondary">No projects found.</li>
              )}
            </ul>
          )}
        </div>

        <div>
           <h2 className="text-xs font-bold uppercase text-base-content-secondary mb-2">Connected Apps</h2>
           <ul className="space-y-1">
            {connectedApps.map(app => (
              <li key={app.name}>
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-left flex items-center p-2 rounded-md transition-colors duration-200 text-base-content hover:bg-base-300"
                >
                  {app.icon}
                  <span className="truncate font-medium flex-1">{app.name}</span>
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 text-base-content-secondary" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="p-4 border-t border-base-300 space-y-2">
        <a
          href="https://database-ochre-seven.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full text-left flex items-center p-2 rounded-md transition-colors duration-200 text-base-content hover:bg-base-300 font-medium"
        >
          <DatabaseIcon className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="flex-1">Go to Projects Database</span>
          <ArrowTopRightOnSquareIcon className="w-4 h-4 text-base-content-secondary" />
        </a>
        <button
          onClick={onSignOut}
          className="w-full text-left flex items-center p-2 rounded-md transition-colors duration-200 text-base-content hover:bg-base-300 font-medium"
        >
          <LogoutIcon className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;