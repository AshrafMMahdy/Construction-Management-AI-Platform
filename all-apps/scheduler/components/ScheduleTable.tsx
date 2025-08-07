
import React from 'react';
import { GanttActivity } from '../types';

interface ScheduleTableProps {
  activities: GanttActivity[];
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({ activities }) => {
  return (
    <div className="overflow-x-auto bg-brand-secondary rounded-lg shadow-lg">
      <table className="min-w-full text-sm text-left text-brand-light">
        <thead className="text-xs text-brand-accent uppercase bg-brand-primary/50">
          <tr>
            <th scope="col" className="px-6 py-3 w-[5%]">ID</th>
            <th scope="col" className="px-6 py-3 w-[40%]">Activity Name</th>
            <th scope="col" className="px-6 py-3 w-[15%]">Duration (Days)</th>
            <th scope="col" className="px-6 py-3 w-[15%]">Total Float (Days)</th>
            <th scope="col" className="px-6 py-3 w-[25%]">Predecessors</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity, index) => (
            <tr key={activity.id} className={`border-b border-brand-primary/50 transition-colors ${activity.isCritical ? 'bg-brand-accent/10' : (index % 2 === 0 ? 'bg-brand-secondary' : 'bg-brand-secondary/70')}`}>
              <td className="px-6 py-4 font-medium">{activity.id}</td>
              <td className="px-6 py-4">{activity.name}</td>
              <td className="px-6 py-4 text-center">{activity.duration}</td>
              <td className={`px-6 py-4 text-center font-mono ${activity.isCritical ? 'text-red-300 font-bold' : ''}`}>{activity.totalFloat}</td>
              <td className="px-6 py-4 font-mono">{activity.predecessors || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTable;