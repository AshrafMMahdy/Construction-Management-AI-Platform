export interface Activity {
  id: number;
  name: string;
  duration: number;
  predecessors: string;
}

export interface GanttActivity extends Activity {
  startDate: Date;
  endDate: Date;
}

export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface ParsedPredecessor {
  id: number;
  type: DependencyType;
  lag: number;
}


export interface ScheduleResponse {
  schedule: Activity[];
  narrative: string;
}

export type ProjectFeatures = Record<string, string[]>;

export interface ProjectInput {
  isNotInDb: boolean;
  description: string;
  selections: Record<string, string>;
}

export type EvaluationScores = Record<string, string | number>;

export interface SuccessorSuggestion {
  successorId: number;
  dependencyType: DependencyType;
  justification: string;
}

export interface AgentActivitySuggestion {
  id: number;
  name: string;
  duration: number;
  successorSuggestions: SuccessorSuggestion[];
}

export interface AgentOutput {
  agentId: string;
  schedule: AgentActivitySuggestion[];
  narrative: string;
  scores: EvaluationScores;
}


export interface ProgressStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface ProgressUpdate {
  name: string;
  status: ProgressStep['status'];
  newName?: string;
}

export interface SavedProject {
  id: string;
  name: string;
  createdAt: string;
  // Core inputs
  historicalData: string;
  fileName: string;
  projectInput: ProjectInput;
  startDate: string;
  // Generated outputs
  agentOutputs: AgentOutput[];
  generatedSchedule: Activity[];
  generatedNarrative: string;
}
