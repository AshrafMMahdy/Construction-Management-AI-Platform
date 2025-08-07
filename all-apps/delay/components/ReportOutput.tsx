import React, { useState } from 'react';
import { ReportData, DelayFinding, SupportingDocument } from '../types';
import { exportReport } from '../services/exportService';
import DownloadIcon from './icons/DownloadIcon';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-6">
    <h2 className="text-xl font-bold text-slate-100 border-b-2 border-blue-500 pb-2 mb-4">
      {title}
    </h2>
    <div className="text-slate-300 leading-relaxed">
      {children}
    </div>
  </section>
);

const DelayAnalysisTable: React.FC<{ findings: DelayFinding[] }> = ({ findings }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full bg-slate-800 border border-slate-700">
      <thead className="bg-slate-700">
        <tr>
          <th className="text-left font-semibold text-slate-300 p-3">Activity</th>
          <th className="text-center font-semibold text-slate-300 p-3">Planned Period</th>
          <th className="text-center font-semibold text-slate-300 p-3">Actual Period</th>
          <th className="text-center font-semibold text-slate-300 p-3">Delay (Days)</th>
          <th className="text-left font-semibold text-slate-300 p-3">Impact</th>
        </tr>
      </thead>
      <tbody>
        {findings.map((finding, index) => (
          <tr key={index} className="border-t border-slate-700 hover:bg-slate-700/60">
            <td className="p-3 font-medium text-slate-200">{finding.activity}</td>
            <td className="p-3 text-center whitespace-nowrap">{`${finding.plannedStart} to ${finding.plannedEnd}`}</td>
            <td className="p-3 text-center whitespace-nowrap">{`${finding.actualStart} to ${finding.actualEnd}`}</td>
            <td className={`p-3 text-center font-bold ${finding.delayDays > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {finding.delayDays}
            </td>
            <td className="p-3 text-sm">{finding.impact}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SupportingDocuments: React.FC<{ documents: SupportingDocument[] }> = ({ documents }) => (
  <div className="space-y-3">
    {documents.map((doc, index) => (
      <details key={index} className="bg-slate-900/50 border border-slate-700 rounded-lg open:shadow-lg transition-shadow">
        <summary className="p-3 font-semibold cursor-pointer hover:bg-slate-800/60 flex justify-between items-center list-none">
          <span className="flex-grow">{doc.documentName}</span>
          <span className="text-xs text-slate-400 select-none transition-transform transform details-arrow mr-2">[+]</span>
        </summary>
        <div className="p-4 border-t border-slate-700">
          {doc.references && doc.references.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-600">
                        <tr>
                            <th className="text-left font-semibold text-slate-300 p-2 w-1/4">Page / Location</th>
                            <th className="text-left font-semibold text-slate-300 p-2">Evidence / Paragraph</th>
                        </tr>
                    </thead>
                    <tbody>
                        {doc.references.map((ref, refIndex) => (
                            <tr key={refIndex} className="border-t border-slate-700">
                                <td className="p-2 align-top font-mono text-slate-400">{ref.pageNumber}</td>
                                <td className="p-2 whitespace-pre-wrap font-serif italic text-slate-300">"{ref.paragraph}"</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          ) : (
            <p className="text-slate-400">No specific references were cited from this document in the analysis.</p>
          )}
        </div>
      </details>
    ))}
  </div>
);


const ReportOutput: React.FC<{ data: ReportData }> = ({ data }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    try {
      exportReport(data);
    } catch (error) {
        console.error("Failed to export report:", error);
        alert("There was an error exporting the report. Check the console for details.");
    } finally {
      // The process is very fast, but this prevents rapid clicking and provides feedback
      setTimeout(() => setIsExporting(false), 300);
    }
  };

  return (
    <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-700 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-400">Executive Report: Delay Analysis & Claim</h1>
          <p className="text-slate-400 mt-1">Generated: {new Date().toLocaleDateString()}</p>
        </div>
        <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500 transition-all duration-200"
        >
            <DownloadIcon className="w-5 h-5" />
            {isExporting ? 'Exporting...' : 'Download Report'}
        </button>
      </div>

      <Section title="1.0 Executive Summary">
        <p>{data.executiveSummary}</p>
      </Section>
      
      <Section title={data.methodology.title}>
        <p>{data.methodology.description}</p>
      </Section>
      
      <Section title={data.delayAnalysis.title}>
         <DelayAnalysisTable findings={data.delayAnalysis.findings} />
      </Section>

      <Section title={data.claimSummary.title}>
        <p>{data.claimSummary.summary}</p>
      </Section>
      
      <Section title="5.0 Supporting Documents">
        <SupportingDocuments documents={data.supportingDocuments} />
      </Section>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        details > summary {
          list-style: none;
        }
        details > summary::-webkit-details-marker {
          display: none;
        }
        .details-arrow {
          transition: transform 0.2s ease-in-out;
        }
        details[open] .details-arrow {
          transform: rotate(45deg);
        }
      `}</style>
    </div>
  );
};

export default ReportOutput;