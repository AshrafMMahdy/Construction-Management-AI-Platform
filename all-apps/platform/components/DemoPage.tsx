
import React from 'react';
import { ChevronLeftIcon } from './icons/Icons';
import type { Project } from '../types';

interface DemoPageProps {
  onGoBack: () => void;
  title: string;
  project?: Project;
}

const DemoPage: React.FC<DemoPageProps> = ({ onGoBack, title, project }) => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
       <button
        onClick={onGoBack}
        className="flex items-center text-sm font-medium text-brand-secondary hover:text-brand-primary mb-6 group"
        aria-label="Back to Dashboard"
      >
        <ChevronLeftIcon className="h-5 w-5 mr-1 transition-transform group-hover:-translate-x-1" />
        Back to Dashboard
      </button>
      <h2 className="text-3xl font-bold text-brand-dark mb-2 capitalize">{title}</h2>
      {project && <p className="text-gray-500 mb-4">Project: <span className="font-semibold text-brand-dark">{project.name}</span></p>}
      <div className="text-gray-600 space-y-4">
        <p>This is a placeholder page for the <span className="font-semibold">{title}</span> section.</p>
        <p>Full functionality, including AI-powered analysis and data visualization, will be implemented here to create a single, cohesive platform experience.</p>
        <div className="mt-6 p-4 border-l-4 border-brand-accent bg-yellow-50">
            <h4 className="font-bold text-yellow-800">Next Steps:</h4>
            <ul className="list-disc list-inside text-yellow-700 mt-2">
                <li>Integrate the core logic from the external apps.</li>
                <li>Connect to necessary data sources and APIs (like our new shared database).</li>
                <li>Build out the user interface for this specific module.</li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
