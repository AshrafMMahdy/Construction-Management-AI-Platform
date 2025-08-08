
// This function will save project data to Vercel's blob storage.
// It handles both creating new projects and updating existing ones.

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const blobApiUrl = process.env.BLOB_URL;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (!blobApiUrl || !blobToken) {
    return new Response(JSON.stringify({ error: 'Storage environment variables not configured.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const projectData = await request.json();

    if (!projectData || !projectData.name) {
      return new Response(JSON.stringify({ error: 'Invalid project data. "name" is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Determine the pathname: use existing ID or create a new one.
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
        console.error('Vercel Blob API PUT Error:', errorText);
        return new Response(JSON.stringify({ error: 'Failed to save blob.', details: errorText }), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const blobResult = await response.json();
    
    // Return a summary of the saved project
    const projectSummary = {
        id: blobResult.pathname,
        name: projectData.name,
        updatedAt: blobResult.uploadedAt,
        url: blobResult.url,
    };
    
    return new Response(JSON.stringify(projectSummary), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error saving project:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
