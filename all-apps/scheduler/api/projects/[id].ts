
import { del, put } from '@vercel/blob';
import type { SavedProject } from '../../types';

export const runtime = 'edge';

const getPathnameFromRequest = (request: Request) => {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    if (!id) return { id: null, pathname: null };
    return { id, pathname: `projects/${id}.json` };
}

export async function DELETE(request: Request): Promise<Response> {
    const { id, pathname } = getPathnameFromRequest(request);

    if (!id || !pathname) {
        return new Response(JSON.stringify({ error: 'ID is missing' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }

    try {
        const blobUrl = `${process.env.BLOB_URL}/${pathname}`;
        await del(blobUrl);
        return new Response(null, { status: 204 });
    } catch (error: any) {
        // Vercel Blob's del does not error on 404, so we just log other errors
        console.error(`Error deleting project ${id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return new Response(JSON.stringify({ error: 'Failed to delete project', details: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

export async function PUT(request: Request): Promise<Response> {
    const { id, pathname } = getPathnameFromRequest(request);

    if (!id || !pathname) {
        return new Response(JSON.stringify({ error: 'ID is missing' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }
    
    try {
        const updatedProjectData = await request.json() as Partial<SavedProject>;
        const blobUrl = `${process.env.BLOB_URL}/${pathname}`;
        
        const response = await fetch(blobUrl);
        if (response.status === 404) {
             return new Response(JSON.stringify({ error: 'Project not found' }), { status: 404, headers: { 'Content-Type': 'application/json' }});
        }
        if (!response.ok) {
            return new Response(JSON.stringify({ error: `Failed to fetch existing project data (status: ${response.status})` }), { status: 500, headers: { 'Content-Type': 'application/json' }});
        }

        const existingProject = await response.json() as SavedProject;
        
        // Merge the existing project with the updates.
        // New data from the request body takes precedence, preserving other apps' data.
        const newProjectState: SavedProject = {
            ...existingProject,
            ...updatedProjectData,
        };

        const updatedBlob = await put(pathname, JSON.stringify(newProjectState), {
            access: 'public',
            contentType: 'application/json',
            allowOverwrite: true, // Explicitly allow overwriting the blob
        });

        return new Response(JSON.stringify(updatedBlob), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error(`Error updating project ${id}:`, error);
         const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return new Response(JSON.stringify({ error: 'Failed to update project', details: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
