import React, { useState, useMemo } from 'react';
import { AnalysisResult } from '../types';

interface ResultsTableProps {
  results: AnalysisResult[];
}

const getStatusBadgeClass = (status: AnalysisResult['status']): string => {
  switch (status) {
    case 'Accepted':
      return 'bg-green-500/20 text-green-300';
    case 'Acceptable subject to modification':
      return 'bg-yellow-500/20 text-yellow-300';
    case 'Rejected':
      return 'bg-red-500/20 text-red-300';
    case 'Requires Review (Inferred)':
      return 'bg-purple-500/20 text-purple-300';
    default:
      return 'bg-gray-500/20 text-gray-300';
  }
};

const getStatusSolidBgClass = (status: AnalysisResult['status']): string => {
  switch (status) {
    case 'Accepted': return 'bg-green-500';
    case 'Acceptable subject to modification': return 'bg-yellow-500';
    case 'Rejected': return 'bg-red-500';
    case 'Requires Review (Inferred)': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
};

const getStatusBorderClass = (status: AnalysisResult['status']): string => {
    switch (status) {
      case 'Accepted':
        return 'border-green-500';
      case 'Acceptable subject to modification':
        return 'border-yellow-500';
      case 'Rejected':
        return 'border-red-500';
      case 'Requires Review (Inferred)':
        return 'border-purple-500';
      default:
        return 'border-gray-500';
    }
}

const getStatusBubbleClass = (status: AnalysisResult['status']): string => {
  switch (status) {
    case 'Accepted': return 'bg-green-600';
    case 'Acceptable subject to modification': return 'bg-yellow-500';
    case 'Rejected': return 'bg-red-600';
    case 'Requires Review (Inferred)': return 'bg-purple-600';
    default: return 'bg-gray-600';
  }
};

const STATUS_ORDER: AnalysisResult['status'][] = [
    'Rejected',
    'Acceptable subject to modification',
    'Requires Review (Inferred)',
    'Accepted',
];

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const [activeFilter, setActiveFilter] = useState<AnalysisResult['status'] | 'All'>('All');

  const filteredResults = useMemo(() => {
    if (activeFilter === 'All') {
      return results;
    }
    return results.filter(result => result.status === activeFilter);
  }, [results, activeFilter]);

  if (!results || results.length === 0) {
    return (
      <div className="bg-slate-800 p-8 rounded-lg shadow-xl text-center">
        <p className="text-gray-400">No analysis results to display.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-100 mb-4">Detailed Analysis</h2>
      
      <div className="mb-4 p-4 bg-slate-800/50 rounded-lg flex items-center gap-x-3 gap-y-2 flex-wrap">
        <p className="text-sm font-medium text-gray-400 mr-2 shrink-0">Filter by Status:</p>
        <button
          onClick={() => setActiveFilter('All')}
          className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
              activeFilter === 'All'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          All
        </button>
        {STATUS_ORDER.map(status => (
          <button
            key={status}
            onClick={() => setActiveFilter(status)}
            className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-200 ${
              activeFilter === status
                ? `${getStatusSolidBgClass(status)} text-white shadow-md`
                : `${getStatusBadgeClass(status)} hover:bg-opacity-40`
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-slate-800 shadow-xl rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-slate-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[5%]">
                  Clause #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[15%]">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[40%]">
                  Contract Clause Text
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[40%]">
                  Analysis & Justification
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-gray-700">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                    No clauses match the current filter.
                  </td>
                </tr>
              ) : (
                filteredResults.map((result) => (
                  <tr key={result.contract_clause_index} className="hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white align-top">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white ${getStatusBubbleClass(result.status)}`}>
                          {result.contract_clause_index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm align-top">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(result.status)}`}>
                        {result.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-300 break-words align-top">{result.contract_clause_text}</td>
                    <td className={`px-6 py-4 whitespace-pre-wrap text-sm text-gray-300 break-words align-top border-l-4 ${getStatusBorderClass(result.status)} space-y-3`}>
                        {result.portion_to_modify && (
                            <div>
                              <p className="font-semibold text-gray-200 text-xs uppercase tracking-wider">Suggested Modification</p>
                              <p className="mt-1 bg-yellow-500/10 p-2 rounded-md text-yellow-200">{result.portion_to_modify}</p>
                            </div>
                        )}
                        <div>
                            <p className="font-semibold text-gray-200 text-xs uppercase tracking-wider">Justification</p>
                            <p className="mt-1">{result.justification}</p>
                        </div>
                        {result.matched_database_clause_id != null && (
                            <div>
                                <p className="font-semibold text-gray-200 text-xs uppercase tracking-wider">Matched Database Clause</p>
                                <p className="mt-1 font-mono text-xs bg-slate-700 p-1 rounded-md inline-block">ID: {String(result.matched_database_clause_id)}</p>
                            </div>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};