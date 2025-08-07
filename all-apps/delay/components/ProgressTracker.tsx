import React from 'react';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ClockIcon from './icons/ClockIcon';

interface ProgressStep {
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface ProgressTrackerProps {
  steps: ProgressStep[];
  overallProgress: number;
}

const getStatusIcon = (status: ProgressStep['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
    case 'in_progress':
      return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>;
    case 'pending':
    default:
      return <ClockIcon className="w-6 h-6 text-slate-500" />;
  }
};

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ steps, overallProgress }) => (
  <div className="flex flex-col items-center justify-center p-6 bg-slate-800 rounded-lg shadow-lg border border-slate-700 animate-fade-in">
    <h3 className="text-lg font-semibold text-slate-200 mb-4">Generating Report...</h3>
    
    <div className="w-full bg-slate-700 rounded-full h-2.5 mb-6">
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
        style={{ width: `${overallProgress}%` }}
      ></div>
    </div>

    <div className="w-full space-y-3">
        {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-md">
                <div className="flex-shrink-0">{getStatusIcon(step.status)}</div>
                <p className={`font-medium ${
                    step.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-200'
                }`}>
                    {step.name}
                </p>
            </div>
        ))}
    </div>
    <style>{`
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .animate-fade-in {
        animation: fade-in 0.5s ease-out forwards;
      }
    `}</style>
  </div>
);

export default ProgressTracker;