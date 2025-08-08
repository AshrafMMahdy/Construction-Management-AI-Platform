// This Vercel Edge Function handles all project-related API requests.
// It acts as a secure backend for listing, fetching, and saving project data
// to and from Vercel Blob Storage.

export const config = {
  runtime: 'edge',
};

/**
 * Handles GET requests.
 * - If a 'url' query parameter is provided, it fetches a single project's data.
 * - Otherwise, it lists all available projects.
 */
async function handleGet(request: Request) {
    const { searchParams } = new URL(request.url);
    const blobUrl = searchParams.get('url');
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
        return new Response(JSON.stringify({ error: 'Storage token not configured on server.' }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    // --- GET SINGLE PROJECT ---
    if (blobUrl) {
        try {
            // The download URL may or may not require a token depending on blob settings,
            // but it's safer to include it.
            const response = await fetch(blobUrl, { headers: { 'Authorization': `Bearer ${blobToken}` }});
            if (!response.ok) {
                const errorText = await response.text();
                return new Response(JSON.stringify({ error: 'Failed to fetch project data from blob store.', details: errorText }), { 
                    status: response.status, 
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            const projectData = await response.json();
            return new Response(JSON.stringify(projectData), { 
                status: 200, 
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                } 
            });
        } catch (error: any) {
            console.error('Error getting single project:', error);
            return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), { 
                status: 500, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }
    }

    // --- LIST ALL PROJECTS ---
    else {
        try {
            // Use the direct Vercel Blob API for listing.
            const listUrl = `https://blob.vercel-storage.com?prefix=projects/`;
            const response = await fetch(listUrl, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${blobToken}` },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Vercel Blob list error:', errorText);
                return new Response(JSON.stringify({ error: 'Failed to list blobs from Vercel.', details: errorText }), { 
                    status: response.status, 
                    headers: { 'Content-Type': 'application/json' } 
                });
            }

            const listResult = await response.json();
            const jsonBlobs = (listResult.blobs || []).filter((blob: any) => blob.pathname && blob.pathname.endsWith('.json'));

            // For each blob, fetch its content to read the project name from inside the JSON.
            const projectPromises = jsonBlobs.map(async (blob: any) => {
                try {
                    const projectContentResponse = await fetch(blob.url, { 
                        headers: { 
                            'Authorization': `Bearer ${blobToken}`,
                            'Cache-Control': 'no-cache' // Ensure we get fresh content
                        }
                    });
                    
                    if (!projectContentResponse.ok) {
                        console.warn(`Could not fetch content for ${blob.pathname}. Using filename as fallback.`);
                        // Fallback to old logic if fetching fails
                        return {
                            id: blob.pathname,
                            name: blob.pathname.replace(/^projects\//, '').replace(/-\d+\.json$/, '').replace(/-/g, ' '),
                            updatedAt: blob.uploadedAt,
                            url: blob.url,
                        };
                    }
                    
                    const projectData = await projectContentResponse.json();
                    
                    return {
                        id: blob.pathname,
                        name: projectData.name || "Unnamed Project", // Use name from JSON, with a fallback
                        updatedAt: blob.uploadedAt,
                        url: blob.url,
                    };
                } catch (e) {
                    console.error(`Error processing project blob ${blob.pathname}:`, e);
                    // In case of JSON parsing error, return a fallback object with an error indicator in the name.
                    return {
                        id: blob.pathname,
                        name: `[Parse Error] ${blob.pathname.replace(/^projects\//, '').replace(/-/g, ' ')}`,
                        updatedAt: blob.uploadedAt,
                        url: blob.url,
                    };
                }
            });

            let projects = await Promise.all(projectPromises);
            
            projects.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

            return new Response(JSON.stringify(projects), { 
                status: 200, 
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                } 
            });
        } catch (error: any) {
            console.error('Error listing all projects:', error);
            return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), { 
                status: 500, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }
    }
}

/**
 * Handles POST requests to save (create or update) a project.
 */
async function handlePost(request: Request) {
    const blobApiUrl = process.env.BLOB_URL;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobApiUrl || !blobToken) {
        return new Response(JSON.stringify({ error: 'Storage environment variables not configured.' }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    try {
        const projectData = await request.json();

        if (!projectData || !projectData.name) {
            return new Response(JSON.stringify({ error: 'Invalid project data. "name" is required.' }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }
        
        // Use existing ID for updates, or create a new unique pathname for new projects.
        const pathname = projectData.id || `projects/${projectData.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}-${Date.now()}.json`;
        const uploadUrl = `${blobApiUrl}/${pathname}`;

        const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${blobToken}`,
                'Content-Type': 'application/json',
                'x-vercel-blob-content-type': 'application/json',
            },
            body: JSON.stringify(projectData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Vercel Blob save error:', errorText);
            return new Response(JSON.stringify({ error: 'Failed to save blob.', details: errorText }), { 
                status: response.status, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        const blobResult = await response.json();
        const projectSummary = {
            id: blobResult.pathname,
            name: projectData.name,
            updatedAt: blobResult.uploadedAt,
            url: blobResult.url,
        };
        
        return new Response(JSON.stringify(projectSummary), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });
    } catch (error: any) {
        console.error('Error saving project:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
}

/**
 * Main request handler, routes requests based on HTTP method.
 */
export default async function handler(request: Request) {
    switch (request.method) {
        case 'GET':
            return handleGet(request);
        case 'POST':
            return handlePost(request);
        default:
            return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
                status: 405,
                headers: { 
                    'Allow': 'GET, POST',
                    'Content-Type': 'application/json' 
                },
            });
    }
}
