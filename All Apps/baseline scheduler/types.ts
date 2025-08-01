export interface Activity {
  id: number;
  name: string;
  duration: number;
  predecessors: string;
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

export interface AgentOutput {
  agentId: string;
  schedule: Activity[];
  narrative: string;
  scores: EvaluationScores;
}
