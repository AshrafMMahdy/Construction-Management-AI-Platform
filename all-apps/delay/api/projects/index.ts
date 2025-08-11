
// This file is intended for a Vercel Serverless Function environment.
// It uses the Vercel Blob SDK and standard Request/Response APIs.
// @ts-ignore - Vercel Blob is available in the Vercel environment
import { list, put } from '@vercel/blob';
import { Project, ProjectSummary, AppOrigin } from '../../types';

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
                        const response = await fetch(blob.url, { cache: 'no-store' });
                        if (!response.ok) return null; // Skip if fetch fails
                        const projectData: any = await response.json();
                        
                        // Validate that id and name exist before creating the summary
                        if (projectData && typeof projectData.id === 'string' && typeof projectData.name === 'string') {
                            let appOrigin: AppOrigin | undefined;
                            if (projectData.appOrigin) {
                                appOrigin = projectData.appOrigin;
                            } else if (projectData.projectInput && projectData.generatedSchedule) {
                                appOrigin = 'scheduler';
                            } else if (projectData.contractFile && projectData.analysisResults) {
                                appOrigin = 'contract-analysis';
                            } else if (projectData.scheduleData || projectData.delayAnalysisData) { // Check for old or new format
                                appOrigin = 'delay-analysis';
                            }
                            return { id: projectData.id, name: projectData.name, appOrigin };
                        }
                        return null; // Skip if data is malformed
                    } catch {
                        return null; // Skip if parsing fails
                    }
                })
        )).filter((p: any): p is ProjectSummary => p !== null); // Filter out any nulls

        // Sort projects by name, alphabetically
        projects.sort((a, b) => a.name.localeCompare(b.name));

        return new Response(JSON.stringify(projects), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
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
        
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return new Response(JSON.stringify({ message: 'Project name is required and cannot be empty.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        
        const projectFile = {
            id,
            name: name.trim(),
            appOrigin: 'delay-analysis',
            createdAt: now,
            updatedAt: now,
            delayAnalysisData: {
                scheduleData: data.scheduleData || '',
                scheduleFileName: data.scheduleFileName || '',
                analysisMethod: data.analysisMethod || 'as-built-vs-planned',
                additionalDocs: data.additionalDocs || [],
                report: data.report || null,
            }
        };

        await put(`projects/${id}.json`, JSON.stringify(projectFile), {
            access: 'public',
            contentType: 'application/json',
            addRandomSuffix: false,
        });
        
        // The client expects a flat Project structure, so we normalize the response.
        const responseProject: Project = {
            id: projectFile.id,
            name: projectFile.name,
            appOrigin: 'delay-analysis',
            createdAt: now,
            updatedAt: now,
            scheduleData: projectFile.delayAnalysisData.scheduleData,
            scheduleFileName: projectFile.delayAnalysisData.scheduleFileName,
            analysisMethod: projectFile.delayAnalysisData.analysisMethod,
            additionalDocs: projectFile.delayAnalysisData.additionalDocs,
            report: projectFile.delayAnalysisData.report,
        };

        return new Response(JSON.stringify(responseProject), {
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
