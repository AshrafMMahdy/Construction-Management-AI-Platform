
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
    title:string;
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

export interface ProjectSummary {
    id: string;
    name: string;
    appOrigin?: AppOrigin;
}

export type AnalysisMethod = 'as-built-vs-planned' | 'window-analysis' | 'time-impact-analysis';

export interface Project extends ProjectSummary {
    appOrigin?: AppOrigin;
    createdAt: string;
    updatedAt: string;
    scheduleData: string;
    scheduleFileName: string;
    analysisMethod: AnalysisMethod;
    additionalDocs: AdditionalDocData[];
    report: ReportData | null;
}
