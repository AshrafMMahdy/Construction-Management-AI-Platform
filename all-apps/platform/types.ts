/**
 * Represents the input selections for a Scheduler project.
 */
export interface ProjectInput {
  isNotInDb: boolean;
  description: string;
  selections: {
    [key: string]: string; // Key-value pairs like "Project Type": "Commercial"
  };
}

/**
 * Represents AI agent outputs for a Scheduler project.
 */
export interface AgentOutput {
  [key: string]: any; // Structure is not specified, allow any properties
}

/**
 * Represents a single activity in a generated schedule.
 */
export interface ScheduleActivity {
  id: number;
  name: string;
  duration: number;
  predecessors: string;
}

// Types from the Contracts Analysis application
export interface FileObject {
  name: string;
  type: string;
  dataUrl: string;
}

export interface AnalysisResult {
  contract_clause_index: number;
  contract_clause_text: string;
  status: 'Accepted' | 'Rejected' | 'Acceptable subject to modification' | 'Requires Review (Inferred)';
  justification: string;
  matched_database_clause_id?: string | number | null;
  portion_to_modify?: string;
}

export interface SearchResult {
  contract_clause_index: number;
  contract_clause_text: string;
  relevant_portion: string;
}


/**
 * A unified project that can contain data from either the Scheduler,
 * Contracts, or other apps. Fields are optional to accommodate different
 * project sources. This replaces the old `SchedulerProject`.
 */
export interface Project {
  // Common fields required in all projects
  id: string;
  name: string;
  createdAt: string;

  // Fields from Baseline Scheduler
  projectInput?: ProjectInput;
  startDate?: string;
  agentOutputs?: AgentOutput[];
  generatedSchedule?: ScheduleActivity[];
  generatedNarrative?: string;
  
  // Fields from Contracts Analysis
  contractFile?: FileObject | null;
  searchQuery?: string | null;
  analysisResults?: AnalysisResult[] | null;
  searchResults?: SearchResult[] | null;

  // Common but potentially ambiguous fields, used by both
  historicalData?: string | null;
  fileName?: string | null; // e.g., for scheduler's historical data or contract's clause db
}

// The app's internal tab identifier
export type Tab = 'dashboard' | 'schedules' | 'contracts' | 'delayAnalysis';
