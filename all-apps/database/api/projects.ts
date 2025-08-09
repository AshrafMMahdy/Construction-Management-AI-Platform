// This file is a Vercel Serverless Function.
// It acts as a secure backend endpoint to fetch data from Vercel Blob storage.

// Type definitions are duplicated here to make the serverless function self-contained,
// avoiding potential path resolution issues during the Vercel build process.
// --- Contract Analysis Types ---
interface FileObject {
    name: string;
    type: string;
    dataUrl: string;
}
interface AnalysisResult {
  contract_clause_index: number;
  contract_clause_text: string;
  status: 'Accepted' | 'Rejected' | 'Acceptable subject to modification' | 'Requires Review (Inferred)';
  justification: string;
  matched_database_clause_id?: string | number | null;
  portion_to_modify?: string;
}
interface SearchResult {
  contract_clause_index: number;
  contract_clause_text: string;
  relevant_portion: string;
}

// --- Scheduler App Types ---
interface ProjectInput {
  isNotInDb: boolean;
  description: string;
  selections: { [key: string]: string; };
}
interface AgentOutput { [key:string]: any; }
interface ScheduleActivity {
  id: number;
  name: string;
  duration: number;
  predecessors: string;
}

// --- Delay Analysis App Types ---
interface DocumentReference {
  pageNumber: string;
  paragraph: string;
}
interface DelayFinding {
  activity: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart: string;
  actualEnd: string;
  delayDays: number;
  impact: string;
}
interface SupportingDocument {
  documentName: string;
  referenceLink: string;
  references: DocumentReference[];
}
interface ReportData {
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
interface AdditionalDocData {
    name: string;
    category: string;
    content: string;
}
type AppOrigin = 'delay-analysis' | 'scheduler' | 'contract-analysis';
type AnalysisMethod = 'as-built-vs-planned' | 'window-analysis' | 'time-impact-analysis';


// --- Unified Project Type ---
interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  appOrigin?: AppOrigin;
  historicalData: string | null;
  fileName: string | null;
  // Scheduler fields
  projectInput?: ProjectInput;
  startDate?: string;
  agentOutputs?: AgentOutput[];
  generatedSchedule?: ScheduleActivity[];
  generatedNarrative?: string;
  // Contract fields
  contractFile?: FileObject | null;
  searchQuery?: string | null;
  analysisResults?: AnalysisResult[] | null;
  searchResults?: SearchResult[] | null;
  // Delay Analysis fields
  scheduleData?: string;
  scheduleFileName?: string;
  analysisMethod?: AnalysisMethod;
  additionalDocs?: AdditionalDocData[];
  report?: ReportData | null;
}

/**
 * Recursively flattens a nested project structure.
 * When an app saves over a project from another app, it can create a `project` property
 * containing the original data. This function merges them, with the outer-level
 * (newer) data taking precedence for conflicting keys.
 * @param {any} data The raw project data from the JSON blob.
 * @returns {Project} A single, flattened Project object.
 */
function flattenProjectData(data) {
  let finalProject = { ...data };
  let current = data;

  // Traverse down the nested 'project' properties
  while (current && typeof current.project === 'object' && current.project !== null) {
    const nestedProject = current.project;
    // Merge nested project into the final object. The properties of finalProject (the newer ones)
    // will overwrite the older, nested ones if there are conflicts.
    finalProject = { ...nestedProject, ...finalProject };
    current = nestedProject;
  }
  
  // Clean up any lingering 'project' property from the final merged object.
  delete finalProject.project;

  return finalProject;
}


// Use the Edge runtime for faster responses.
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { 
            status: 405, 
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const VERCEL_BLOB_API_URL = 'https://blob.vercel-storage.com';

    if (!token) {
        console.error("Vercel Blob token (BLOB_READ_WRITE_TOKEN) not found on server.");
        return new Response(JSON.stringify({ message: 'Server configuration error.' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const listUrl = `${VERCEL_BLOB_API_URL}?prefix=projects/`;
        const listResponse = await fetch(listUrl, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!listResponse.ok) {
            const errorText = await listResponse.text();
            console.error(`Failed to list blobs from Vercel: ${listResponse.status} - ${errorText}`);
            return new Response(JSON.stringify({ message: `Failed to list projects. Upstream error: ${errorText}` }), { 
                status: listResponse.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        const listResult = await listResponse.json();

        if (!listResult.blobs || listResult.blobs.length === 0) {
            return new Response(JSON.stringify([]), { 
                status: 200, 
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                 } 
            });
        }
        
        const projectBlobs = listResult.blobs.filter((b: any) => b.pathname.endsWith('.json'));
        const fetchPromises = projectBlobs.map((blob: any) => 
            fetch(blob.url, { headers: { 'Cache-Control': 'no-cache' } }).then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch ${blob.url}: ${res.statusText}`);
                }
                return res.json();
            })
        );

        const settledResults = await Promise.allSettled(fetchPromises);
        
        const projects: Project[] = [];
        settledResults.forEach((result: PromiseSettledResult<any>, index) => {
            if (result.status === 'fulfilled' && result.value) {
                // Flatten the project data to handle nested structures where one app saves over another's data.
                const projectData = flattenProjectData(result.value);
                
                if (projectData && projectData.id && projectData.name) {
                    projects.push(projectData as Project);
                } else {
                    console.warn(`File ${projectBlobs[index].pathname} was fetched but has invalid content after flattening.`, projectData);
                }
            } else if (result.status === 'rejected') {
                console.error(`Failed to fetch or parse project from ${projectBlobs[index].pathname}:`, result.reason);
            }
        });

        projects.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return new Response(JSON.stringify(projects), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error("An error occurred while fetching projects from Vercel Blob:", message);
        return new Response(JSON.stringify({ message: 'Internal Server Error' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
