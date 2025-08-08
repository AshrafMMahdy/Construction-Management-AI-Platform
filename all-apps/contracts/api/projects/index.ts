import { list, put } from '@vercel/blob';
import type { Project, ProjectSummary } from '../../types';

export const runtime = 'edge';

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
        const { blobs } = await list({ prefix: 'projects/', mode: 'folded' });
        
        const projectSummaries: ProjectSummary[] = blobs
            .filter(blob => blob.pathname.endsWith('.json')) // Ensure we only process JSON files
            .map(blob => ({
                id: blob.pathname, // Use the pathname as the unique ID
                name: blob.pathname
                    .replace('projects/', '')
                    .replace('.json', '')
                    .replace(/-[0-9]+$/, '') // Remove timestamp suffix
                    .replace(/-/g, ' '), // Replace dashes with spaces for display
                updatedAt: blob.uploadedAt.toISOString(),
                url: blob.url, // URL for fetching content
            }));
        
        // Sort by most recently updated
        projectSummaries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        return new Response(JSON.stringify(projectSummaries), {
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
            url: blob.url,
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
