
import { list, put } from '@vercel/blob';
import type { Project, ProjectSummary } from '../../types';

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
                    return null;
                }
                const project: Project = await response.json();
                
                if (typeof project.name !== 'string' || !project.id || !project.createdAt) {
                    console.warn(`Blob at ${blob.url} is not a valid project file.`);
                    return null;
                }

                return {
                    id: blob.pathname,
                    name: project.name,
                    createdAt: project.createdAt,
                };
            } catch (fetchError) {
                console.error(`Error fetching or parsing blob from ${blob.url}:`, fetchError);
                return null;
            }
        });
        
        const settledSummaries = await Promise.all(projectSummariesPromises);
        const validSummaries = settledSummaries.filter((p): p is ProjectSummary => p !== null);

        // Sort by most recently created
        validSummaries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
        const newProjectData = await request.json();

        if (!newProjectData || typeof newProjectData.name !== 'string' || newProjectData.name.trim() === '') {
            return createErrorResponse('Project name is required and must be a non-empty string.', 400);
        }
        
        const timestamp = new Date().toISOString();
        const pathname = `projects/${timestamp}.json`;

        const finalProject: Project = {
            ...newProjectData,
            id: timestamp,
            createdAt: timestamp,
        };

        const blob = await put(pathname, JSON.stringify(finalProject), {
            access: 'public',
            contentType: 'application/json',
            addRandomSuffix: false,
        });

        const summary: ProjectSummary = {
            id: blob.pathname,
            name: finalProject.name,
            createdAt: finalProject.createdAt,
        };

        return new Response(JSON.stringify(summary), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error saving project:', error);
        if (error instanceof SyntaxError) {
             return createErrorResponse('Invalid JSON format in request body.', 400);
        }
        return createErrorResponse('Failed to save project.', 500);
    }
}
