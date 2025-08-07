
import React from 'react';
import type { ProgressStep } from '../App';
import { CheckCircleIcon, SpinnerIcon, CircleIcon } from './ProgressIcons';

interface AnalysisProgressProps {
  steps: ProgressStep[];
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ steps }) => {
  const doneCount = steps.filter(s => s.status === 'done').length;
  const overallProgressPercentage = steps.length > 0 ? (doneCount / steps.length) * 100 : 0;

  const getIcon = (status: ProgressStep['status']) => {
    switch (status) {
      case 'in-progress':
        return <SpinnerIcon className="h-6 w-6 text-blue-400" />;
      case 'done':
        return <CheckCircleIcon className="h-6 w-6 text-green-400" />;
      case 'pending':
      default:
        return <CircleIcon className="h-6 w-6 text-slate-500" />;
    }
  };

  return (
    <div className="p-8 bg-slate-800 rounded-lg shadow-xl space-y-6">
      <h3 className="text-xl font-semibold text-gray-100 text-center">Analysis in Progress...</h3>
      
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-base font-medium text-gray-300">Overall Progress</span>
          <span className="text-sm font-medium text-gray-300">{doneCount} of {steps.length} steps completed</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${overallProgressPercentage}%` }}>
          </div>
        </div>
      </div>

      <ul className="space-y-6 pt-2">
        {steps.map((step, index) => (
          <li key={index} className="space-y-2.5">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {getIcon(step.status)}
              </div>
              <p className={`font-medium transition-colors duration-300 ${
                  step.status === 'in-progress' ? 'text-white' : 
                  step.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-500'
              }`}>
                {step.name}
              </p>
            </div>
            <div className="ml-10">
              <div className="w-full bg-slate-700/80 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-200 ease-linear ${step.status === 'done' ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${step.progress || 0}%` }}
                ></div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
