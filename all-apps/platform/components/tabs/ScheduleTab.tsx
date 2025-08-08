import React from 'react';
import { Project } from '../../types';
import { ChartBarIcon, ArrowTopRightOnSquareIcon, SparklesIcon } from '../Icons';
import { APP_URLS } from '../../constants';

interface ScheduleTabProps {
  project: Project;
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({ project }) => {
  const hasScheduleData = (project.generatedSchedule && project.generatedSchedule.length > 0) || project.generatedNarrative;

  if (!hasScheduleData) {
    return (
      <div className="space-y-8 animate-slide-in-up">
        <div className="bg-base-100 p-6 rounded-lg shadow-lg border border-base-300">
          <h3 className="text-xl font-bold text-base-content mb-4 flex items-center">
            <ChartBarIcon className="w-6 h-6 mr-2 text-brand-primary" />
            Manage in Source Application
          </h3>
          <p className="text-base-content-secondary mb-4">
            Project scheduling is managed in the Baseline Scheduler application.
          </p>
          <a
            href={APP_URLS.baselineScheduler}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-2 rounded-md text-white bg-brand-primary hover:bg-opacity-90 transition-colors"
          >
            Open in Scheduler App
            <ArrowTopRightOnSquareIcon className="w-5 h-5 ml-2" />
          </a>
        </div>
        <div className="text-center py-16 bg-base-100 rounded-lg border-2 border-dashed border-base-300">
          <ChartBarIcon className="mx-auto h-12 w-12 text-base-content-secondary" />
          <h3 className="mt-2 text-lg font-medium text-base-content">No Schedule Data Available</h3>
          <p className="mt-1 text-sm text-base-content-secondary">This project does not contain data from the Baseline Scheduler application.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-in-up">
      <div className="bg-base-100 p-6 rounded-lg shadow-lg border border-base-300">
        <h3 className="text-xl font-bold text-base-content mb-4 flex items-center">
          <ChartBarIcon className="w-6 h-6 mr-2 text-brand-primary" />
          Manage in Source Application
        </h3>
        <p className="text-base-content-secondary mb-4">
          This project was created in the Baseline Scheduler application. To make changes, please open it there.
        </p>
        <a 
          href={APP_URLS.baselineScheduler} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-2 rounded-md text-white bg-brand-primary hover:bg-opacity-90 transition-colors"
        >
          Open in Scheduler App
          <ArrowTopRightOnSquareIcon className="w-5 h-5 ml-2" />
        </a>
      </div>

      <div className="bg-base-100 p-6 rounded-lg shadow-lg border border-base-300">
        <h3 className="text-xl font-bold text-base-content mb-4 flex items-center">
            <SparklesIcon className="w-6 h-6 mr-2 text-brand-secondary"/>
            AI Generated Narrative
        </h3>
        <p className="whitespace-pre-wrap text-base-content-secondary bg-base-200 p-4 rounded-md">{project.generatedNarrative || 'No narrative available.'}</p>
      </div>

      <div className="bg-base-100 rounded-lg shadow-lg border border-base-300">
        <h3 className="text-xl font-bold text-base-content p-6 flex items-center">
          Generated Schedule
        </h3>
        <div className="overflow-x-auto">
          {(project.generatedSchedule?.length || 0) > 0 ? (
            <table className="min-w-full text-sm text-left text-base-content">
                <thead className="bg-base-300 text-xs text-base-content-secondary uppercase">
                    <tr>
                        <th scope="col" className="px-6 py-3">ID</th>
                        <th scope="col" className="px-6 py-3">Task Name</th>
                        <th scope="col" className="px-6 py-3">Duration (Days)</th>
                        <th scope="col" className="px-6 py-3">Predecessors</th>
                    </tr>
                </thead>
                <tbody>
                    {project.generatedSchedule!.map(activity => (
                        <tr key={activity.id} className="border-b border-base-300 hover:bg-base-200/50">
                            <td className="px-6 py-4 font-medium">{activity.id}</td>
                            <td className="px-6 py-4">{activity.name}</td>
                            <td className="px-6 py-4">{activity.duration}</td>
                            <td className="px-6 py-4 font-mono">{activity.predecessors || 'None'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          ) : (
            <p className="text-center py-8 text-base-content-secondary">No schedule activities found in this project.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleTab;
