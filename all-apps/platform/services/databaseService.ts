import { Project } from '../types';

/**
 * Fetches all scheduler project files via the backend API route.
 * This route communicates securely with Vercel Blob storage.
 * @returns A promise that resolves to an array of Projects.
 */
export const getProjects = async (): Promise<Project[]> => {
  try {
    // Call the serverless function, which now handles Blob communication
    const response = await fetch('/api/projects');
    
    if (!response.ok) {
      console.error(`Failed to fetch projects from API: ${response.status} - ${await response.text()}`);
      return [];
    }

    const projects: Project[] = await response.json();
    return projects;

  } catch (error) {
    console.error("An error occurred while fetching projects:", error);
    return [];
  }
};
