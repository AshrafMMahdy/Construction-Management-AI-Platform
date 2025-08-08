import React from 'react';
import { Project } from '../../types';
import { ExclamationTriangleIcon, ArrowTopRightOnSquareIcon, DocumentTextIcon, SparklesIcon } from '../Icons';
import { APP_URLS } from '../../constants';

interface DelayAnalysisTabProps {
  project: Project;
}

const InfoCard: React.FC<{ title: string, children: React.ReactNode, className?: string }> = ({ title, children, className }) => (
  <div className={`bg-base-100 p-6 rounded-lg shadow-lg border border-base-300 ${className}`}>
    <h3 className="text-xl font-bold text-base-content mb-3 flex items-center">
        <SparklesIcon className="w-6 h-6 mr-3 text-brand-secondary" />
        {title}
    </h3>
    <div className="text-base-content-secondary space-y-2 prose prose-invert prose-sm max-w-none">
      {children}
    </div>
  </div>
);

const DelayAnalysisTab: React.FC<DelayAnalysisTabProps> = ({ project }) => {
  const hasDelayData = project.report;

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

      {hasDelayData ? (
        <div className="space-y-8">
          <InfoCard title="Executive Summary">
            <p>{project.report.executiveSummary}</p>
          </InfoCard>

           <div className="bg-base-100 rounded-lg shadow-lg border border-base-300">
                <h3 className="text-xl font-bold text-base-content p-6 flex items-center">
                  <ExclamationTriangleIcon className="w-6 h-6 mr-3 text-yellow-400" />
                  {project.report.delayAnalysis.title}
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-base-content">
                        <thead className="bg-base-300 text-xs text-base-content-secondary uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-3">Activity</th>
                                <th scope="col" className="px-6 py-3">Planned Start</th>
                                <th scope="col" className="px-6 py-3">Planned End</th>
                                <th scope="col" className="px-6 py-3">Actual Start</th>
                                <th scope="col" className="px-6 py-3">Actual End</th>
                                <th scope="col" className="px-6 py-3">Delay (Days)</th>
                                <th scope="col" className="px-6 py-3">Impact</th>
                            </tr>
                        </thead>
                        <tbody>
                            {project.report.delayAnalysis.findings.map((finding, index) => (
                                <tr key={index} className="border-b border-base-300 hover:bg-base-200/50">
                                    <td className="px-6 py-4 font-medium">{finding.activity}</td>
                                    <td className="px-6 py-4">{new Date(finding.plannedStart).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{new Date(finding.plannedEnd).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{new Date(finding.actualStart).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{new Date(finding.actualEnd).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-semibold text-red-400">{finding.delayDays}</td>
                                    <td className="px-6 py-4">{finding.impact}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          
          <InfoCard title={project.report.methodology.title}>
            <p>{project.report.methodology.description}</p>
          </InfoCard>
          
          <InfoCard title={project.report.claimSummary.title}>
            <p>{project.report.claimSummary.summary}</p>
          </InfoCard>

          <div className="bg-base-100 rounded-lg shadow-lg border border-base-300">
            <h3 className="text-xl font-bold text-base-content p-6 flex items-center">
              <DocumentTextIcon className="w-6 h-6 mr-3 text-brand-primary" />
              Supporting Documents
            </h3>
            <ul className="divide-y divide-base-300">
              {project.report.supportingDocuments.map((doc, index) => (
                <li key={index} className="px-6 py-4 flex items-center justify-between hover:bg-base-200/50">
                  <div>
                    <p className="font-semibold text-base-content">{doc.documentName}</p>
                    <p className="text-xs text-base-content-secondary">
                        {doc.references.length} {doc.references.length === 1 ? 'reference' : 'references'} found
                    </p>
                  </div>
                  <a href={doc.referenceLink} target="_blank" rel="noopener noreferrer" className="text-brand-secondary hover:text-brand-primary">
                    <ArrowTopRightOnSquareIcon className="w-5 h-5"/>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-base-100 rounded-lg border-2 border-dashed border-base-300">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-base-content-secondary" />
          <h3 className="mt-2 text-lg font-medium text-base-content">No Delay Data Available</h3>
          <p className="mt-1 text-sm text-base-content-secondary">This project does not yet contain a delay analysis report. Generate one in the Delay Analysis App to see data here.</p>
        </div>
      )}
    </div>
  );
};

export default DelayAnalysisTab;
