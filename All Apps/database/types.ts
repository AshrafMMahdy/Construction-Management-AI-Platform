/**
 * Represents the structure of a saved project from the Baseline Scheduler app.
 * This is the primary data model fetched from Vercel Blob storage.
 */
export interface SchedulerProject {
  id: string;
  name: string;
  createdAt: string;
  historicalData: string;
  fileName: string;
  projectInput: ProjectInput;
  startDate: string;
  agentOutputs: AgentOutput[];
  generatedSchedule: ScheduleActivity[];
  generatedNarrative: string;
}

export interface ProjectInput {
  isNotInDb: boolean;
  description: string;
  selections: {
    [key: string]: string; // Key-value pairs like "Project Type": "Commercial"
  };
}

// AgentOutputs is not fully defined, so creating a placeholder
export interface AgentOutput {
  [key: string]: any; // Structure is not specified, allow any properties
}

export interface ScheduleActivity {
  id: number;
  name: string;
  duration: number;
  predecessors: string;
}

// The app's internal tab identifier
export type Tab = 'dashboard' | 'schedules' | 'contracts' | 'delayAnalysis';
