import React from 'react';
import { Project } from '../../types';
import { ExclamationTriangleIcon, ArrowTopRightOnSquareIcon } from '../Icons';
import { APP_URLS } from '../../constants';

interface DelayAnalysisTabProps {
  project: Project;
}

const DelayAnalysisTab: React.FC<DelayAnalysisTabProps> = ({ project }) => {
  return (
    <div className="space-y-8 animate-slide-in-up">
      <div className="bg-base-100 p-6 rounded-lg shadow-lg border border-base-300">
        <h3 className="text-xl font-bold text-base-content mb-4 flex items-center">
          <ExclamationTriangleIcon className="w-6 h-6 mr-2 text-brand-primary" />
          Analyze Delays
        </h3>
        <p className="text-base-content-secondary mb-4">
          Logging project delays and performing AI-powered root cause analysis is managed in the dedicated Delay Analysis application.
        </p>
        <a 
          href={APP_URLS.delayAnalysis} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-2 rounded-md text-white bg-brand-primary hover:bg-opacity-90 transition-colors"
        >
          Open in Delay Analysis App
          <ArrowTopRightOnSquareIcon className="w-5 h-5 ml-2" />
        </a>
      </div>

      <div className="text-center py-16 bg-base-100 rounded-lg border-2 border-dashed border-base-300">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-base-content-secondary" />
        <h3 className="mt-2 text-lg font-medium text-base-content">No Delay Data Available</h3>
        <p className="mt-1 text-sm text-base-content-secondary">This project originated from the Scheduler app. Delay analysis is managed separately.</p>
      </div>
    </div>
  );
};

export default DelayAnalysisTab;
