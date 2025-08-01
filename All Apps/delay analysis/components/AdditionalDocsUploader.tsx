import React, { useState, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { AdditionalDocData } from '../types';
import FileTextIcon from './icons/FileTextIcon';
import TrashIcon from './icons/TrashIcon';

// Set up PDF.js worker. This is crucial for it to work.
// The default esm.sh URL can cause issues with dynamic module loading.
// Pointing to a reliable CDN like jsDelivr for the worker script is a standard fix.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;


interface Props {
  docs: AdditionalDocData[];
  setDocs: React.Dispatch<React.SetStateAction<AdditionalDocData[]>>;
}

type Category = 'Emails' | 'Minutes of Meeting' | 'Reports';
const categories: Category[] = ['Emails', 'Minutes of Meeting', 'Reports'];
const categoryColors: Record<Category, string> = {
    'Emails': 'bg-sky-500/80',
    'Minutes of Meeting': 'bg-amber-500/80',
    'Reports': 'bg-purple-500/80',
};

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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | ''>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };
    
    const handleAddDoc = useCallback(async () => {
        if (!selectedFile || !selectedCategory) return;
        
        setIsProcessing(true);
        setError(null);
        
        try {
            const content = await extractTextFromFile(selectedFile);
            setDocs(prevDocs => [...prevDocs, { name: selectedFile.name, category: selectedCategory, content }]);
            setSelectedFile(null);
            setSelectedCategory('');
            if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during file processing.');
        } finally {
            setIsProcessing(false);
        }

    }, [selectedFile, selectedCategory, setDocs]);

    const handleRemoveDoc = (index: number) => {
        setDocs(docs.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-400">
                Upload relevant emails, meeting minutes, or reports (.pdf, .docx, .txt) to provide context for the delay analysis.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt"
                    className="flex-grow w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-600 file:text-slate-200 hover:file:bg-slate-500 transition"
                />
                <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as Category)}
                    className="w-full sm:w-auto p-2 bg-slate-600 border border-slate-500 rounded-md shadow-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                    <option value="" disabled>Select Category...</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <button
                    onClick={handleAddDoc}
                    disabled={!selectedFile || !selectedCategory || isProcessing}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white font-bold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-slate-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-blue-500 transition-colors"
                >
                    {isProcessing ? 'Processing...' : 'Add Doc'}
                </button>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="space-y-2 pt-2">
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