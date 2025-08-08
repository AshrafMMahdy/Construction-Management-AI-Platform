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

// --- Unified Project Type ---
interface Project {
  id: string;
  name: string;
  createdAt: string;
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
            if (result.status === 'fulfilled') {
                if (result.value && result.value.id && result.value.name) {
                    projects.push(result.value as Project);
                } else {
                    console.warn(`File ${projectBlobs[index].pathname} was fetched but seems to have invalid content.`, result.value);
                }
            } else {
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
