import React, { useMemo } from 'react';
import { AgentOutput } from '../types';

interface EvaluationTableProps {
  agentOutputs: AgentOutput[];
}

const EvaluationTable: React.FC<EvaluationTableProps> = ({ agentOutputs }) => {
  const { headers, criteria, rows } = useMemo(() => {
    if (!agentOutputs || agentOutputs.length === 0) {
      return { headers: [], criteria: new Set(), rows: [] };
    }

    const headers = ['Criteria', ...agentOutputs.map(o => o.agentId.replace('_', ' '))];
    const criteria = new Set<string>();
    agentOutputs.forEach(output => {
      Object.keys(output.scores).forEach(key => criteria.add(key));
    });

    const criteriaArray = Array.from(criteria).sort();

    const rows = criteriaArray.map(criterion => {
      return [
        criterion,
        ...agentOutputs.map(output => output.scores[criterion] ?? 'N/A')
      ];
    });

    return { headers, criteria, rows };
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
                <td key={cellIndex} className={`px-6 py-4 ${cellIndex === 0 ? 'font-medium' : ''}`}>
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
