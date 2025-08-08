import React, { useState, useEffect } from 'react';
import { SchedulerProject } from './types';
import { getProjects } from './services/databaseService';
import Sidebar from './components/Sidebar';
import ProjectView from './components/ProjectView';
import DashboardView from './components/DashboardView';
import LoginPage from './components/LoginPage';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [projects, setProjects] = useState<SchedulerProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoggedIn) {
        setIsLoading(false); // No need to load if not logged in
        return;
    }
    const loadProjects = async () => {
      setIsLoading(true);
      const projectsFromDb = await getProjects();
      setProjects(projectsFromDb);
      setIsLoading(false);
    };
    
    loadProjects();
  }, [isLoggedIn]);

  const handleSignOut = () => {
    setSelectedProjectId(null);
    setProjects([]);
    setIsLoggedIn(false);
  };
  
  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  if (!isLoggedIn) {
      return <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-200 text-base-content">
        <div className="text-center animate-fade-in">
          <svg className="animate-spin h-10 w-10 text-brand-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 className="text-2xl font-bold">Connecting to Database...</h2>
          <p className="text-base-content-secondary">Fetching latest project data from Vercel Blob.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-base-200 text-base-content font-sans">
      <Sidebar 
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onSignOut={handleSignOut}
      />
      <main className="flex-1 p-8 overflow-y-auto">
        {selectedProject ? (
          <ProjectView 
            key={selectedProject.id} 
            project={selectedProject}
          />
        ) : (
          <DashboardView projects={projects} onSelectProject={setSelectedProjectId} />
        )}
      </main>
    </div>
  );
};

export default App;
