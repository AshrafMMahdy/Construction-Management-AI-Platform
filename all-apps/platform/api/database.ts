
import type { Project } from '../types';

export const projectsDB: Project[] = [
  {
    id: 'proj-1-metropolis-tower',
    name: 'Metropolis Tower',
    dashboard: {
      stats: [
        { key: 'schedule', title: 'Schedule Adherence', value: 'On Track', change: '0 days', changeType: 'increase' },
        { key: 'budget', title: 'Budget Status', value: '$2.1M / $2.0M', change: '5% Over', changeType: 'decrease' },
        { key: 'rfis', title: 'Open RFIs', value: '48', change: '+8', changeType: 'decrease' },
        { key: 'safety', title: 'Safety Incidents', value: '2', change: '-1', changeType: 'increase' },
      ],
      chartData: [
        { name: 'Jan', Budget: 400000, Cost: 380000 },
        { name: 'Feb', Budget: 400000, Cost: 410000 },
        { name: 'Mar', Budget: 400000, Cost: 450000 },
        { name: 'Apr', Budget: 400000, Cost: 420000 },
        { name: 'May', Budget: 400000, Cost: 440000 },
      ],
      insights: [
        { level: 'High', text: 'Budget is currently 5% overdrawn, primarily due to increased material costs for steel.' },
        { level: 'Medium', text: 'RFI response time has increased by 15% in the last month, posing a risk to schedule.' },
        { level: 'Low', text: 'Subcontractor performance for HVAC is exceeding expectations.' },
      ]
    }
  },
  {
    id: 'proj-2-coastal-highway',
    name: 'Coastal Highway Expansion',
    dashboard: {
      stats: [
        { key: 'schedule', title: 'Schedule Adherence', value: '14 Days Behind', change: '-5 days', changeType: 'decrease' },
        { key: 'budget', title: 'Budget Status', value: '$12.5M / $15.0M', change: '2% Under', changeType: 'increase' },
        { key: 'rfis', title: 'Open RFIs', value: '21', change: '-5', changeType: 'increase' },
        { key: 'safety', title: 'Safety Incidents', value: '0', change: '0', changeType: 'increase' },
      ],
      chartData: [
        { name: 'Q1', Budget: 3750000, Cost: 3200000 },
        { name: 'Q2', Budget: 3750000, Cost: 3500000 },
        { name: 'Q3', Budget: 3750000, Cost: 3800000 },
        { name: 'Q4', Budget: 3750000, Cost: 2000000 },
      ],
      insights: [
        { level: 'High', text: 'Project is 14 days behind schedule due to unforeseen geological conditions during excavation.' },
        { level: 'Low', text: 'Budget remains under-utilized, consider reallocating funds to accelerate critical path activities.' },
        { level: 'Low', text: 'Excellent safety record with zero reportable incidents this quarter.' },
      ]
    }
  }
];
