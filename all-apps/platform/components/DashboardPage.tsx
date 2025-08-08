
import React, { useState, useEffect } from 'react';
import Sidebar, { View } from './Sidebar';
import Dashboard from './Dashboard';
import type { Project } from '../types';
import { BuildingIcon, SpinnerIcon } from './icons/Icons';

interface DashboardPageProps {
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout }) => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error(`Failed to load projects. Status: ${response.status}`);
        }
        const data: Project[] = await response.json();
        setProjects(data);
        if (data.length > 0) {
          setSelectedProject(data[0]);
        }
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);


  const renderContent = () => {
    if (loading) {
      return (
          <div className="text-center text-brand-text-medium flex flex-col items-center justify-center h-full">
              <SpinnerIcon className="w-12 h-12 mb-4 animate-spin text-brand-accent" />
              <p className="text-lg">Loading Projects...</p>
          </div>
      );
    }

    if (error) {
        return (
            <div className="text-center text-brand-text-medium flex flex-col items-center justify-center h-full">
                 <BuildingIcon className="w-16 h-16 mb-4 text-red-500" />
                 <h2 className="text-2xl font-bold text-brand-text-light">Failed to Load Projects</h2>
                 <p className="mt-2 max-w-md text-red-400">{error}</p>
            </div>
        );
    }
    
    if (projects.length === 0 || !selectedProject) {
        return (
            <div className="text-center text-brand-text-medium flex flex-col items-center justify-center h-full">
                <BuildingIcon className="w-16 h-16 mb-4 text-brand-border" />
                <h2 className="text-2xl font-bold text-brand-text-light">No Projects Available</h2>
                <p className="mt-2 max-w-md">There are no projects in the database. Please use the 'Projects Database' module to add and manage projects.</p>
            </div>
        );
    }
    
    switch(activeView) {
      case 'dashboard':
      default:
        return <Dashboard projectData={selectedProject.dashboard} />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-primary text-brand-text-light">
      <Sidebar 
        onLogout={onLogout} 
        activeView={activeView} 
        setActiveView={setActiveView}
        projects={projects}
        selectedProject={selectedProject}
        onProjectChange={setSelectedProject}
      />
      <main className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
        <div key={activeView + (selectedProject?.id || 'no-project')} className="animate-fade-in-down w-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;