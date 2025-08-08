
import type { ReactNode } from 'react';

// Raw data for stat cards, icon is handled by the component
export interface StatCardData {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  key: 'schedule' | 'budget' | 'rfis' | 'safety';
}

// Data for the Cost vs. Budget chart
export interface ChartData {
    name: string;
    Cost: number;
    Budget: number;
}

// Data for AI-powered insights
export interface Insight {
    text: string;
    level: 'High' | 'Medium' | 'Low';
}

// A comprehensive type for a single project, acting as our "database" record
export interface Project {
  id: string;
  name:string;
  dashboard: {
    stats: StatCardData[];
    chartData: ChartData[];
    insights: Insight[];
  }
  // Placeholder for data from other modules
  scheduling?: any; 
  contracts?: any;
  delay?: any;
}
