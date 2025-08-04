import React from 'react';
import Spinner from './Spinner';
import { CheckIcon, CircleIcon } from './IconComponents';
import { AgentOutput, ProgressStep } from '../types';
import EvaluationTable from './EvaluationTable';

interface ProgressDisplayProps {
  steps: ProgressStep[];
  agentOutputs: AgentOutput[] | null;
  title: string;
}

const StepIcon: React.FC<{ status: ProgressStep['status'] }> = ({ status }) => {
  switch (status) {
    case 'running':
      return <Spinner />;
    case 'completed':
      return <CheckIcon className="w-6 h-6 text-green-400" />;
    case 'failed':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'pending':
    default:
      return <CircleIcon className="w-6 h-6 text-brand-muted" />;
  }
};

const ProgressDisplay: React.FC<ProgressDisplayProps> = ({ steps, agentOutputs, title }) => {
  const completedSteps = steps.filter(s => s.status === 'completed' || s.status === 'failed').length;
  const totalSteps = steps.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center text-center bg-brand-secondary rounded-xl shadow-2xl p-6 md:p-10 min-h-[400px]">
        <h2 className="text-2xl font-bold text-brand-light">{title}</h2>
        <div className="w-full max-w-md my-4">
          <div className="flex justify-between mb-1">
            <span className="text-base font-medium text-brand-accent">Overall Progress</span>
            <span className="text-sm font-medium text-brand-accent">{completedSteps} of {totalSteps} steps completed</span>
          </div>
          <div className="w-full bg-brand-primary rounded-full h-2.5">
            <div className="bg-brand-accent h-2.5 rounded-full" style={{ width: `${progressPercentage}%`, transition: 'width 0.5s ease-in-out' }}></div>
          </div>
        </div>
      
        <div className="w-full max-w-lg mt-6 space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-4 p-2 bg-brand-secondary/50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                 <StepIcon status={step.status} />
              </div>
              <p className={`text-left text-brand-light ${step.status === 'completed' ? 'line-through text-brand-muted' : ''} ${step.status === 'failed' ? 'text-red-400 font-semibold' : ''}`}>
                {step.name}
              </p>
            </div>
          ))}
        </div>
        
        {agentOutputs && (
          <div className="w-full mt-8">
            <h3 className="text-lg font-bold text-brand-accent mb-2">Agent Performance Evaluation</h3>
            <EvaluationTable agentOutputs={agentOutputs} />
          </div>
        )}
    </div>
  );
};

export default ProgressDisplay;
