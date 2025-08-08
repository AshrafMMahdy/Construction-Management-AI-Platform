import { SchedulerProject } from '../types';

/**
 * Fetches all scheduler project files via the backend API route.
 * This route communicates securely with Vercel Blob storage.
 * @returns A promise that resolves to an array of SchedulerProjects.
 */
export const getProjects = async (): Promise<SchedulerProject[]> => {
  try {
    // Call the serverless function, which now handles Blob communication
    const response = await fetch('/api/projects');
    
    if (!response.ok) {
      console.error(`Failed to fetch projects from API: ${response.status} - ${await response.text()}`);
      return [];
    }

    const projects: SchedulerProject[] = await response.json();
    return projects;

  } catch (error) {
    console.error("An error occurred while fetching projects:", error);
    return [];
  }
};
