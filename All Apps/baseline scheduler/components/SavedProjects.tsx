
import React, { useState, useEffect } from 'react';
import { SavedProject } from '../types';
import { TrashIcon, PencilIcon, CheckIcon, XIcon } from './IconComponents';

interface SavedProjectsProps {
  projects: SavedProject[];
  currentProjectId: string | null;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  disabled: boolean;
}

const SavedProjects: React.FC<SavedProjectsProps> = ({ projects, currentProjectId, onLoad, onDelete, onRename, disabled }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedName, setEditedName] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    
    useEffect(() => {
        if (disabled) {
            setEditingId(null);
            setConfirmDeleteId(null);
        }
    }, [disabled]);

    const handleStartEdit = (project: SavedProject) => {
        setEditingId(project.id);
        setEditedName(project.name);
        setConfirmDeleteId(null);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditedName('');
    };

    const handleSaveEdit = () => {
        if (editingId && editedName.trim()) {
            onRename(editingId, editedName.trim());
        }
        handleCancelEdit();
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };
    
    const handleStartDelete = (project: SavedProject) => {
        setConfirmDeleteId(project.id);
        setEditingId(null);
    };

    const handleConfirmDelete = () => {
        if (confirmDeleteId) {
            onDelete(confirmDeleteId);
        }
        setConfirmDeleteId(null);
    };
    
    const handleCancelDelete = () => {
        setConfirmDeleteId(null);
    };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-brand-accent mb-2">Saved Projects</h3>
      <div className="space-y-2 max-h-60 overflow-y-auto bg-brand-primary/50 p-2 rounded-md">
        {projects.length === 0 ? (
          <p className="text-sm text-brand-muted text-center py-4">No projects saved yet.</p>
        ) : (
          [...projects].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(project => {
            
            const isEditing = editingId === project.id;
            const isConfirmingDelete = confirmDeleteId === project.id;
            const isAnotherActionActive = (editingId !== null && !isEditing) || (confirmDeleteId !== null && !isConfirmingDelete);
            const isProjectDisabled = disabled || isAnotherActionActive;

            return (
              <div
                key={project.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 group ${
                  currentProjectId === project.id && !isEditing && !isConfirmingDelete
                    ? 'bg-brand-accent/20 border border-brand-accent'
                    : 'bg-brand-secondary/70'
                } ${isProjectDisabled ? 'opacity-40 cursor-not-allowed' : ''} ${!isProjectDisabled && !isEditing && !isConfirmingDelete ? 'hover:bg-brand-muted/20' : ''}`}
              >
                {isConfirmingDelete ? (
                    <>
                        <p className="flex-grow text-sm font-semibold text-red-300">Delete this project?</p>
                        <div className="flex items-center gap-2">
                            <button onClick={handleConfirmDelete} className="font-bold text-red-400 hover:text-red-300 text-sm px-2">Yes</button>
                            <button onClick={handleCancelDelete} className="font-semibold text-brand-light hover:text-white text-sm px-2">No</button>
                        </div>
                    </>
                ) : isEditing ? (
                    <>
                        <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="flex-grow bg-brand-primary border-2 border-brand-accent rounded-md px-2 py-1 text-sm text-brand-light focus:outline-none"
                        />
                        <div className="flex items-center gap-1 ml-2">
                             <button onClick={handleSaveEdit} className="p-1 rounded-full text-green-400 hover:bg-green-900/50">
                                <CheckIcon className="w-5 h-5"/>
                             </button>
                             <button onClick={handleCancelEdit} className="p-1 rounded-full text-red-400 hover:bg-red-900/50">
                                <XIcon className="w-5 h-5"/>
                             </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex-grow mr-2 cursor-pointer" onClick={() => !isProjectDisabled && onLoad(project.id)}>
                            <p className="font-semibold text-brand-light truncate" title={project.name}>
                            {project.name}
                            </p>
                            <p className="text-xs text-brand-muted">
                            Saved: {new Date(project.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleStartEdit(project)}
                                disabled={isProjectDisabled}
                                className="p-1 rounded-full text-brand-muted hover:text-brand-accent hover:bg-brand-accent/20 transition-colors"
                                aria-label={`Rename project ${project.name}`}
                            >
                                <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleStartDelete(project)}
                                disabled={isProjectDisabled}
                                className="p-1 rounded-full text-brand-muted hover:text-red-400 hover:bg-red-900/50 transition-colors"
                                aria-label={`Delete project ${project.name}`}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  );
};

export default SavedProjects;
