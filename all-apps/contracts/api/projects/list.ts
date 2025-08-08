
// Vercel Edge Functions have a similar API to Next.js API routes
// This function will list blobs from Vercel's blob storage.
// It uses fetch to avoid needing the @vercel/blob SDK dependency.

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'GET') {
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
    const response = await fetch(`${blobApiUrl}?mode=list&prefix=projects/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${blobToken}`,
      },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Vercel Blob API Error:', errorText);
        return new Response(JSON.stringify({ error: 'Failed to list blobs.', details: errorText }), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { blobs } = await response.json();

    const projects = blobs
      .filter((blob: any) => blob.pathname.endsWith('.json'))
      .map((blob: any) => ({
        id: blob.pathname,
        // Extract name from "projects/Project-Name-12345.json"
        name: blob.pathname.replace(/^projects\//, '').replace(/-\d+\.json$/, '').replace(/-/g, ' '),
        updatedAt: blob.uploadedAt,
        url: blob.url,
      }))
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return new Response(JSON.stringify(projects), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    });

  } catch (error: any) {
    console.error('Error listing projects:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
