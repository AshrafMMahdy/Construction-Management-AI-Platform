
import { head, put, del } from '@vercel/blob';
import type { Project, ProjectSummary } from '../../../types';

export const runtime = 'edge';

// Helper to get the pathname from the request URL
// e.g., /api/projects/projects%2Fmy-project-123.json -> projects/my-project-123.json
const getPathnameFromRequest = (request: Request): string | null => {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    return id ? decodeURIComponent(id) : null;
};

// Helper to create a standardized error response
const createErrorResponse = (message: string, status: number) => {
    return new Response(JSON.stringify({ error: message }), { 
        status, 
        headers: { 'Content-Type': 'application/json' }
    });
};

// GET /api/projects/[id] - Fetches a single project's full data
export async function GET(request: Request): Promise<Response> {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return createErrorResponse('Storage environment variables not configured.', 500);
    }
    const pathname = getPathnameFromRequest(request);
    if (!pathname) {
        return createErrorResponse('Project ID is missing from the URL.', 400);
    }

    try {
        // Fetch the blob's metadata to get its public URL
        const blobInfo = await head(pathname);
        if (!blobInfo) {
            return createErrorResponse('Project not found.', 404);
        }

        // Fetch the actual content from the public URL
        const response = await fetch(blobInfo.url);
        if (!response.ok) {
            return createErrorResponse('Failed to fetch project content.', 500);
        }
        const projectData = await response.json();

        return new Response(JSON.stringify(projectData), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        });

    } catch (error) {
        console.error(`Error fetching project ${pathname}:`, error);
        return createErrorResponse('Failed to fetch project.', 500);
    }
}

// PUT /api/projects/[id] - Updates an existing project
export async function PUT(request: Request): Promise<Response> {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return createErrorResponse('Storage environment variables not configured.', 500);
    }
    const pathname = getPathnameFromRequest(request);
    if (!pathname) {
        return createErrorResponse('Project ID is missing from the URL.', 400);
    }
    
    try {
        const projectData = (await request.json()) as Project;
         if (!projectData.name || !projectData.id || !projectData.createdAt) {
            return createErrorResponse('Project data is malformed. Missing name, id, or createdAt.', 400);
        }

        const blob = await put(pathname, JSON.stringify(projectData), {
            access: 'public',
            contentType: 'application/json',
            addRandomSuffix: false, // Must not change the name on update
        });

        const summary: ProjectSummary = {
            id: blob.pathname,
            name: projectData.name,
            createdAt: projectData.createdAt,
        };

        return new Response(JSON.stringify(summary), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error(`Error updating project ${pathname}:`, error);
        return createErrorResponse('Failed to update project.', 500);
    }
}


// DELETE /api/projects/[id] - Deletes a project
export async function DELETE(request: Request): Promise<Response> {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return createErrorResponse('Storage environment variables not configured.', 500);
    }
    const pathname = getPathnameFromRequest(request);
    if (!pathname) {
        return createErrorResponse('Project ID is missing from the URL.', 400);
    }

    try {
        await del(pathname); // del works with just the pathname
        return new Response(null, { status: 204 }); // Success, no content
    } catch (error: any) {
        // Vercel Blob's del does not error on 404, so we just log other errors
        console.error(`Error deleting project ${pathname}:`, error);
        return createErrorResponse('Failed to delete project.', 500);
    }
}
