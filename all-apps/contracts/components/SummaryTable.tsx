
import React, { useMemo } from 'react';
import { AnalysisResult, SummaryStats } from '../types';

interface SummaryTableProps {
  results: AnalysisResult[];
}

const getStatusBadgeClass = (status: string): string => {
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


export const SummaryTable: React.FC<SummaryTableProps> = ({ results }) => {
  const stats: SummaryStats = useMemo(() => {
    if (!results) return {};
    return results.reduce((acc, result) => {
      const status = result.status;
      if (!acc[status]) {
        acc[status] = { count: 0, ids: [] };
      }
      acc[status].count++;
      acc[status].ids.push(result.contract_clause_index);
      return acc;
    }, {} as SummaryStats);
  }, [results]);

  const totalClauses = results.length;
  const statusOrder = ['Rejected', 'Acceptable subject to modification', 'Requires Review (Inferred)', 'Accepted'];
  const sortedStatuses = Object.keys(stats).sort((a, b) => {
      const indexA = statusOrder.indexOf(a);
      const indexB = statusOrder.indexOf(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
  });

  return (
    <div className="bg-slate-800 shadow-xl rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Clauses by Status</h3>
        <p className="text-sm font-medium text-gray-300">Total Clauses Analyzed: <span className="font-bold text-blue-400">{totalClauses}</span></p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-slate-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/3">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/6">
                Count
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/2">
                Contract Clause Indices
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-gray-700">
            {sortedStatuses.map((status) => (
              <tr key={status}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(status)}`}>
                    {status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{stats[status].count}</td>
                <td className="px-6 py-4 whitespace-normal text-sm text-gray-300 break-words">
                  {stats[status].ids.map(id => id + 1).join(', ')}
                </td>
              </tr>
            ))}
             {Object.keys(stats).length === 0 && (
                <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No data to summarize.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
