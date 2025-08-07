
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFormats: string;
  title: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, acceptedFormats, title }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      setFileName(file.name);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, [handleFileChange]);

  return (
    <div className="flex items-center justify-center w-full">
      <label
        htmlFor={`dropzone-file-${title}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-blue-500 bg-blue-900/50' : 'border-gray-600 bg-slate-700 hover:bg-slate-600'}`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadIcon className={`w-10 h-10 mb-3 ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} />
          {fileName ? (
             <p className="font-semibold text-green-400 text-center">{fileName}</p>
          ) : (
            <>
              <p className="mb-2 text-sm text-gray-400 text-center">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 text-center">
                {title} ({acceptedFormats})
              </p>
            </>
          )}
        </div>
        <input 
            id={`dropzone-file-${title}`} 
            type="file" 
            className="hidden" 
            accept={acceptedFormats}
            onChange={(e) => handleFileChange(e.target.files)}
        />
      </label>
    </div>
  );
};
