// api/projects-[id].ts
import { head as blobHead, get as blobGet, put as blobPut, del as blobDel } from '@vercel/blob';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Project ID missing' });
  }

  const pathname = id.endsWith('.json') ? `projects/${id}` : `projects/${id}.json`;

  try {
    if (req.method === 'GET') {
      await blobHead(pathname);
      const project = await readBlobJson(pathname);
      return res.status(200).json(project);
    }

    if (req.method === 'PUT') {
      const project = req.body;
      const projectToSave = { ...project, updatedAt: new Date().toISOString() };
      await blobPut(pathname, JSON.stringify(projectToSave), {
        headers: { 'Content-Type': 'application/json' },
      } as any);
      return res.status(200).json(projectToSave);
    }

    if (req.method === 'DELETE') {
      await blobDel(pathname);
      return res.status(204).send('');
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(`Error in /api/projects-${id}`, err);
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
