
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

        // Check for scheduler project format and normalize it
        if (projectData.projectInput && projectData.generatedSchedule) {
            const normalizedProject: Project = {
                id: projectData.id,
                name: projectData.name,
                appOrigin: 'scheduler',
                createdAt: projectData.createdAt,
                updatedAt: projectData.createdAt, // No 'updatedAt' in source
                scheduleData: projectData.historicalData || '',
                scheduleFileName: projectData.fileName || '',
                analysisMethod: 'as-built-vs-planned',
                additionalDocs: [],
                report: null,
            };
            return new Response(JSON.stringify(normalizedProject), { status: 200, headers });
        }

        // Check for contract analysis project format and normalize it
        if (projectData.contractFile && projectData.analysisResults) {
            let additionalDocs: AdditionalDocData[] = [];
            try {
                if (projectData.historicalData && typeof projectData.historicalData === 'string') {
                    const clauses = JSON.parse(projectData.historicalData);
                    if (Array.isArray(clauses)) {
                        const content = clauses.map((c: any) => c.clauseText || '').join('\n\n---\n\n');
                        additionalDocs.push({
                            name: projectData.fileName || 'Contract Clauses.txt',
                            category: 'Contract',
                            content: content
                        });
                    }
                }
            } catch (e) {
                console.error("Could not parse historicalData from contract project:", e);
            }
            
            const normalizedProject: Project = {
                id: projectData.id,
                name: projectData.name,
                appOrigin: 'contract-analysis',
                createdAt: projectData.createdAt,
                updatedAt: projectData.createdAt,
                scheduleData: '',
                scheduleFileName: '',
                analysisMethod: 'as-built-vs-planned',
                additionalDocs,
                report: null,
            };
            return new Response(JSON.stringify(normalizedProject), { status: 200, headers });
        }

        // Default: Assume it's a native delay-analysis project and ensure fields
        const nativeProject: Project = {
            ...projectData,
            analysisMethod: projectData.analysisMethod || 'as-built-vs-planned',
            additionalDocs: projectData.additionalDocs || [],
            report: projectData.report || null,
            scheduleData: projectData.scheduleData || '',
            scheduleFileName: projectData.scheduleFileName || ''
        };
        return new Response(JSON.stringify(nativeProject), { status: 200, headers });

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

        const mergedData: Project = { 
            id: originalProject.id,
            name: originalProject.name,
            createdAt: originalProject.createdAt,
            appOrigin: 'delay-analysis',
            updatedAt: new Date().toISOString(),
            // Provide defaults for all fields to create a valid Project object
            scheduleData: originalProject.scheduleData || '',
            scheduleFileName: originalProject.scheduleFileName || '',
            analysisMethod: originalProject.analysisMethod || 'as-built-vs-planned',
            additionalDocs: originalProject.additionalDocs || [],
            report: originalProject.report || null,
        };

        Object.assign(mergedData, body);

        // Ensure critical metadata is correct after merging
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
