import { SchedulerProject } from '../types';

const VERCEL_BLOB_API_URL = 'https://blob.vercel-storage.com';

/**
 * Fetches all scheduler project files from Vercel Blob storage.
 * It lists all files in the `projects/` directory, fetches each one,
 * and returns them as an array of project objects.
 * @returns A promise that resolves to an array of SchedulerProjects.
 */
export const getProjects = async (): Promise<SchedulerProject[]> => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    console.warn("Vercel Blob token (BLOB_READ_WRITE_TOKEN) not found. This is expected in local development without an environment variable set. The app will show an empty project list.");
    return [];
  }

  try {
    // 1. List all blobs in the 'projects/' folder.
    const listUrl = `${VERCEL_BLOB_API_URL}?prefix=projects/`;
    const listResponse = await fetch(listUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!listResponse.ok) {
      console.error(`Failed to list blobs from Vercel: ${listResponse.status} - ${await listResponse.text()}`);
      return [];
    }
    const listResult = await listResponse.json();

    if (!listResult.blobs || listResult.blobs.length === 0) {
      console.log("No projects found in Vercel Blob 'projects/' directory.");
      return [];
    }
    
    // 2. Filter for .json files and create fetch promises for each.
    const projectBlobs = listResult.blobs.filter((b: any) => b.pathname.endsWith('.json'));
    const fetchPromises = projectBlobs.map((blob: any) => 
        fetch(blob.url, { headers: { 'Cache-Control': 'no-cache' } }).then(res => {
            if (!res.ok) {
                throw new Error(`Failed to fetch ${blob.url}: ${res.statusText}`);
            }
            return res.json();
        })
    );

    // 3. Fetch all files concurrently and handle results.
    const settledResults = await Promise.allSettled(fetchPromises);
    
    const projects: SchedulerProject[] = [];
    settledResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        // Basic validation to ensure it looks like a project
        if (result.value && result.value.id && result.value.name) {
            projects.push(result.value as SchedulerProject);
        } else {
            console.warn(`File ${projectBlobs[index].pathname} was fetched but seems to have invalid content.`, result.value);
        }
      } else {
        console.error(`Failed to fetch or parse project from ${projectBlobs[index].pathname}:`, result.reason);
      }
    });

    // Sort projects by creation date, newest first
    return projects.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  } catch (error) {
    console.error("An error occurred while fetching projects from Vercel Blob:", error);
    return [];
  }
};
