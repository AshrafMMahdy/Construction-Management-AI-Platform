
import { put, list } from '@vercel/blob';
import type { SavedProject } from '../../types';

export const runtime = 'edge';

export async function GET(request: Request): Promise<Response> {
    try {
        const { blobs } = await list({ prefix: 'projects/', mode: 'folded' });
        
        const projectBlobs = blobs.filter(blob => blob.pathname.endsWith('.json'));

        const projects: (SavedProject | null)[] = await Promise.all(
            projectBlobs.map(async (blob) => {
                try {
                    const response = await fetch(blob.url);
                    if (!response.ok) {
                        console.error(`Failed to fetch blob content from ${blob.url}: ${response.statusText}`);
                        return null; 
                    }
                    return await response.json();
                } catch (fetchError) {
                    console.error(`Error fetching or parsing blob from ${blob.url}:`, fetchError);
                    return null;
                }
            })
        );
        
        const validProjects = projects.filter((p): p is SavedProject => p !== null);

        return new Response(JSON.stringify(validProjects), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error listing projects:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return new Response(JSON.stringify({ error: 'Failed to fetch projects', details: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

export async function POST(request: Request): Promise<Response> {
    try {
        const project = (await request.json()) as SavedProject;
        if (!project.id || !project.name) {
            return new Response(JSON.stringify({ error: 'Missing project id or name' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const pathname = `projects/${project.id}.json`;

        const blob = await put(pathname, JSON.stringify(project), {
            access: 'public',
            contentType: 'application/json',
        });

        return new Response(JSON.stringify(blob), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error saving project:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return new Response(JSON.stringify({ error: 'Failed to save project', details: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
