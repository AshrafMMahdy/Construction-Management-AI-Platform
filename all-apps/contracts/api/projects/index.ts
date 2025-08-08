// Put this file at `api/projects/index.ts`

import { list, get as blobGet, put as blobPut } from '@vercel/blob';
import type { Project, ProjectSummary } from '../../types';

// This route must use the Serverless runtime (default) — do not set runtime='edge'
// export const runtime = 'edge'; // <-- DO NOT set for this file

const createErrorResponse = (message: string, status: number) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Helper: read JSON content for a blob pathname using the blob SDK's `get`.
// If your installed version of @vercel/blob uses another name for fetching (e.g. `read`),
// change `blobGet` to the correct exported name — this code expects `get` exists.
async function readBlobJson(pathname: string) {
  // blobGet returns a Response-like object or buffer depending on SDK —
  // handle common shapes defensively.
  const res = await blobGet(pathname);

  // If SDK returns a Response-like object with `text()`/`json()` methods:
  if (typeof (res as any).json === 'function') {
    return await (res as any).json();
  }

  // If SDK returns Buffer or string
  if (res instanceof Uint8Array || typeof res === 'string') {
    const text = res instanceof Uint8Array ? new TextDecoder().decode(res) : (res as string);
    return JSON.parse(text);
  }

  // Fallback: try to convert
  try {
    const txt = await (res as any).text();
    return JSON.parse(txt);
  } catch (e) {
    throw new Error('Unable to parse blob content');
  }
}

export async function GET(_request: Request) {
  try {
    // List blobs under the `projects/` prefix
    const result = await list({ prefix: 'projects/' });

    // `result` should contain an array of items. Each item typically includes
    // `pathname` — e.g. 'projects/my-project-id.json'
    const items = (result && (result as any).items) || (result as any).blobs || [];

    // Build project summaries by reading each project's JSON (you can opt to only
    // return metadata if you stored summary metadata separately to avoid fetching
    // all content here).
    const summaries: ProjectSummary[] = [];

    for (const item of items) {
      try {
        const pathname = item.pathname || item.name || item.key;
        if (!pathname) continue;
        const projectData = await readBlobJson(pathname);
        summaries.push({
          id: pathname,
          name: projectData?.name || pathname.split('/').pop() || pathname,
          updatedAt: projectData?.updatedAt || new Date().toISOString(),
        });
      } catch (err) {
        // skip unreadable blobs but log to help debugging
        console.error('Error reading project blob', item, err);
      }
    }

    return new Response(JSON.stringify(summaries), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error listing projects:', error);
    return createErrorResponse('Failed to list projects.', 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, project } = body as { id?: string; project?: Project };

    if (!id || !project) {
      return createErrorResponse('Missing id or project in request body.', 400);
    }

    // Ensure safe pathname
    const safeId = encodeURIComponent(id);
    const pathname = `projects/${safeId}.json`;

    // Attach updatedAt if not present
    const projectToSave = { ...project, updatedAt: new Date().toISOString() };

    // Put the JSON into blob storage
    await blobPut(pathname, JSON.stringify(projectToSave), {
      // Content-Type header is important so the blob is stored as JSON
      // Some @vercel/blob versions accept metadata as a third param — this example
      // uses an options object with headers.
      headers: { 'Content-Type': 'application/json' },
    } as any);

    const summary: ProjectSummary = {
      id: pathname,
      name: projectToSave.name || safeId,
      updatedAt: projectToSave.updatedAt,
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