import React from 'react';
import { ReportData, DelayFinding } from '../types';

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


const ReportOutput: React.FC<{ data: ReportData }> = ({ data }) => {
  return (
    <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-700 animate-fade-in">
      <h1 className="text-3xl font-bold text-center text-blue-400 mb-2">Executive Report: Delay Analysis & Claim</h1>
      <p className="text-center text-slate-400 mb-8">Generated: {new Date().toLocaleDateString()}</p>

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
        <ul className="list-disc list-inside space-y-2">
            {data.supportingDocuments.map((doc, index) => (
                <li key={index}>
                    <span>{doc.documentName} - </span>
                    <a href={`#/${doc.referenceLink}`} className="text-blue-400 hover:text-blue-300 hover:underline transition-colors" target="_blank" rel="noopener noreferrer">
                        View Document
                    </a>
                </li>
            ))}
        </ul>
      </Section>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ReportOutput;