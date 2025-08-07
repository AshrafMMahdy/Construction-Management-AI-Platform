import React from 'react';
import { SchedulerProject } from '../../types';
import { DocumentTextIcon, ArrowTopRightOnSquareIcon } from '../Icons';
import { APP_URLS } from '../../constants';

interface ContractsTabProps {
  project: SchedulerProject;
}

const ContractsTab: React.FC<ContractsTabProps> = ({ project }) => {
  return (
    <div className="space-y-8 animate-slide-in-up">
       <div className="bg-base-100 p-6 rounded-lg shadow-lg border border-base-300">
        <h3 className="text-xl font-bold text-base-content mb-4 flex items-center">
            <DocumentTextIcon className="w-6 h-6 mr-2 text-brand-primary" />
            Manage Contracts
        </h3>
        <p className="text-base-content-secondary mb-4">
          All project contracts and AI-powered analysis are managed in the dedicated Contracts application.
        </p>
        <a 
          href={APP_URLS.contractsAnalysis} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-2 rounded-md text-white bg-brand-primary hover:bg-opacity-90 transition-colors"
        >
          Open in Contracts App
          <ArrowTopRightOnSquareIcon className="w-5 h-5 ml-2" />
        </a>
      </div>

      <div className="text-center py-16 bg-base-100 rounded-lg border-2 border-dashed border-base-300">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-base-content-secondary" />
        <h3 className="mt-2 text-lg font-medium text-base-content">No Contract Data Available</h3>
        <p className="mt-1 text-sm text-base-content-secondary">This project originated from the Scheduler app. Contract data is managed separately.</p>
      </div>
    </div>
  );
};

export default ContractsTab;