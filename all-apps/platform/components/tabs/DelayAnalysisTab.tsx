import React from 'react';
import { Project } from '../../types';
import { ExclamationTriangleIcon, ArrowTopRightOnSquareIcon, DocumentTextIcon } from '../Icons';
import { APP_URLS } from '../../constants';

interface DelayAnalysisTabProps {
  project: Project;
}

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-base-100 p-6 rounded-lg shadow-lg border border-base-300">
    <h3 className="text-xl font-bold text-base-content mb-4">{title}</h3>
    <div className="space-y-4 text-base-content-secondary">{children}</div>
  </div>
);

const DelayAnalysisTab: React.FC<DelayAnalysisTabProps> = ({ project }) => {
  const { report } = project;
  const hasDelayData = !!report;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

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
            <SectionCard title="Executive Summary">
                <p className="whitespace-pre-wrap">{report.executiveSummary}</p>
            </SectionCard>
            
            <SectionCard title={report.methodology.title}>
                <p className="whitespace-pre-wrap">{report.methodology.description}</p>
            </SectionCard>

            <div className="bg-base-100 rounded-lg shadow-lg border border-base-300">
                <h3 className="text-xl font-bold text-base-content p-6">{report.delayAnalysis.title}</h3>
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
                            {report.delayAnalysis.findings.map((finding, index) => (
                                <tr key={index} className="border-b border-base-300 hover:bg-base-200/50">
                                    <td className="px-6 py-4 font-medium">{finding.activity}</td>
                                    <td className="px-6 py-4">{formatDate(finding.plannedStart)}</td>
                                    <td className="px-6 py-4">{formatDate(finding.plannedEnd)}</td>
                                    <td className="px-6 py-4">{formatDate(finding.actualStart)}</td>
                                    <td className="px-6 py-4">{formatDate(finding.actualEnd)}</td>
                                    <td className="px-6 py-4">{finding.delayDays}</td>
                                    <td className="px-6 py-4 whitespace-pre-wrap">{finding.impact}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <SectionCard title={report.claimSummary.title}>
                <p className="whitespace-pre-wrap">{report.claimSummary.summary}</p>
            </SectionCard>

            <SectionCard title="Supporting Documents">
                {report.supportingDocuments.length > 0 ? (
                    <ul className="space-y-4">
                        {report.supportingDocuments.map((doc, index) => (
                            <li key={index} className="bg-base-200 p-4 rounded-md">
                                <div className="flex items-center font-semibold">
                                    <DocumentTextIcon className="w-5 h-5 mr-2 flex-shrink-0 text-brand-secondary" />
                                    {doc.referenceLink ? (
                                        <a href={doc.referenceLink} target="_blank" rel="noopener noreferrer" className="hover:underline">{doc.documentName}</a>
                                    ) : (
                                        <span>{doc.documentName}</span>
                                    )}
                                </div>
                                {doc.references.length > 0 && (
                                    <div className="pl-7 mt-2 text-xs text-base-content-secondary space-y-1">
                                        {doc.references.map((ref, refIndex) => (
                                            <p key={refIndex}>
                                                - Page: {ref.pageNumber}, Paragraph: {ref.paragraph}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No supporting documents provided.</p>
                )}
            </SectionCard>
        </div>
      ) : (
        <div className="text-center py-16 bg-base-100 rounded-lg border-2 border-dashed border-base-300">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-base-content-secondary" />
          <h3 className="mt-2 text-lg font-medium text-base-content">No Delay Data Available</h3>
          <p className="mt-1 text-sm text-base-content-secondary">This project does not contain data from the Delay Analysis application.</p>
        </div>
      )}
    </div>
  );
};

export default DelayAnalysisTab;
