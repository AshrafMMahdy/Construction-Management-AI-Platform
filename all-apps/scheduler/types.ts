export interface Activity {
  id: number;
  name: string;
  duration: number;
  predecessors: string;
  resourceGroupName?: string | null;
  membersPerCrew?: number | null;
  numberOfCrews?: number | null;
  boqQuantity?: string | null;
  packageCost?: string | null;
}

export interface GanttActivity extends Activity {
  startDate: Date;
  endDate: Date;
  totalFloat: number;
  isCritical: boolean;
}

export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface ParsedPredecessor {
  id: number;
  type: DependencyType;
  lag: number;
}

export type SupportingDocumentCategory = 'BOQ + Package Price' | 'Resource and Productivity database' | 'Project Drawings';

export interface SupportingDocument {
  id: string;
  file: File;
  category: SupportingDocumentCategory | null;
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
  resourceGroupName?: string | null;
  membersPerCrew?: number | null;
  numberOfCrews?: number | null;
  boqQuantity?: string | null;
  packageCost?: string | null;
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

export interface AiSchedulerData {
  historicalData: string;
  fileName: string;
  projectInput: ProjectInput;
  startDate: string;
  agentOutputs: AgentOutput[];
  generatedSchedule: Activity[];
  generatedNarrative: string;
}

export interface SavedProject {
  id: string;
  name: string;
  createdAt: string;
  aiSchedulerData?: AiSchedulerData;
  [key: string]: any; // Allow other app data
}

export interface ChartDataPoint {
  label: string;
  value: number;
  
}

export interface ChartData {
  costSCurve: ChartDataPoint[];
  resourceSCurve: ChartDataPoint[];
  resourceDistribution: ChartDataPoint[];
}
