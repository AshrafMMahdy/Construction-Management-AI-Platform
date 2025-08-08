import React from 'react';
import { Project } from '../types';
import { FolderIcon, ChartBarIcon, DocumentTextIcon, ExclamationTriangleIcon } from './Icons';

interface DashboardViewProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
}

const getProjectDescription = (project: Project): string => {
    if (project.projectInput?.description) return project.projectInput.description;
    if (project.report) return "Delay Analysis Report";
    if (project.analysisResults?.length) return "Contract Analysis Project";
    if (project.generatedSchedule?.length) return "Baseline Schedule Project";
    return "Project data synced from source";
};

const DashboardView: React.FC<DashboardViewProps> = ({ projects, onSelectProject }) => {
  const totalProjects = projects.length;
  const totalSchedules = projects.filter(p => p.generatedSchedule && p.generatedSchedule.length > 0).length;
  const totalContracts = projects.filter(p => p.contractFile || (p.analysisResults && p.analysisResults.length > 0)).length;
  const totalAnalyses = projects.filter(p => p.report).length;

  return (
    <div className="animate-fade-in">
      <h1 className="text-4xl font-bold text-base-content mb-2">Platform Overview</h1>
      <p className="text-lg text-base-content-secondary mb-8">A high-level summary of all active projects synced from Vercel Blob.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard icon={<FolderIcon />} title="Total Projects" value={totalProjects.toString()} />
        <StatCard icon={<ChartBarIcon />} title="Schedules" value={totalSchedules.toString()} />
        <StatCard icon={<DocumentTextIcon />} title="Contracts" value={totalContracts.toString()} />
        <StatCard icon={<ExclamationTriangleIcon />} title="Delay Analyses" value={totalAnalyses.toString()} />
      </div>

      <h2 className="text-2xl font-bold text-base-content mb-4">Project Directory</h2>
      {projects.length > 0 ? (
        <div className="bg-base-100 rounded-lg shadow-lg border border-base-300">
          <ul className="divide-y divide-base-300">
            {projects.map(project => (
              <li key={project.id} className="p-4 hover:bg-base-300 transition-colors duration-200 cursor-pointer" onClick={() => onSelectProject(project.id)}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-brand-secondary text-lg">{project.name}</h3>
                    <p className="text-sm text-base-content-secondary">{getProjectDescription(project)}</p>
                  </div>
                  <div className="text-sm text-base-content-secondary">
                    Created on {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-16 bg-base-100 rounded-lg border-2 border-dashed border-base-300">
          <FolderIcon className="mx-auto h-12 w-12 text-base-content-secondary" />
          <h3 className="mt-2 text-lg font-medium text-base-content">No projects found</h3>
          <p className="mt-1 text-sm text-base-content-secondary">Projects managed in other applications will appear here once they are synced from the `projects/` directory in Vercel Blob.</p>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactElement<{ className?: string }>, title: string, value: string }> = ({ icon, title, value }) => (
    <div className="bg-base-100 p-6 rounded-lg shadow-lg border border-base-300 flex items-center space-x-4">
        <div className="bg-brand-primary/20 text-brand-secondary p-3 rounded-full">
            {React.cloneElement(icon, { className: 'w-7 h-7' })}
        </div>
        <div>
            <p className="text-sm font-medium text-base-content-secondary">{title}</p>
            <p className="text-3xl font-bold text-base-content">{value}</p>
        </div>
    </div>
);

export default DashboardView;
