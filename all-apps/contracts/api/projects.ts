// This Vercel Edge Function handles all project-related API requests.
// It uses the `@vercel/blob` SDK to simplify interactions with Vercel Blob Storage.
import { list, put, del } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// Helper function to create a standardized error response
const createErrorResponse = (message: string, status: number, details?: string) => {
    return new Response(JSON.stringify({ error: message, details }), { 
        status, 
        headers: { 'Content-Type': 'application/json' }
    });
};

/**
 * Handles GET requests.
 * - If a 'url' query parameter is provided, it fetches a single project's data.
 * - Otherwise, it lists all available projects.
 */
async function handleGet(request: Request) {
    const { searchParams } = new URL(request.url);
    const blobUrl = searchParams.get('url');

    // --- GET SINGLE PROJECT ---
    if (blobUrl) {
        try {
            const response = await fetch(blobUrl); // Blobs are public, so no token needed for GET
            if (!response.ok) {
                return createErrorResponse('Failed to fetch project data from blob store.', response.status, await response.text());
            }
            const projectData = await response.json();
            return new Response(JSON.stringify(projectData), { 
                status: 200, 
                headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' } 
            });
        } catch (error: any) {
            return createErrorResponse('Internal Server Error while fetching a project.', 500, error.message);
        }
    }

    // --- LIST ALL PROJECTS ---
    else {
        try {
            const { blobs } = await list({ prefix: 'projects/', mode: 'folded' });
            const jsonBlobs = blobs.filter(blob => blob.pathname.endsWith('.json'));
            
            const projectPromises = jsonBlobs.map(async (blob) => {
                try {
                    const projectContentResponse = await fetch(blob.url);
                    if (!projectContentResponse.ok) return null;
                    const projectData = await projectContentResponse.json();
                    return { id: blob.pathname, name: projectData.name || "Unnamed Project", updatedAt: blob.uploadedAt.toISOString(), url: blob.url };
                } catch (e) {
                    return null; // Ignore blobs that fail to parse
                }
            });

            let projects = (await Promise.all(projectPromises)).filter(p => p !== null) as any[];
            projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

            return new Response(JSON.stringify(projects), { 
                status: 200, 
                headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
            });
        } catch (error: any) {
             return createErrorResponse('Internal Server Error while listing projects.', 500, error.message);
        }
    }
}

/**
 * Handles POST requests to save (create or update) a project.
 */
async function handlePost(request: Request) {
    try {
        const projectData = await request.json();
        if (!projectData || !projectData.name) {
            return createErrorResponse('Invalid project data. "name" is required.', 400);
        }
        
        // Use existing ID or create a new unique pathname
        const pathname = projectData.id || `projects/${projectData.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}-${Date.now()}.json`;
        
        const blob = await put(pathname, JSON.stringify(projectData), {
            access: 'public',
            addRandomSuffix: false, // Use the exact pathname we constructed
        });

        const projectSummary = {
            id: blob.pathname,
            name: projectData.name,
            updatedAt: new Date().toISOString(),
            url: blob.url,
        };
        
        return new Response(JSON.stringify(projectSummary), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });
    } catch (error: any) {
        return createErrorResponse('Internal Server Error while saving project.', 500, error.message);
    }
}

/**
 * Handles DELETE requests to remove a project.
 */
async function handleDelete(request: Request) {
    const { searchParams } = new URL(request.url);
    const blobUrl = searchParams.get('url');

    if (!blobUrl) {
        return createErrorResponse('Missing "url" parameter for deletion.', 400);
    }

    try {
        await del(blobUrl);
        return new Response(JSON.stringify({ success: true, message: 'Project deleted.' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        return createErrorResponse('Failed to delete project from blob storage.', 500, error.message);
    }
}


/**
 * Main request handler, routes requests based on HTTP method.
 */
export default async function handler(request: Request) {
    if (!BLOB_READ_WRITE_TOKEN) {
        return createErrorResponse('The BLOB_READ_WRITE_TOKEN environment variable is not set.', 500, 'This is required for all storage operations.');
    }

    switch (request.method) {
        case 'GET':
            return handleGet(request);
        case 'POST':
            return handlePost(request);
        case 'DELETE':
            return handleDelete(request);
        default:
            return new Response('Method Not Allowed', { status: 405, headers: { 'Allow': 'GET, POST, DELETE' } });
    }
}