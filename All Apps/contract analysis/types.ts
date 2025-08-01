
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

export interface SummaryStats {
  [status: string]: {
    count: number;
    ids: number[];
  };
}
