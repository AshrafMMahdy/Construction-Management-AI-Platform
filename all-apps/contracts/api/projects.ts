// api/projects.ts
import { list, get as blobGet, put as blobPut } from '@vercel/blob';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // List blobs under `projects/`
      const result = await list({ prefix: 'projects/' });
      const items = result?.items || result?.blobs || [];

      const summaries = [];
      for (const item of items) {
        try {
          const pathname = item.pathname || item.name || item.key;
          if (!pathname) continue;
          const data = await readBlobJson(pathname);
          summaries.push({
            id: pathname,
            name: data?.name || pathname.split('/').pop() || pathname,
            updatedAt: data?.updatedAt || new Date().toISOString(),
          });
        } catch (err) {
          console.error('Error reading blob', item, err);
        }
      }
      return res.status(200).json(summaries);
    }

    if (req.method === 'POST') {
      const { id, project } = req.body;
      if (!id || !project) {
        return res.status(400).json({ error: 'Missing id or project' });
      }

      const safeId = encodeURIComponent(id);
      const pathname = `projects/${safeId}.json`;
      const projectToSave = { ...project, updatedAt: new Date().toISOString() };

      await blobPut(pathname, JSON.stringify(projectToSave), {
        headers: { 'Content-Type': 'application/json' },
      } as any);

      return res.status(201).json({
        id: pathname,
        name: projectToSave.name || safeId,
        updatedAt: projectToSave.updatedAt,
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Error in /api/projects', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function readBlobJson(pathname: string) {
  const res = await blobGet(pathname);
  if (typeof (res as any).json === 'function') return await (res as any).json();
  if (res instanceof Uint8Array || typeof res === 'string') {
    const text = res instanceof Uint8Array ? new TextDecoder().decode(res) : (res as string);
    return JSON.parse(text);
  }
  const txt = await (res as any).text();
  return JSON.parse(txt);
}
