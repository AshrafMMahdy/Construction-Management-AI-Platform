
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
}

export interface SearchResult {
  contract_clause_index: number;
  contract_clause_text: string;
  relevant_portion: string;
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

// Project Management Types
export interface FileObject {
    name: string;
    type: string;
    dataUrl: string;
}

export interface ProjectSummary {
    id: string; // The full pathname of the blob, e.g., 'projects/2025-08-08T05:42:10.662Z.json'
    name: string;
    createdAt: string; // The ISO timestamp string
}

// Based on user's provided JSON structure from the "scheduler" app
export interface Project {
    id: string; // ISO timestamp, e.g., "2025-08-08T05:42:10.662Z"
    name: string;
    createdAt: string; // ISO timestamp, same as id

    // Fields populated by the contract analysis app
    historicalData: string | null; // Stringified JSON of the clause database (from databaseFile)
    fileName: string | null;       // Name of the clause database file
    contractFile: FileObject | null;
    searchQuery: string | null;
    analysisResults: AnalysisResult[] | null;
    searchResults: SearchResult[] | null;

    // Placeholder fields to match the scheduler app's format
    projectInput: any | null;
    startDate: string | null;
    agentOutputs: any[] | null;
    generatedSchedule: any[] | null;
    generatedNarrative: string | null;
}
