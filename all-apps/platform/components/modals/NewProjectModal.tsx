import React, { useState } from 'react';
import { Project } from '../../types';

interface NewProjectModalProps {
  onClose: () => void;
  onAddProject: (project: Project) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onAddProject }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: name,
      createdAt: new Date().toISOString(),
      historicalData: "",
      fileName: "New Project (from Hub)",
      projectInput: {
          isNotInDb: true,
          description: description,
          selections: {},
      },
      startDate: new Date().toISOString(),
      agentOutputs: [],
      generatedSchedule: [],
      generatedNarrative: "",
    };

    onAddProject(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-lg p-8 animate-slide-in-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-base-content">Create New Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="projectName" className="block text-sm font-medium text-base-content-secondary mb-1">Project Name</label>
            <input
              type="text"
              id="projectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-base-200 border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="e.g., Berlin Expansion"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="projectDescription" className="block text-sm font-medium text-base-content-secondary mb-1">Description</label>
            <textarea
              id="projectDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-base-200 border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="A brief summary of the project's goals."
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-base-content bg-base-300 hover:bg-opacity-80">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 rounded-md text-white bg-brand-primary hover:bg-opacity-90">
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;
