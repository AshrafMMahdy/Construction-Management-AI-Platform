import React from 'react';
import { Project, AnalysisResult } from '../../types';
import { 
  DocumentTextIcon, 
  ArrowTopRightOnSquareIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  PencilSquareIcon,
  ExclamationTriangleIcon 
} from '../Icons';
import { APP_URLS } from '../../constants';

interface ContractsTabProps {
  project: Project;
}

const StatusBadge: React.FC<{ status: AnalysisResult['status'] }> = ({ status }) => {
  const statusConfig = {
    'Accepted': {
      icon: <CheckCircleIcon className="w-4 h-4 mr-1.5" />,
      color: 'text-green-400',
      text: 'Accepted',
    },
    'Rejected': {
      icon: <XCircleIcon className="w-4 h-4 mr-1.5" />,
      color: 'text-red-400',
      text: 'Rejected',
    },
    'Acceptable subject to modification': {
      icon: <PencilSquareIcon className="w-4 h-4 mr-1.5" />,
      color: 'text-yellow-400',
      text: 'Modify',
    },
    'Requires Review (Inferred)': {
      icon: <ExclamationTriangleIcon className="w-4 h-4 mr-1.5" />,
      color: 'text-orange-400',
      text: 'Review',
    },
  };

  const config = statusConfig[status];

  if (!config) return null;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${config.color} bg-opacity-10 bg-current`}>
      {config.icon}
      {config.text}
    </span>
  );
};

const ContractsTab: React.FC<ContractsTabProps> = ({ project }) => {
  const hasContractData = project.analysisResults && project.analysisResults.length > 0;

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

      {hasContractData ? (
        <div className="bg-base-100 rounded-lg shadow-lg border border-base-300">
          <h3 className="text-xl font-bold text-base-content p-6 flex items-center">
            AI Contract Analysis Results
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-base-content">
              <thead className="bg-base-300 text-xs text-base-content-secondary uppercase">
                <tr>
                  <th scope="col" className="px-6 py-3 w-24">Clause #</th>
                  <th scope="col" className="px-6 py-3 w-40">Status</th>
                  <th scope="col" className="px-6 py-3">Clause Text</th>
                  <th scope="col" className="px-6 py-3">Justification</th>
                </tr>
              </thead>
              <tbody>
                {project.analysisResults!.map((result, index) => (
                  <tr key={index} className="border-b border-base-300 hover:bg-base-200/50">
                    <td className="px-6 py-4 font-medium align-top">{result.contract_clause_index}</td>
                    <td className="px-6 py-4 align-top">
                      <StatusBadge status={result.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-pre-wrap align-top">{result.contract_clause_text}</td>
                    <td className="px-6 py-4 whitespace-pre-wrap align-top text-base-content-secondary">{result.justification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-base-100 rounded-lg border-2 border-dashed border-base-300">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-base-content-secondary" />
          <h3 className="mt-2 text-lg font-medium text-base-content">No Contract Data Available</h3>
          <p className="mt-1 text-sm text-base-content-secondary">This project has no contract analysis results. Analyze a contract in the Contracts app to see data here.</p>
        </div>
      )}
    </div>
  );
};

export default ContractsTab;
