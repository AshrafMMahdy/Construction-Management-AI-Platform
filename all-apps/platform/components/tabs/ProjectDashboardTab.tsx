import React from 'react';
import { SchedulerProject } from '../../types';
import { ChartBarIcon, DocumentTextIcon, SparklesIcon } from '../Icons';

interface ProjectDashboardTabProps {
  project: SchedulerProject;
}

const ProjectDashboardTab: React.FC<ProjectDashboardTabProps> = ({ project }) => {
  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h3 className="text-xl font-bold text-base-content mb-4">Project Stats</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard icon={<ChartBarIcon />} title="Schedule Activities" value={project.generatedSchedule.length.toString()} />
          <StatCard icon={<SparklesIcon />} title="AI Agent Proposals" value={project.agentOutputs.length.toString()} />
          <StatCard icon={<DocumentTextIcon />} title="Input Features" value={Object.keys(project.projectInput.selections).length.toString()} />
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold text-base-content mb-4">Project Input Details</h3>
        <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 className="font-semibold text-base-content">Source File</h4>
                    <p className="text-base-content-secondary">{project.fileName}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-base-content">Project Start Date</h4>
                    <p className="text-base-content-secondary">{new Date(project.startDate).toLocaleDateString()}</p>
                </div>
                 <div className="md:col-span-2">
                    <h4 className="font-semibold text-base-content mb-2">Selected Features</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {Object.entries(project.projectInput.selections).map(([key, value]) => (
                        <div key={key} className="bg-base-200 p-2 rounded-md">
                            <p className="text-xs text-base-content-secondary">{key}</p>
                            <p className="font-medium text-sm text-base-content">{value}</p>
                        </div>
                    ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
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