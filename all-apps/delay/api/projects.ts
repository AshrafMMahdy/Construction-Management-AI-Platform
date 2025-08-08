
// This file is a Vercel Serverless Function that handles all project-related API requests.
// It follows the pattern of a single file handling multiple HTTP methods based on the request.

// @ts-ignore - Vercel Blob is available in the Vercel environment
import { list, put, head } from '@vercel/blob';

// Self-contained type definitions for robustness in the serverless environment.
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

export interface ProjectSummary {
    id: string;
    name: string;
}

export type AnalysisMethod = 'as-built-vs-planned' | 'window-analysis' | 'time-impact-analysis';

export interface Project extends ProjectSummary {
    createdAt: string;
    updatedAt: string;
    scheduleData: string;
    scheduleFileName: string;
    analysisMethod: AnalysisMethod;
    additionalDocs: AdditionalDocData[];
    report: ReportData | null;
}

export const runtime = 'edge';

export default async function handler(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    switch (request.method) {
        case 'GET':
            if (id) {
                return getProjectById(id);
            } else {
                return listProjects();
            }
        case 'POST':
            return createProject(request);
        case 'PUT':
            if (id) {
                return updateProject(id, request);
            } else {
                return new Response(JSON.stringify({ message: 'Project ID is required for update' }), { status: 400 });
            }
        default:
            return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405 });
    }
}

async function listProjects() {
    try {
        const { blobs } = await list({ prefix: 'projects/', mode: 'folded' });

        const projects: ProjectSummary[] = (await Promise.all(
            blobs
                .filter(blob => blob.pathname.endsWith('.json'))
                .map(async (blob) => {
                    try {
                        const response = await fetch(blob.url);
                        if (!response.ok) return null;
                        const projectData: Pick<Project, 'id' | 'name'> = await response.json();
                        // Validate that the essential fields are there
                        if (projectData.id && projectData.name) {
                            return { id: projectData.id, name: projectData.name };
                        }
                        return null;
                    } catch {
                        return null; // Skip if fetching or parsing fails
                    }
                })
        )).filter((p): p is ProjectSummary => p !== null);

        projects.sort((a, b) => a.name.localeCompare(b.name));

        return new Response(JSON.stringify(projects), {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ message: 'Failed to list projects', error: (error as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

async function getProjectById(id: string) {
    try {
        const blob = await head(`projects/${id}.json`);
        const response = await fetch(blob.url);

        if (!response.ok) {
             return new Response(JSON.stringify({ message: 'Project not found' }), { status: 404 });
        }
        const projectData: Project = await response.json();
        return new Response(JSON.stringify(projectData), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error: any) {
        if (error.status === 404 || error.message.includes('404')) {
            return new Response(JSON.stringify({ message: 'Project not found' }), { status: 404 });
        }
        return new Response(JSON.stringify({ message: 'Failed to fetch project', error: error.message }), { status: 500 });
    }
}

async function createProject(request: Request) {
     try {
        const body = await request.json();
        const { name, ...data } = body;
        
        if (!name) {
            return new Response(JSON.stringify({ message: 'Project name is required' }), { status: 400 });
        }
        
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        
        const newProject: Project = { id, name, createdAt: now, updatedAt: now, ...data };

        await put(`projects/${id}.json`, JSON.stringify(newProject), {
            access: 'public', contentType: 'application/json', addRandomSuffix: false,
        });

        return new Response(JSON.stringify(newProject), { status: 201 });

    } catch (error) {
        return new Response(JSON.stringify({ message: 'Failed to create project', error: (error as Error).message }), { status: 500 });
    }
}

async function updateProject(id: string, request: Request) {
    try {
        const body = await request.json();
        
        const headBlob = await head(`projects/${id}.json`);
        const fetchRes = await fetch(headBlob.url);
        if (!fetchRes.ok) throw new Error('Original project not found for update.');
        const originalProject: Project = await fetchRes.json();

        const updatedProject: Project = {
            ...originalProject, ...body, id, updatedAt: new Date().toISOString(),
        };

        await put(`projects/${id}.json`, JSON.stringify(updatedProject), {
            access: 'public', contentType: 'application/json', addRandomSuffix: false,
        });

        return new Response(JSON.stringify(updatedProject), { status: 200 });

    } catch (error) {
         return new Response(JSON.stringify({ message: 'Failed to update project', error: (error as Error).message }), { status: 500 });
    }
}
