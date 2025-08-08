
// This file is intended for a Vercel Serverless Function environment.
// It uses the Vercel Blob SDK and standard Request/Response APIs.
// @ts-ignore - Vercel Blob is available in the Vercel environment
import { list, put } from '@vercel/blob';
import { Project, ProjectSummary } from '../../types';

export const runtime = 'edge';

// GET /api/projects - Lists all project summaries
export async function GET(request: Request) {
    try {
        const { blobs } = await list({ prefix: 'projects/', mode: 'folded' });

        const projects: ProjectSummary[] = (await Promise.all(
            blobs
                .filter(blob => blob.pathname.endsWith('.json'))
                .map(async (blob) => {
                    try {
                        const response = await fetch(blob.url);
                        if (!response.ok) return null; // Skip if fetch fails
                        const projectData: Project = await response.json();
                        return { id: projectData.id, name: projectData.name };
                    } catch {
                        return null; // Skip if parsing fails
                    }
                })
        )).filter((p): p is ProjectSummary => p !== null); // Filter out any nulls from failed fetches/parses

        // Sort projects by name, alphabetically
        projects.sort((a, b) => a.name.localeCompare(b.name));

        return new Response(JSON.stringify(projects), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ message: 'Failed to list projects', error: (error as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// POST /api/projects - Creates a new project
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, ...data } = body;
        
        if (!name) {
            return new Response(JSON.stringify({ message: 'Project name is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        
        const newProject: Project = {
            id,
            name,
            createdAt: now,
            updatedAt: now,
            ...data
        };

        await put(`projects/${id}.json`, JSON.stringify(newProject), {
            access: 'public',
            contentType: 'application/json',
            addRandomSuffix: false,
        });

        return new Response(JSON.stringify(newProject), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ message: 'Failed to create project', error: (error as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
