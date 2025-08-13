
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
            <th scope="col" className="px-6 py-3">ID</th>
            <th scope="col" className="px-6 py-3">Activity Name</th>
            <th scope="col" className="px-6 py-3">Resource Group</th>
            <th scope="col" className="px-6 py-3 text-center">Crew Size</th>
            <th scope="col" className="px-6 py-3 text-center"># Crews</th>
            <th scope="col" className="px-6 py-3 text-center">Duration (Days)</th>
            <th scope="col" className="px-6 py-3 text-center">Total Float (Days)</th>
            <th scope="col" className="px-6 py-3">BOQ Quantity</th>
            <th scope="col" className="px-6 py-3">Package Cost</th>
            <th scope="col" className="px-6 py-3">Predecessors</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity, index) => (
            <tr key={activity.id} className={`border-b border-brand-primary/50 transition-colors ${activity.isCritical ? 'bg-brand-accent/10' : (index % 2 === 0 ? 'bg-brand-secondary' : 'bg-brand-secondary/70')}`}>
              <td className="px-6 py-4 font-medium">{activity.id}</td>
              <td className="px-6 py-4">{activity.name}</td>
              <td className="px-6 py-4">{activity.resourceGroupName || '—'}</td>
              <td className="px-6 py-4 text-center">{activity.membersPerCrew ?? '—'}</td>
              <td className="px-6 py-4 text-center">{activity.numberOfCrews ?? '—'}</td>
              <td className="px-6 py-4 text-center">{activity.duration}</td>
              <td className={`px-6 py-4 text-center font-mono ${activity.isCritical ? 'text-red-300 font-bold' : ''}`}>{activity.totalFloat}</td>
              <td className="px-6 py-4">{activity.boqQuantity || '—'}</td>
              <td className="px-6 py-4">{activity.packageCost || '—'}</td>
              <td className="px-6 py-4 font-mono">{activity.predecessors || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTable;
