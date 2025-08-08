
import React from 'react';
import type { Project } from '../types';
import { ScheduleIcon, ContractIcon, DelayIcon, ChevronDownIcon, PlusIcon, BuildingIcon, LogoutIcon, DashboardIcon, ExternalLinkIcon } from './icons/Icons';

export type View = 'dashboard';

const APP_URLS = {
  baselineScheduler: 'https://aischeduler-5cky0nenj-construction-managements-projects.vercel.app/',
  contractsAnalysis: 'https://aicontracts-sandy.vercel.app',
  delayAnalysis: 'https://aidelay.vercel.app',
  projectsDatabase: 'https://database-mfqr47lwo-construction-managements-projects.vercel.app/'
};

interface NavLinkProps {
    icon: React.ReactNode; 
    children: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ icon, children, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 group ${
                isActive 
                ? 'bg-brand-active text-white' 
                : 'text-brand-text-medium hover:bg-brand-active hover:text-white'
            }`}
        >
            {icon}
            <span className="ml-3">{children}</span>
        </button>
    );
};

interface ExternalNavLinkProps {
    icon: React.ReactNode; 
    children: React.ReactNode;
    href: string;
}

const ExternalNavLink: React.FC<ExternalNavLinkProps> = ({ icon, children, href }) => {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg text-brand-text-medium hover:bg-brand-active hover:text-white group transition-colors duration-200"
        >
            {icon}
            <span className="ml-3 flex-1">{children}</span>
            <ExternalLinkIcon className="h-4 w-4 text-brand-text-medium/50 group-hover:text-white" />
        </a>
    );
};


interface SidebarProps {
    onLogout: () => void;
    activeView: View;
    setActiveView: (view: View) => void;
    projects: Project[];
    selectedProject?: Project;
    onProjectChange: (project: Project) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, activeView, setActiveView, projects, selectedProject, onProjectChange }) => {

    const handleProjectSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const project = projects.find(p => p.id === e.target.value);
        if (project) {
            onProjectChange(project);
            setActiveView('dashboard');
        }
    };

    return (
        <aside className="w-72 flex flex-col bg-brand-secondary text-brand-text-light p-4 border-r border-brand-border">
            <div className="flex items-center mb-6 px-2">
                <BuildingIcon className="h-8 w-8 text-brand-accent"/>
                <h1 className="ml-2 text-2xl font-bold">ConstructAI</h1>
            </div>

            {/* Project Selector */}
            <div className="mb-8 px-2 space-y-2">
                <label htmlFor="project-select" className="text-xs text-brand-text-medium font-semibold uppercase mb-1 block">Current Project</label>
                <div className="relative">
                    <select
                        id="project-select"
                        value={selectedProject?.id || ''}
                        onChange={handleProjectSelection}
                        disabled={projects.length === 0}
                        className="w-full pl-3 pr-10 py-2 text-brand-text-light bg-brand-primary border border-brand-border rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:bg-brand-secondary/50 disabled:cursor-not-allowed"
                    >
                       {projects.length === 0 ? (
                            <option value="" disabled>No projects available</option>
                        ) : (
                            projects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))
                        )}
                    </select>
                    <ChevronDownIcon className="h-5 w-5 text-brand-text-medium absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                 <a 
                    href={APP_URLS.projectsDatabase}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center py-2 px-4 text-sm font-medium border border-brand-border text-brand-text-medium hover:bg-brand-border hover:text-brand-text-light rounded-md transition-colors duration-200 group"
                >
                    <ExternalLinkIcon className="h-4 w-4 mr-2" />
                    Go to Projects Database
                </a>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col space-y-1 px-2">
                 <NavLink
                    icon={<DashboardIcon className={`h-5 w-5 transition-colors ${activeView === 'dashboard' ? 'text-white' : 'text-brand-text-medium group-hover:text-white'}`} />}
                    isActive={activeView === 'dashboard'}
                    onClick={() => setActiveView('dashboard')}
                >
                    Dashboard
                </NavLink>

                <p className="px-2 pt-4 pb-2 text-xs font-semibold text-brand-text-medium uppercase">Analysis Modules</p>
                <ExternalNavLink
                    icon={<ScheduleIcon className="h-5 w-5 text-brand-text-medium group-hover:text-white" />}
                    href={APP_URLS.baselineScheduler}
                >
                    Scheduling
                </ExternalNavLink>
                <ExternalNavLink
                    icon={<ContractIcon className="h-5 w-5 text-brand-text-medium group-hover:text-white" />}
                    href={APP_URLS.contractsAnalysis}
                >
                    Contracts Analysis
                </ExternalNavLink>
                <ExternalNavLink
                    icon={<DelayIcon className="h-5 w-5 text-brand-text-medium group-hover:text-white" />}
                    href={APP_URLS.delayAnalysis}
                >
                    Delay Analysis
                </ExternalNavLink>
            </nav>
            
            <div className="mt-auto px-2">
                <button 
                    onClick={onLogout}
                    className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-brand-text-medium rounded-lg hover:bg-brand-active hover:text-white transition-colors duration-200 group"
                >
                    <LogoutIcon className="h-5 w-5 text-brand-text-medium group-hover:text-white transition-colors" />
                    <span className="ml-3">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;