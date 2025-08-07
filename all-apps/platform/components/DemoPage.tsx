import React from 'react';
import { ChevronLeftIcon } from './icons/Icons';

interface DemoPageProps {
  onGoBack: () => void;
  title: string;
}

const DemoPage: React.FC<DemoPageProps> = ({ onGoBack, title }) => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
       <button
        onClick={onGoBack}
        className="flex items-center text-sm font-medium text-brand-secondary hover:text-brand-primary mb-6 group"
      >
        <ChevronLeftIcon className="h-5 w-5 mr-1 transition-transform group-hover:-translate-x-1" />
        Back to Dashboard
      </button>
      <h2 className="text-3xl font-bold text-brand-dark mb-4 capitalize">{title}</h2>
      <p className="text-gray-600">This is a demo page for the <span className="font-semibold">{title}</span> section. Full functionality will be implemented here.</p>
    </div>
  );
};

export default DemoPage;