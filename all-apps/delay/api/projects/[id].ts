// This file is intended for a Vercel Serverless Function environment.
// It uses the Vercel Blob SDK and standard Request/Response APIs.
// @ts-ignore - Vercel Blob is available in the Vercel environment
import { put, head } from '@vercel/blob';
import { Project } from '../../types';

export const runtime = 'edge';

function getIdFromRequest(request: Request): string | null {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    // Assumes URL is /api/projects/[id]
    const id = pathParts[3];
    return id || null;
}

// GET /api/projects/[id] - Fetches a single project
export async function GET(request: Request) {
    const id = getIdFromRequest(request);

    if (!id) {
        return new Response(JSON.stringify({ message: 'Project ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    try {
        // Vercel Blob SDK's head/get does not work with full URL, needs pathname
        const blob = await head(`projects/${id}.json`);
        // We can fetch directly from the public URL, ensuring we don't get a cached version
        const response = await fetch(blob.url, { cache: 'no-store' });

        if (!response.ok) {
             return new Response(JSON.stringify({ message: 'Project not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        const projectData: Project = await response.json();
        return new Response(JSON.stringify(projectData), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });

    } catch (error: any) {
        // The `head` method throws an error for 404s
        if (error.status === 404) {
            return new Response(JSON.stringify({ message: 'Project not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ message: 'Failed to fetch project', error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// PUT /api/projects/[id] - Updates an existing project
export async function PUT(request: Request) {
    const id = getIdFromRequest(request);

    if (!id) {
        return new Response(JSON.stringify({ message: 'Project ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const body = await request.json();
        
        // Fetch existing project to preserve creation date
        const headBlob = await head(`projects/${id}.json`);
        const fetchRes = await fetch(headBlob.url, { cache: 'no-store' });
        if (!fetchRes.ok) throw new Error('Original project not found for update.');
        const originalProject: Project = await fetchRes.json();

        // Create a mutable copy of the original project data
        const mergedData: Project = { ...originalProject };

        // Overwrite with new data from the request body
        Object.assign(mergedData, body);

        // Forcefully set critical metadata to ensure it's identified correctly
        mergedData.appOrigin = 'delay-analysis';
        mergedData.id = id;
        mergedData.updatedAt = new Date().toISOString();


        await put(`projects/${id}.json`, JSON.stringify(mergedData), {
            access: 'public',
            contentType: 'application/json',
            addRandomSuffix: false,
        });

        return new Response(JSON.stringify(mergedData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
         return new Response(JSON.stringify({ message: 'Failed to update project', error: (error as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
