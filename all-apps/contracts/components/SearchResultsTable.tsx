
import React from 'react';
import { SearchResult } from '../types';

interface SearchResultsTableProps {
  results: SearchResult[];
}

const HighlightedText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight || !text) {
    return <>{text}</>;
  }
  
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
  
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-yellow-500/40 text-yellow-100 px-1 py-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export const SearchResultsTable: React.FC<SearchResultsTableProps> = ({ results }) => {
  if (!results) {
    return null;
  }
  
  if (results.length === 0) {
     return (
      <div className="bg-slate-800 p-8 rounded-lg shadow-xl text-center">
        <p className="text-gray-400">No relevant clauses found for your search query.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-100 mb-4">Search Results</h2>
      
      <div className="bg-slate-800 shadow-xl rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-slate-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[5%]">
                  Clause #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[60%]">
                  Full Clause Text
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[35%]">
                  Relevant Portion
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-gray-700">
                {results.map((result) => (
                  <tr key={result.contract_clause_index} className="hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white align-top">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full font-bold text-white bg-blue-600">
                          {result.contract_clause_index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-300 break-words align-top">
                      <HighlightedText text={result.contract_clause_text} highlight={result.relevant_portion} />
                    </td>
                    <td className="px-6 py-4 whitespace-pre-wrap text-sm text-yellow-200 break-words align-top border-l-4 border-yellow-500 bg-yellow-500/10">
                        {result.relevant_portion}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
