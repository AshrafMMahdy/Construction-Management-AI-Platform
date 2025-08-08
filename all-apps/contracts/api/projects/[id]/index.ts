// Put this file at `api/projects/[id]/index.ts`

// NOTE: We use Serverless runtime here as well for simplicity. If you prefer
// edge runtime for single-object access you can change to `export const runtime = 'edge'`.

import { head as blobHead, get as blobGet2, put as blobPut2, del as blobDel } from '@vercel/blob';
import type { Project } from '../../../types';

const createErrorResponse2 = (message: string, status: number) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const getPathnameFromRequest = (request: Request): string | null => {
  const url = new URL(request.url);
  // The last segment of the pathname is assumed to be the encoded filename
  const id = url.pathname.split('/').pop();
  if (!id) return null;
  // If client calls /api/projects/my-id.json then use it directly; if client calls
  // /api/projects/my-id then we'll append .json
  const decoded = decodeURIComponent(id);
  return decoded.endsWith('.json') ? decoded : `projects/${encodeURIComponent(decoded)}.json`;
};

async function readBlobJson2(pathname: string) {
  const res = await blobGet2(pathname);
  if (typeof (res as any).json === 'function') return await (res as any).json();
  if (res instanceof Uint8Array || typeof res === 'string') {
    const text = res instanceof Uint8Array ? new TextDecoder().decode(res) : (res as string);
    return JSON.parse(text);
  }
  try {
    const txt = await (res as any).text();
    return JSON.parse(txt);
  } catch (e) {
    throw new Error('Unable to parse blob content');
  }
}

export async function GET(request: Request) {
  const pathname = getPathnameFromRequest(request);
  if (!pathname) return createErrorResponse2('Project ID missing.', 400);

  try {
    // Optional: check existence
    await blobHead(pathname);
    const project = await readBlobJson2(pathname);
    return new Response(JSON.stringify(project), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error fetching project', pathname, err);
    // If head throws a 404-like error, return 404.
    return createErrorResponse2('Project not found.', 404);
  }
}

export async function PUT(request: Request) {
  const pathname = getPathnameFromRequest(request);
  if (!pathname) return createErrorResponse2('Project ID missing.', 400);

  try {
    const project = await request.json() as Project;
    const projectToSave = { ...project, updatedAt: new Date().toISOString() };
    await blobPut2(pathname, JSON.stringify(projectToSave), { headers: { 'Content-Type': 'application/json' } } as any);
    return new Response(JSON.stringify(projectToSave), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Error updating project', pathname, err);
    return createErrorResponse2('Failed to update project.', 500);
  }
}

export async function DELETE(request: Request) {
  const pathname = getPathnameFromRequest(request);
  if (!pathname) return createErrorResponse2('Project ID missing.', 400);

  try {
    await blobDel(pathname);
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Error deleting project', pathname, err);
    return createErrorResponse2('Failed to delete project.', 500);
  }
}