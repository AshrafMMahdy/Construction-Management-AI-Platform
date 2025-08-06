
import React from 'react';
import { Activity } from '../types';

interface ScheduleTableProps {
  activities: Activity[];
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({ activities }) => {
  return (
    <div className="overflow-x-auto bg-brand-secondary rounded-lg shadow-lg">
      <table className="min-w-full text-sm text-left text-brand-light">
        <thead className="text-xs text-brand-accent uppercase bg-brand-primary/50">
          <tr>
            <th scope="col" className="px-6 py-3 w-1/12">ID</th>
            <th scope="col" className="px-6 py-3 w-5/12">Activity Name</th>
            <th scope="col" className="px-6 py-3 w-3/12">Duration (Days)</th>
            <th scope="col" className="px-6 py-3 w-3/12">Predecessors</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity, index) => (
            <tr key={activity.id} className={`border-b border-brand-primary/50 ${index % 2 === 0 ? 'bg-brand-secondary' : 'bg-brand-secondary/70'}`}>
              <td className="px-6 py-4 font-medium">{activity.id}</td>
              <td className="px-6 py-4">{activity.name}</td>
              <td className="px-6 py-4">{activity.duration}</td>
              <td className="px-6 py-4 font-mono">{activity.predecessors || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTable;
