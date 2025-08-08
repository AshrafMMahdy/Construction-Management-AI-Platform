
import { list } from '@vercel/blob';
import type { Project } from '../../types';

// This function will be deployed as a Vercel Serverless Function.
// It uses the Node.js runtime and automatically uses the BLOB_READ_WRITE_TOKEN from environment variables.
export default async function handler(req, res) {
  // Set CORS headers to allow requests from any origin (including the local preview environment)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle pre-flight CORS requests
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'OPTIONS']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // List all blobs in the store
    const { blobs } = await list();

    if (blobs.length === 0) {
      return res.status(200).json([]);
    }

    // Fetch the content of each blob concurrently
    const projectPromises = blobs.map(async (blob) => {
      try {
        const response = await fetch(blob.url);
        if (!response.ok) {
          console.error(`Failed to fetch blob content for ${blob.pathname}: ${response.statusText}`);
          return null; // Skip blobs that fail to load
        }
        const projectData: Project = await response.json();
        // Basic validation to ensure it's a project object
        if (projectData && projectData.id && projectData.name) {
             return projectData;
        }
        return null;
      } catch (e) {
        console.error(`Error parsing JSON for blob ${blob.pathname}:`, e);
        return null; // Skip blobs with invalid JSON
      }
    });

    // Wait for all fetches to complete and filter out any null results
    const projects = (await Promise.all(projectPromises)).filter(p => p !== null);

    return res.status(200).json(projects);

  } catch (error) {
    console.error('Error listing projects from blob storage:', error);
    // Vercel Blob SDK might throw errors, which we catch here
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ error: 'Failed to retrieve projects from storage.', details: errorMessage });
  }
}
