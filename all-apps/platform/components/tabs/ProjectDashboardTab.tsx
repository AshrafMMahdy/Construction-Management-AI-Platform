import React from 'react';
import { Project } from '../../types';
import { ChartBarIcon, DocumentTextIcon, SparklesIcon, DatabaseIcon } from '../Icons';

interface ProjectDashboardTabProps {
  project: Project;
}

const ProjectDashboardTab: React.FC<ProjectDashboardTabProps> = ({ project }) => {
  const hasSchedulerData = !!project.projectInput;
  const hasContractsData = !!project.contractFile || !!project.analysisResults?.length;

  return (
    <div className="animate-fade-in space-y-8">
      {hasSchedulerData && (
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-bold text-base-content mb-4">Scheduler Project Stats</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard icon={<ChartBarIcon />} title="Schedule Activities" value={(project.generatedSchedule || []).length.toString()} />
              <StatCard icon={<SparklesIcon />} title="AI Agent Proposals" value={(project.agentOutputs || []).length.toString()} />
              <StatCard icon={<DocumentTextIcon />} title="Input Features" value={Object.keys(project.projectInput?.selections || {}).length.toString()} />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-base-content mb-4">Scheduler Input Details</h3>
            <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-semibold text-base-content">Source Data File</h4>
                        <p className="text-base-content-secondary">{project.fileName || 'N/A'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-base-content">Project Start Date</h4>
                        <p className="text-base-content-secondary">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                        <h4 className="font-semibold text-base-content mb-2">Selected Features</h4>
                        {Object.keys(project.projectInput?.selections || {}).length > 0 ? (
                           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {Object.entries(project.projectInput?.selections || {}).map(([key, value]) => (
                                <div key={key} className="bg-base-200 p-2 rounded-md">
                                    <p className="text-xs text-base-content-secondary">{key}</p>
                                    <p className="font-medium text-sm text-base-content">{value}</p>
                                </div>
                            ))}
                            </div>
                        ) : <p className="text-sm text-base-content-secondary">No features selected.</p>}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {hasContractsData && (
        <div className="space-y-8 pt-8 mt-8 border-t border-base-300">
            <div>
              <h3 className="text-xl font-bold text-base-content mb-4">Contracts Project Stats</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard icon={<DocumentTextIcon />} title="Analyzed Clauses" value={(project.analysisResults || []).length.toString()} />
                <StatCard icon={<SparklesIcon />} title="AI Search Active" value={project.searchQuery ? 'Yes' : 'No'} />
                <StatCard icon={<DatabaseIcon />} title="Clause Database" value={project.fileName || 'Not Used'} />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-base-content mb-4">Contract Details</h3>
              <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-base-content">Contract File</h4>
                      <p className="text-base-content-secondary truncate">{project.contractFile?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-base-content">AI Search Query</h4>
                      <p className="text-base-content-secondary truncate">{project.searchQuery || 'Not available'}</p>
                    </div>
                </div>
              </div>
            </div>
        </div>
      )}

      {!hasSchedulerData && !hasContractsData && (
         <div className="text-center py-16 bg-base-100 rounded-lg border-2 border-dashed border-base-300">
            <SparklesIcon className="mx-auto h-12 w-12 text-base-content-secondary" />
            <h3 className="mt-2 text-lg font-medium text-base-content">No data to display</h3>
            <p className="mt-1 text-sm text-base-content-secondary">This project does not have details from any connected app.</p>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactElement<{ className?: string }>, title: string, value: string }> = ({ icon, title, value }) => (
    <div className="bg-base-100 p-6 rounded-lg shadow-md border border-base-300 flex items-center space-x-4">
        <div className="bg-brand-primary/20 text-brand-primary p-3 rounded-full">
            {React.cloneElement(icon, { className: 'w-6 h-6' })}
        </div>
        <div>
            <p className="text-sm font-medium text-base-content-secondary">{title}</p>
            <p className="text-2xl font-bold text-base-content">{value}</p>
        </div>
    </div>
);


export default ProjectDashboardTab;
