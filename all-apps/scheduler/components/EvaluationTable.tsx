import React, { useMemo } from 'react';
import { AgentOutput } from '../types';

interface EvaluationTableProps {
  agentOutputs: AgentOutput[];
}

const EvaluationTable: React.FC<EvaluationTableProps> = ({ agentOutputs }) => {
  const { headers, rows } = useMemo(() => {
    if (!agentOutputs || agentOutputs.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = ['Criteria', ...agentOutputs.map(o => o.agentId.replace('_', ' '))];
    const criteria = new Set<string>();
    agentOutputs.forEach(output => {
      if(output.scores) {
        Object.keys(output.scores).forEach(key => criteria.add(key));
      }
    });

    const criteriaOrder = [
        "Calculated Duration (workdays)",
        "Total Activities",
        "Total Successor Links",
        "Has Start/End",
        "Overall Status", // Keep for failed agents, will be sorted to the bottom if not present
    ];

    const criteriaArray = Array.from(criteria).sort((a, b) => {
        const indexA = criteriaOrder.indexOf(a);
        const indexB = criteriaOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });


    const rows = criteriaArray.map(criterion => {
      return [
        criterion,
        ...agentOutputs.map(output => output.scores?.[criterion] ?? 'N/A')
      ];
    });

    return { headers, rows };
  }, [agentOutputs]);

  if (rows.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto bg-brand-secondary/70 rounded-lg shadow-lg mt-6">
      <table className="min-w-full text-sm text-left text-brand-light">
        <thead className="text-xs text-brand-accent uppercase bg-brand-primary/50">
          <tr>
            {headers.map(header => (
              <th key={header} scope="col" className="px-6 py-3 capitalize">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row[0])} className={`border-b border-brand-primary/50 ${index % 2 === 0 ? 'bg-brand-secondary' : 'bg-brand-secondary/80'}`}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={`px-6 py-4 ${cellIndex === 0 ? 'font-medium' : ''} ${String(row[0]) === 'Connectivity Reasoning' ? 'text-xs text-brand-muted' : ''}`}>
                  {String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EvaluationTable;