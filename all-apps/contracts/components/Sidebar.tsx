import React from 'react';
import { AppMode } from '../App';
import { Project, ProjectSummary } from '../types';
import { ChevronDownIcon, PlusCircleIcon, SaveIcon, TrashIcon } from './icons';

type AppStatus = 'idle' | 'analyzing' | 'searching' | 'saving' | 'loading' | 'deleting';

interface SidebarProps {
  appMode: AppMode;
  onModeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  isBusy: boolean;
  projects: ProjectSummary[];
  selectedProjectId: string;
  onProjectSelection: (id: string) => void;
  onDeleteProject: (project: ProjectSummary) => void;
  onCreateNewProject: () => void;
  isDirty: boolean;
  newProjectName: string;
  onNewProjectNameChange: (name: string) => void;
  onSaveProject: () => void;
  status: AppStatus;
  currentProject: Project | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  appMode,
  onModeChange,
  isBusy,
  projects,
  selectedProjectId,
  onProjectSelection,
  onDeleteProject,
  onCreateNewProject,
  isDirty,
  newProjectName,
  onNewProjectNameChange,
  onSaveProject,
  status,
  currentProject
}) => {
    
    const isSaveDisabled = !isDirty || status === 'saving' || (selectedProjectId === 'new' && !newProjectName.trim());

    return (
        <aside className="w-96 bg-slate-800 flex flex-col p-6 space-y-8 overflow-y-auto border-r border-slate-700">
            {/* Functionality Selection */}
            <div>
                <label htmlFor="app-mode-select" className="block text-sm font-medium text-gray-300 mb-2">Select Functionality</label>
                <div className="relative">
                    <select
                        id="app-mode-select"
                        value={appMode}
                        onChange={onModeChange}
                        disabled={isBusy}
                        className="appearance-none w-full bg-slate-700 border border-slate-600 text-white py-2.5 pl-4 pr-10 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="analysis">Contract Analysis</option>
                        <option value="search">Semantic Search</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                        <ChevronDownIcon className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Project Loading */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Load Project</label>
                <div className="bg-slate-900/70 p-2 rounded-md max-h-48 overflow-y-auto border border-slate-700">
                    {projects.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center italic py-2">No projects saved yet.</p>
                    ) : (
                        <ul className="space-y-1">
                            {projects.map(p => (
                                <li key={p.id} className={`group flex items-center justify-between rounded-md cursor-pointer transition-colors ${selectedProjectId === p.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'}`}>
                                    <span onClick={() => onProjectSelection(p.id)} className="truncate flex-grow p-2" title={p.name}>
                                        {p.name}
                                    </span>
                                    <button onClick={() => onDeleteProject(p)} disabled={isBusy} className="ml-2 p-1 rounded-md hover:bg-red-500/80 text-gray-400 hover:text-white transition-colors opacity-50 group-hover:opacity-100 focus:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            
            {/* New Project Input & Button */}
            <div className="space-y-4">
                 {selectedProjectId === 'new' && (
                    <div>
                        <label htmlFor="new-project-name" className="block text-sm font-medium text-gray-300 mb-2">New Project Name</label>
                        <input
                            id="new-project-name"
                            type="text"
                            value={newProjectName}
                            onChange={(e) => onNewProjectNameChange(e.target.value)}
                            placeholder="e.g., Downtown Tower Phase 2"
                            className="w-full bg-slate-700 border border-slate-600 text-white py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                    </div>
                )}
                <button
                    onClick={() => {
                        if (selectedProjectId !== 'new') {
                            onCreateNewProject();
                        }
                    }}
                    disabled={isBusy}
                    className={`flex items-center justify-center gap-2 w-full text-white font-bold py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${selectedProjectId === 'new' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    Create New Project
                </button>
            </div>
            
            {/* Save Project Button */}
            <div className="pt-4 mt-auto border-t border-slate-700">
                 <button
                    onClick={onSaveProject}
                    disabled={isSaveDisabled}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-slate-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 ease-in-out shadow-md"
                >
                    <SaveIcon className="w-5 h-5"/>
                    {status === 'saving' ? 'Saving...' : (currentProject?.id ? 'Save Project' : 'Save New Project')}
                </button>
            </div>
        </aside>
    );
};