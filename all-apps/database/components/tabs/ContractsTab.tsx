import React from 'react';
import { Project, AnalysisResult } from '../../types';
import { DocumentTextIcon, ArrowTopRightOnSquareIcon, CheckCircleIcon, XCircleIcon, PencilSquareIcon, QuestionMarkCircleIcon } from '../Icons';
import { APP_URLS } from '../../constants';

interface ContractsTabProps {
  project: Project;
}

const StatusPill: React.FC<{ status: AnalysisResult['status'] }> = ({ status }) => {
  const statusConfig = {
    'Accepted': {
      icon: <CheckCircleIcon className="w-5 h-5 mr-2" />,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    'Rejected': {
      icon: <XCircleIcon className="w-5 h-5 mr-2" />,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    'Acceptable subject to modification': {
      icon: <PencilSquareIcon className="w-5 h-5 mr-2" />,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    'Requires Review (Inferred)': {
      icon: <QuestionMarkCircleIcon className="w-5 h-5 mr-2" />,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.color}`}>
      {config.icon}
      {status}
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
        <div className="space-y-8">
          {project.contractFile && (
            <div className="bg-base-100 p-6 rounded-lg shadow-lg border border-base-300">
              <h3 className="text-xl font-bold text-base-content mb-2">Contract Document</h3>
              <p className="text-base-content-secondary">
                <span className="font-semibold text-base-content">File Name:</span> {project.contractFile.name}
              </p>
            </div>
          )}
          
          <div className="bg-base-100 rounded-lg shadow-lg border border-base-300">
            <h3 className="text-xl font-bold text-base-content p-6">
              AI Analysis Results
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-base-content">
                <thead className="bg-base-300 text-xs text-base-content-secondary uppercase">
                  <tr>
                    <th scope="col" className="px-6 py-3 w-1/4">Status</th>
                    <th scope="col" className="px-6 py-3 w-3/4">Clause & Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-300">
                  {project.analysisResults?.map((result, index) => (
                    <tr key={index} className="hover:bg-base-200/50">
                      <td className="px-6 py-4 align-top">
                        <StatusPill status={result.status} />
                      </td>
      
                      <td className="px-6 py-4">
                        <p className="font-mono text-xs text-base-content-secondary bg-base-200 p-3 rounded-md border border-base-300">
                          {result.contract_clause_text}
                        </p>
                        <p className="mt-3 text-base-content">{result.justification}</p>
                        {result.portion_to_modify && (
                          <div className="mt-3 text-sm bg-base-200 p-3 rounded-md border border-amber-500/30">
                            <span className="font-semibold text-amber-400">Modification Suggested: </span>
                            <span className="font-mono text-amber-400">{result.portion_to_modify}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-base-100 rounded-lg border-2 border-dashed border-base-300">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-base-content-secondary" />
          <h3 className="mt-2 text-lg font-medium text-base-content">No Contract Data Available</h3>
          <p className="mt-1 text-sm text-base-content-secondary">This project does not contain contract analysis results. Analyze a contract in the Contracts App to see data here.</p>
        </div>
      )}
    </div>
  );
};

export default ContractsTab;
