// All Apps/DashboardApp/src/components/Sidebar.tsx

import React, { useState } from 'react';
import type { Project } from '../types';
import { ScheduleIcon, ContractIcon, DelayIcon, ChevronDownIcon, PlusIcon, BuildingIcon, LogoutIcon, DashboardIcon } from './icons/Icons';

// --- (UPDATED) Centralized URLS ---
// Create this file at All Apps/DashboardApp/src/components/appUrls.ts
// This is a simple map for your app URLs.
export const APP_URLS = {
  // Assuming your dashboard runs on port 3000
  dashboard: 'http://localhost:3000',
  // Assuming your 'baseline scheduler' app runs on port 3001
  baselineScheduler: 'http://localhost:3001',
  // Assuming your 'contracts analysis' app runs on port 3002
  contractsAnalysis: 'http://localhost:3002',
  // Assuming your 'delay analysis' app runs on port 3003
  delayAnalysis: 'http://localhost:3003',
};

// --- (ORIGINAL CODE BELOW) ---

export type View = 'dashboard' | 'scheduling' | 'contracts' | 'delay';

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
                ? 'bg-brand-secondary text-white' 
                : 'text-gray-300 hover:bg-brand-secondary hover:text-white'
            }`}
        >
            {icon}
            <span className="ml-3">{children}</span>
        </button>
    );
};

interface SidebarProps {
    onLogout: () => void;
    activeView: View;
    setActiveView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, activeView, setActiveView }) => {
    const [projects] = useState<Project[]>([
        { id: 'p1', name: 'Skyline Tower' },
        { id: 'p2', name: 'Quantum Arena' },
        { id: 'p3', name: 'Innovatech Campus' },
    ]);
    const [selectedProject, setSelectedProject] = useState<Project>(projects[0]);

    return (
        <aside className="w-64 flex flex-col bg-brand-primary text-white p-4">
            <div className="flex items-center mb-6 px-2">
                <BuildingIcon className="h-8 w-8 text-brand-accent"/>
                <h1 className="ml-2 text-2xl font-bold">ConstructAI</h1>
            </div>

            {/* Project Selector */}
            <div className="mb-8">
                <label htmlFor="project-select" className="text-xs text-gray-400 font-semibold uppercase px-4 mb-2 block">Current Project</label>
                <div className="relative">
                    <select
                        id="project-select"
                        value={selectedProject.id}
                        onChange={(e) => setSelectedProject(projects.find(p => p.id === e.target.value) || projects[0])}
                        className="w-full pl-3 pr-10 py-2 text-white bg-brand-secondary border border-transparent rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    >
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                    </select>
                    <ChevronDownIcon className="h-5 w-5 text-gray-300 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button className="w-full mt-2 flex items-center justify-center py-2 px-4 text-sm font-medium bg-white/10 hover:bg-white/20 rounded-md transition-colors duration-200">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Project
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col space-y-2">
                 <NavLink
                    icon={<DashboardIcon className={`h-5 w-5 transition-colors ${activeView === 'dashboard' ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />}
                    isActive={activeView === 'dashboard'}
                    onClick={() => setActiveView('dashboard')}
                >
                    Dashboard
                </NavLink>

                <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase">Analysis</p>
                {/* --- (UPDATED LINK) --- */}
                {/* Replaced the NavLink component with an anchor tag for external navigation */}
                <a 
                    href={APP_URLS.baselineScheduler}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 group text-gray-300 hover:bg-brand-secondary hover:text-white"
                >
                    <ScheduleIcon className="h-5 w-5 transition-colors text-gray-400 group-hover:text-white" />
                    <span className="ml-3">Scheduling</span>
                </a>
                {/* ---------------------- */}
                {/* --- (UPDATED LINK) --- */}
                {/* Replaced the NavLink component with an anchor tag for external navigation */}
                <a 
                    href={APP_URLS.contractsAnalysis}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 group text-gray-300 hover:bg-brand-secondary hover:text-white"
                >
                    <ContractIcon className="h-5 w-5 transition-colors text-gray-400 group-hover:text-white" />
                    <span className="ml-3">Contracts Analysis</span>
                </a>
                {/* ---------------------- */}
                {/* --- (UPDATED LINK) --- */}
                {/* Replaced the NavLink component with an anchor tag for external navigation */}
                <a 
                    href={APP_URLS.delayAnalysis}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 group text-gray-300 hover:bg-brand-secondary hover:text-white"
                >
                    <DelayIcon className="h-5 w-5 transition-colors text-gray-400 group-hover:text-white" />
                    <span className="ml-3">Delay Analysis</span>
                </a>
                {/* ---------------------- */}
            </nav>
            
            <div className="mt-auto">
                <button 
                    onClick={onLogout}
                    className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-gray-300 rounded-lg hover:bg-brand-secondary hover:text-white transition-colors duration-200 group"
                >
                    <LogoutIcon className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                    <span className="ml-3">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
