import React, { useState, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { AdditionalDocData } from '../types';
import FileTextIcon from './icons/FileTextIcon';
import TrashIcon from './icons/TrashIcon';

// Set up PDF.js worker.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

interface Props {
  docs: AdditionalDocData[];
  setDocs: React.Dispatch<React.SetStateAction<AdditionalDocData[]>>;
}

type Category = 'Emails' | 'Minutes of Meeting' | 'Reports' | 'Contract' | 'Others';
const categories: Category[] = ['Contract', 'Emails', 'Minutes of Meeting', 'Reports', 'Others'];
const categoryColors: Record<Category, string> = {
    'Contract': 'bg-red-500/80',
    'Emails': 'bg-sky-500/80',
    'Minutes of Meeting': 'bg-amber-500/80',
    'Reports': 'bg-purple-500/80',
    'Others': 'bg-gray-500/80',
};

interface StagedFile {
    id: string;
    file: File;
    category: Category | '';
}

const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                if (file.type === 'application/pdf') {
                    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                    let textContent = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const text = await page.getTextContent();
                        textContent += text.items.map(s => (s as any).str).join(' ');
                    }
                    resolve(textContent);
                } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // .docx
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    resolve(result.value);
                } else { // .txt
                    resolve(new TextDecoder().decode(arrayBuffer));
                }
            } catch (error) {
                console.error('Error processing file:', error);
                reject(new Error(`Could not read file: ${file.name}`));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file buffer.'));
        reader.readAsArrayBuffer(file);
    });
};

const AdditionalDocsUploader: React.FC<Props> = ({ docs, setDocs }) => {
    const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const files = e.target.files;
        if (files) {
            const newFiles = Array.from(files).map(file => ({
                id: `${file.name}-${file.lastModified}-${file.size}`,
                file,
                category: '' as Category | '',
            }));
            setStagedFiles(prev => [...prev, ...newFiles]);
        }
         if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset input so same files can be selected again
        }
    };

    const handleCategoryChange = (id: string, category: Category) => {
        setStagedFiles(files => files.map(f => f.id === id ? { ...f, category } : f));
    };

    const handleAddDoc = useCallback(async (stagedFile: StagedFile) => {
        if (!stagedFile.category) {
            setError(`Please select a category for ${stagedFile.file.name}.`);
            return;
        }
        
        setProcessingId(stagedFile.id);
        setError(null);
        
        try {
            const content = await extractTextFromFile(stagedFile.file);
            setDocs(prevDocs => [...prevDocs, { name: stagedFile.file.name, category: stagedFile.category as Category, content }]);
            setStagedFiles(prev => prev.filter(f => f.id !== stagedFile.id));
        } catch (err: any) {
            setError(err.message || 'An error occurred during file processing.');
        } finally {
            setProcessingId(null);
        }

    }, [setDocs]);

    const handleRemoveDoc = (index: number) => {
        setDocs(docs.filter((_, i) => i !== index));
    };
    
    const handleRemoveStagedFile = (id: string) => {
        setStagedFiles(files => files.filter(f => f.id !== id));
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-400">
                Upload relevant contracts, emails, meeting minutes, or reports (.pdf, .docx, .txt) to provide context for the delay analysis.
            </p>
            <div className="flex justify-center">
                 <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-2 bg-slate-600 text-slate-200 font-bold rounded-md shadow-sm hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-blue-500 transition-colors">
                    Select Files...
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple // <-- ALLOWS MULTIPLE FILE SELECTION
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                />
            </div>
            
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            
            {stagedFiles.length > 0 && (
                <div className="space-y-3 pt-2">
                    <h4 className="font-semibold text-slate-300">Staging Area</h4>
                    {stagedFiles.map((stagedFile) => (
                         <div key={stagedFile.id} className="flex flex-col sm:flex-row items-center gap-2 bg-slate-800 p-2 rounded-md border border-slate-600">
                           <div className="flex-grow flex items-center gap-2 w-full">
                             <FileTextIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                             <span className="text-sm text-slate-200 truncate" title={stagedFile.file.name}>{stagedFile.file.name}</span>
                           </div>
                           <div className="flex items-center gap-2 w-full sm:w-auto">
                                <select 
                                    value={stagedFile.category}
                                    onChange={(e) => handleCategoryChange(stagedFile.id, e.target.value as Category)}
                                    className="flex-grow p-2 bg-slate-600 border border-slate-500 rounded-md shadow-sm text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                >
                                    <option value="" disabled>Select Category...</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <button
                                    onClick={() => handleAddDoc(stagedFile)}
                                    disabled={!stagedFile.category || processingId === stagedFile.id}
                                    className="px-3 py-2 bg-blue-600 text-white font-bold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
                                >
                                    {processingId === stagedFile.id ? '...' : 'Add'}
                                </button>
                                <button onClick={() => handleRemoveStagedFile(stagedFile.id)} className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-full hover:bg-slate-700">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                           </div>
                        </div>
                    ))}
                </div>
            )}


            {docs.length > 0 && (
                <div className="space-y-2 pt-4">
                    <h4 className="font-semibold text-slate-300">Added Documents</h4>
                    {docs.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-800 p-2 rounded-md border border-slate-600 animate-fade-in-item">
                           <div className="flex items-center gap-3">
                                <FileTextIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                <span className="text-sm text-slate-200 truncate" title={doc.name}>{doc.name}</span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full text-white ${categoryColors[doc.category as Category]}`}>{doc.category}</span>
                           </div>
                           <button onClick={() => handleRemoveDoc(index)} className="p-1 text-slate-400 hover:text-red-400 transition-colors rounded-full hover:bg-slate-700">
                                <TrashIcon className="w-5 h-5" />
                           </button>
                        </div>
                    ))}
                </div>
            )}
             <style>{`
                @keyframes fade-in-item {
                  from { opacity: 0; transform: translateX(-10px); }
                  to { opacity: 1; transform: translateX(0); }
                }
                .animate-fade-in-item {
                  animation: fade-in-item 0.3s ease-out forwards;
                }
              `}</style>
        </div>
    );
};

export default AdditionalDocsUploader;
