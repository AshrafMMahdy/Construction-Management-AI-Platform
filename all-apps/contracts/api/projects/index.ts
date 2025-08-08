
import { list, put } from '@vercel/blob';
import type { Project, ProjectSummary } from '../../types';

// NOTE: This function runs on the default Serverless runtime for better compatibility with the list() function.
// export const runtime = 'edge'; // Removed to use Serverless runtime

// Helper to create a standardized error response
const createErrorResponse = (message: string, status: number) => {
    return new Response(JSON.stringify({ error: message }), { 
        status, 
        headers: { 'Content-Type': 'application/json' }
    });
};

// GET /api/projects - Lists all projects
export async function GET(request: Request): Promise<Response> {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return createErrorResponse('Storage environment variables not configured.', 500);
    }
    try {
        const { blobs } = await list({ prefix: 'projects/' });
        
        const projectBlobs = blobs.filter(blob => blob.pathname.endsWith('.json'));

        const projectSummariesPromises = projectBlobs.map(async (blob): Promise<ProjectSummary | null> => {
            try {
                const response = await fetch(blob.url);
                if (!response.ok) {
                    console.error(`Failed to fetch blob content from ${blob.url}: ${response.statusText}`);
                    return null; // Skip this blob if it can't be fetched
                }
                const project: Project = await response.json();
                
                // Validate that the fetched content looks like our project
                if (typeof project.name !== 'string' || !project.id) {
                    console.warn(`Blob at ${blob.url} is not a valid project file.`);
                    return null;
                }

                return {
                    id: blob.pathname, // The ID is always the pathname
                    name: project.name, // The name comes from the file content, which is robust
                    updatedAt: blob.uploadedAt.toISOString(),
                };
            } catch (fetchError) {
                console.error(`Error fetching or parsing blob from ${blob.url}:`, fetchError);
                return null; // Skip if parsing fails
            }
        });
        
        const settledSummaries = await Promise.all(projectSummariesPromises);
        const validSummaries = settledSummaries.filter((p): p is ProjectSummary => p !== null);

        // Sort by most recently updated
        validSummaries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        return new Response(JSON.stringify(validSummaries), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        });

    } catch (error) {
        console.error('Error listing projects:', error);
        return createErrorResponse('Failed to fetch projects.', 500);
    }
}

// POST /api/projects - Creates a new project
export async function POST(request: Request): Promise<Response> {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return createErrorResponse('Storage environment variables not configured.', 500);
    }
    try {
        const projectData = (await request.json()) as Omit<Project, 'id'>;
        if (!projectData.name) {
            return createErrorResponse('Project name is required.', 400);
        }

        const safeName = projectData.name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
        const pathname = `projects/${safeName}-${Date.now()}.json`;

        // The full project data to save, now including its own ID/pathname
        const finalProject: Project = { ...projectData, id: pathname };

        const blob = await put(pathname, JSON.stringify(finalProject), {
            access: 'public',
            contentType: 'application/json',
            addRandomSuffix: false,
        });

        const summary: ProjectSummary = {
            id: blob.pathname,
            name: projectData.name,
            updatedAt: new Date().toISOString(),
        };

        return new Response(JSON.stringify(summary), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error saving project:', error);
        return createErrorResponse('Failed to save project.', 500);
    }
}