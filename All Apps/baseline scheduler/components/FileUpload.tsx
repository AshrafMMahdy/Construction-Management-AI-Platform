import React, { useState, useCallback } from 'react';
import { UploadIcon, FileIcon } from './IconComponents';

interface FileUploadProps {
  onFileLoad: (content: string, name: string) => void;
  fileName: string | null;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileLoad, fileName, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File | null) => {
    if (file) {
      if (file.name.endsWith('.csv') || file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          onFileLoad(content, file.name);
        };
        reader.readAsText(file);
      } else {
        alert('Please upload a valid CSV or JSON file.');
      }
    }
  }, [onFileLoad]);

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-brand-accent mb-2">1. Upload Historical Data</h3>
      <p className="text-sm text-brand-muted mb-4">Provide a CSV or JSON file of past project schedules.</p>
      <label
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex justify-center items-center w-full h-32 px-4 transition bg-brand-secondary border-2 border-dashed rounded-md appearance-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-brand-accent focus:outline-none'} ${isDragging ? 'border-brand-accent' : 'border-brand-muted'}`}
      >
        {fileName ? (
          <div className="flex flex-col items-center text-center">
            <FileIcon className="w-8 h-8 text-brand-accent" />
            <span className="font-medium text-brand-light mt-2">{fileName}</span>
            <span className="text-xs text-brand-muted">Click or drag to replace</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <UploadIcon className="w-8 h-8 text-brand-muted" />
            <span className="font-medium text-brand-muted mt-2">
              <span className="text-brand-accent">Click to upload</span> or drag and drop
            </span>
            <span className="text-xs text-brand-muted">CSV or JSON</span>
          </div>
        )}
        <input type="file" name="file_upload" className="hidden" accept=".csv,.json" onChange={handleFileChange} disabled={disabled} />
      </label>
    </div>
  );
};

export default FileUpload;