import React, { useCallback, useState } from 'react';
import { SupportingDocument, SupportingDocumentCategory } from '../types';
import { UploadIcon, FileIcon, TrashIcon } from './IconComponents';

const CATEGORIES: SupportingDocumentCategory[] = [
  "BOQ + Package Price",
  "Resource and Productivity database",
  "Project Drawings"
];

interface SupportingDocsUploadProps {
  docs: SupportingDocument[];
  onDocsChange: (docs: SupportingDocument[]) => void;
  disabled: boolean;
}

const SupportingDocsUpload: React.FC<SupportingDocsUploadProps> = ({ docs, onDocsChange, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (files) {
      const newDocs: SupportingDocument[] = Array.from(files).map(file => ({
        id: self.crypto.randomUUID(),
        file,
        category: null,
      }));
      onDocsChange([...docs, ...newDocs]);
    }
  }, [docs, onDocsChange]);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Click to upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    // Reset the input value to allow uploading the same file again
    e.target.value = '';
  };
  
  // Handlers for individual doc management
  const handleRemoveDoc = (id: string) => {
    onDocsChange(docs.filter(doc => doc.id !== id));
  };
  
  const handleCategoryChange = (id: string, category: SupportingDocumentCategory) => {
    onDocsChange(docs.map(doc => doc.id === id ? { ...doc, category } : doc));
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-brand-accent mb-2">2. Upload Supporting Documents <span className="text-sm font-normal text-brand-muted">(Optional)</span></h3>
      <p className="text-sm text-brand-muted mb-4">Add relevant files like drawings, BOQs, or resource data to provide more context to the AI agents.</p>
      
      {/* File List */}
      {docs.length > 0 && (
        <div className="space-y-3 mb-4">
          {docs.map(doc => (
            <div key={doc.id} className="bg-brand-primary/50 p-3 rounded-lg flex items-center gap-4">
              <FileIcon className="w-6 h-6 text-brand-accent flex-shrink-0" />
              <div className="flex-grow min-w-0">
                <p className="text-sm font-medium text-brand-light truncate" title={doc.file.name}>{doc.file.name}</p>
                <select
                  value={doc.category || ''}
                  onChange={(e) => handleCategoryChange(doc.id, e.target.value as SupportingDocumentCategory)}
                  disabled={disabled}
                  className="w-full mt-1 text-xs p-1 bg-brand-secondary border border-brand-muted rounded-md focus:outline-none focus:border-brand-accent transition-colors text-brand-light disabled:cursor-not-allowed"
                  aria-label={`Category for ${doc.file.name}`}
                >
                  <option value="" disabled>Select a category...</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <button
                onClick={() => handleRemoveDoc(doc.id)}
                disabled={disabled}
                className="p-1 rounded-full text-brand-muted hover:text-red-400 hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                aria-label={`Remove ${doc.file.name}`}
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      <label
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex justify-center items-center w-full h-24 px-4 transition bg-brand-secondary border-2 border-dashed rounded-md appearance-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-brand-accent focus:outline-none'} ${isDragging ? 'border-brand-accent' : 'border-brand-muted'}`}
      >
        <div className="flex flex-col items-center text-center">
          <UploadIcon className="w-8 h-8 text-brand-muted" />
          <span className="font-medium text-brand-muted mt-2">
            <span className="text-brand-accent">Click to add files</span> or drag and drop
          </span>
          <span className="text-xs text-brand-muted">Multiple files accepted</span>
        </div>
        <input 
          type="file" 
          multiple
          className="hidden"
          onChange={handleFileChange} 
          disabled={disabled}
        />
      </label>
    </div>
  );
};

export default SupportingDocsUpload;