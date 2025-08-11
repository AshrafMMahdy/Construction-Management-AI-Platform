
// This file is intended for a Vercel Serverless Function environment.
// It uses the Vercel Blob SDK and standard Request/Response APIs.
// @ts-ignore - Vercel Blob is available in the Vercel environment
import { put, head } from '@vercel/blob';
import { Project, AdditionalDocData } from '../../types';

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
        const blob = await head(`projects/${id}.json`);
        const response = await fetch(blob.url, { cache: 'no-store' });

        if (!response.ok) {
             return new Response(JSON.stringify({ message: 'Project not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        const projectData: any = await response.json();
        const headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        };

        // This will be the final, normalized project object sent to the client.
        const resultProject: Project = {
            id: projectData.id,
            name: projectData.name,
            createdAt: projectData.createdAt,
            updatedAt: projectData.updatedAt || projectData.createdAt,
            appOrigin: projectData.appOrigin, // Start with original, will overwrite if needed
            // Default values
            scheduleData: '',
            scheduleFileName: '',
            analysisMethod: 'as-built-vs-planned',
            additionalDocs: [],
            report: null,
        };

        // DATA LOADING PRECEDENCE:
        // 1. New nested format (highest priority)
        // 2. Old flat format (for backward compatibility)
        // 3. Other app formats (for initial import)

        if (projectData.delayAnalysisData) {
            // PRIORITY 1: Found data in the new nested format. This is the most authoritative source.
            const dataSource = projectData.delayAnalysisData;
            resultProject.appOrigin = 'delay-analysis';
            resultProject.scheduleData = dataSource.scheduleData || '';
            resultProject.scheduleFileName = dataSource.scheduleFileName || '';
            resultProject.analysisMethod = dataSource.analysisMethod || 'as-built-vs-planned';
            resultProject.additionalDocs = dataSource.additionalDocs || [];
            resultProject.report = dataSource.report || null;
        } 
        else if (projectData.scheduleData) {
            // PRIORITY 2: Found legacy flat-file data from this app.
            resultProject.appOrigin = 'delay-analysis';
            resultProject.scheduleData = projectData.scheduleData || '';
            resultProject.scheduleFileName = projectData.scheduleFileName || '';
            resultProject.analysisMethod = projectData.analysisMethod || 'as-built-vs-planned';
            resultProject.additionalDocs = projectData.additionalDocs || [];
            resultProject.report = projectData.report || null;
        }
        else if (projectData.projectInput && projectData.generatedSchedule) {
            // PRIORITY 3: Import from a scheduler app project.
            resultProject.appOrigin = 'scheduler';
            resultProject.scheduleData = projectData.historicalData || '';
            resultProject.scheduleFileName = projectData.fileName || '';
        }
        else if (projectData.contractFile && projectData.analysisResults) {
            // PRIORITY 4: Import from a contract analysis app project.
            resultProject.appOrigin = 'contract-analysis';
            try {
                if (projectData.historicalData && typeof projectData.historicalData === 'string') {
                    const clauses = JSON.parse(projectData.historicalData);
                    if (Array.isArray(clauses)) {
                        const content = clauses.map((c: any) => c.clauseText || '').join('\n\n---\n\n');
                        resultProject.additionalDocs.push({
                            name: projectData.fileName || 'Contract Clauses.txt',
                            category: 'Contract',
                            content: content
                        });
                    }
                }
            } catch (e) {
                console.error("Could not parse historicalData from contract project:", e);
            }
        }

        return new Response(JSON.stringify(resultProject), { status: 200, headers });

    } catch (error: any) {
        if (error.status === 404 || error.message.includes('404')) {
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
        
        const headBlob = await head(`projects/${id}.json`);
        const fetchRes = await fetch(headBlob.url, { cache: 'no-store' });
        if (!fetchRes.ok) throw new Error('Original project not found for update.');
        const originalProject: any = await fetchRes.json();
        
        const { name, scheduleData, scheduleFileName, analysisMethod, additionalDocs, report } = body;

        // Prepare the data payload specific to this application
        const delayAnalysisPayload = {
            scheduleData,
            scheduleFileName,
            analysisMethod,
            additionalDocs,
            report,
        };

        const updatedProjectFile = {
            ...originalProject,
            name: name || originalProject.name, // Update name if provided from body
            updatedAt: new Date().toISOString(),
            appOrigin: 'delay-analysis', // Mark this app as the last one to edit it.
            delayAnalysisData: { // Nest our app's data
                ...(originalProject.delayAnalysisData || {}),
                ...delayAnalysisPayload,
            },
        };
        
        // Clean up legacy top-level fields to migrate to the new nested structure
        delete updatedProjectFile.scheduleData;
        delete updatedProjectFile.scheduleFileName;
        delete updatedProjectFile.analysisMethod;
        delete updatedProjectFile.additionalDocs;
        delete updatedProjectFile.report;

        await put(`projects/${id}.json`, JSON.stringify(updatedProjectFile), {
            access: 'public',
            contentType: 'application/json',
            addRandomSuffix: false,
            allowOverwrite: true, // Explicitly allow overwrite
        });

        // The client expects a flat Project structure, so we normalize the response
        const responseProject: Project = {
            id: updatedProjectFile.id,
            name: updatedProjectFile.name,
            appOrigin: updatedProjectFile.appOrigin,
            createdAt: originalProject.createdAt,
            updatedAt: updatedProjectFile.updatedAt,
            scheduleData: delayAnalysisPayload.scheduleData ?? '',
            scheduleFileName: delayAnalysisPayload.scheduleFileName ?? '',
            analysisMethod: delayAnalysisPayload.analysisMethod ?? 'as-built-vs-planned',
            additionalDocs: delayAnalysisPayload.additionalDocs ?? [],
            report: delayAnalysisPayload.report ?? null,
        };

        return new Response(JSON.stringify(responseProject), {
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
