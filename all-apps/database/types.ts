// Contract Analysis Types
export interface Clause {
  [key: string]: any;
}

export interface AnalysisResult {
  contract_clause_index: number;
  contract_clause_text: string;
  status: 'Accepted' | 'Rejected' | 'Acceptable subject to modification' | 'Requires Review (Inferred)';
  justification: string;
  matched_database_clause_id?: string | number | null;
  portion_to_modify?: string;
  suggested_modification_text?: string;
}

export interface SearchResult {
  contract_clause_index: number;
  contract_clause_text: string;
  relevant_portion: string;
}

export interface FileObject {
    name: string;
    type: string;
    dataUrl: string;
}

export interface SummaryStats {
  [status: string]: {
    count: number;
    ids: number[];
  };
}

export interface ImageContractPage {
  pageNumber: number;
  dataUrl: string;
  mimeType: 'image/jpeg' | 'image/png';
}

export type TextContractContent = {
  type: 'text';
  clauses: string[];
};

export type ImageContractContent = {
  type: 'image';
  pages: ImageContractPage[];
};

export type ContractContent = TextContractContent | ImageContractContent;

// Scheduler App Types
export interface ProjectInput {
  isNotInDb: boolean;
  description: string;
  selections: {
    [key: string]: string; // Key-value pairs like "Project Type": "Commercial"
  };
}

export interface AgentOutput {
  [key: string]: any; // Structure is not specified, allow any properties
}

export interface ScheduleActivity {
  id: number;
  name: string;
  duration: number;
  predecessors: string;
}

// Delay Analysis App Types
export interface DocumentReference {
  pageNumber: string;
  paragraph: string;
}

export interface DelayFinding {
  activity: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart: string;
  actualEnd: string;
  delayDays: number;
  impact: string;
}

export interface SupportingDocument {
  documentName: string;
  referenceLink: string;
  references: DocumentReference[];
}

export interface ReportData {
  executiveSummary: string;
  methodology: {
    title: string;
    description: string;
  };
  delayAnalysis: {
    title: string;
    findings: DelayFinding[];
  };
  claimSummary: {
    title: string;
    summary: string;
  };
  supportingDocuments: SupportingDocument[];
}

export interface AdditionalDocData {
    name: string;
    category: string;
    content: string;
}

export type AppOrigin = 'delay-analysis' | 'scheduler' | 'contract-analysis';

export type AnalysisMethod = 'as-built-vs-planned' | 'window-analysis' | 'time-impact-analysis';

// The app's internal tab identifier
export type Tab = 'dashboard' | 'schedules' | 'contracts' | 'delayAnalysis';


// The unified project type that combines fields from all apps
export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  appOrigin?: AppOrigin;

  // Common fields
  historicalData: string | null;
  fileName: string | null;

  // --- Scheduler Project Fields (optional) ---
  projectInput?: ProjectInput;
  startDate?: string;
  agentOutputs?: AgentOutput[];
  generatedSchedule?: ScheduleActivity[];
  generatedNarrative?: string;

  // --- Contract Project Fields (optional) ---
  contractFile?: FileObject | null;
  searchQuery?: string | null;
  analysisResults?: AnalysisResult[] | null;
  searchResults?: SearchResult[] | null;
  
  // --- Delay Analysis Project Fields (optional) ---
  scheduleData?: string;
  scheduleFileName?: string;
  analysisMethod?: AnalysisMethod;
  additionalDocs?: AdditionalDocData[];
  report?: ReportData | null;
}
