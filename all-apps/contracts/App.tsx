import React, { useState, useCallback, ChangeEvent, useRef, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultsTable } from './components/ResultsTable';
import { SummaryTable } from './components/SummaryTable';
import { AnalysisProgress } from './components/AnalysisProgress';
import { ContractIcon, DatabaseIcon, SearchIcon } from './components/icons';
import { parseContractFile, parseDatabaseFile } from './services/fileParser';
import { analyzeContract, searchContract } from './services/geminiService';
import { AnalysisResult, SearchResult, Project, ProjectSummary, FileObject } from './types';
import { SearchResultsTable } from './components/SearchResultsTable';
import { Sidebar } from './components/Sidebar';

export type AppMode = 'analysis' | 'search';
type AppStatus = 'idle' | 'analyzing' | 'searching' | 'saving' | 'loading' | 'deleting';

export type ProgressStep = {
  name: string;
  status: 'pending' | 'in-progress' | 'done';
  progress: number;
};

// --- Helper Functions for File and Project Handling ---
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
});

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid data URL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]); 
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
};

const fileToSerializable = async (file: File | null): Promise<FileObject | null> => {
  if (!file) return null;
  const dataUrl = await toBase64(file);
  return { name: file.name, type: file.type, dataUrl };
};

const serializableToFile = (fileObject: FileObject | null): File | null => {
    if (!fileObject?.dataUrl) return null;
    return dataURLtoFile(fileObject.dataUrl, fileObject.name);
};


function App() {
  const [appMode, setAppMode] = useState<AppMode>('analysis');
  const [databaseFile, setDatabaseFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[] | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

  const [status, setStatus] = useState<AppStatus>('idle');
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // --- Project Management State ---
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('new');
  const [newProjectName, setNewProjectName] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  
  const progressIntervalRef = useRef<number | null>(null);
  const isBusy = status !== 'idle';
  const isProcessing = status === 'analyzing' || status === 'searching';

  // --- Project API Functions ---
  const listProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch projects');
      }
      const data: ProjectSummary[] = await response.json();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Could not load project list.');
    }
  }, []);

  useEffect(() => {
    listProjects();
  }, [listProjects]);

  const resetState = (forNewProject: boolean) => {
    setDatabaseFile(null);
    setContractFile(null);
    setSearchQuery('');
    setAnalysisResults(null);
    setSearchResults(null);
    setProgress([]);
    setError(null);
    setIsDirty(false);
    if (forNewProject) {
      setCurrentProject(null);
      setSelectedProjectId('new');
      setNewProjectName('');
    }
  };

  const handleProjectSelection = useCallback(async (projectId: string) => {
    if (isDirty) {
      const discard = window.confirm("You have unsaved changes. Are you sure you want to switch projects? Your changes will be lost.");
      if (!discard) {
        return;
      }
    }
    
    if (projectId === 'new' || projectId === 'placeholder') {
      return;
    }

    setSelectedProjectId(projectId);
    setStatus('loading');
    setError(null);
    try {
      // The projectId is the pathname, which needs to be encoded for the URL path
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`);
      if (!response.ok) throw new Error(`Failed to load project: ${response.statusText}`);
      
      const projectData: Project = await response.json();
      
      setCurrentProject(projectData);
      setDatabaseFile(serializableToFile(projectData.databaseFile));
      setContractFile(serializableToFile(projectData.contractFile));
      setSearchQuery(projectData.searchQuery || '');
      setAnalysisResults(projectData.analysisResults);
      setSearchResults(projectData.searchResults);
      setIsDirty(false); // Freshly loaded project is not dirty
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred while loading the project.');
      resetState(true);
    } finally {
      setStatus('idle');
    }
  }, [isDirty, projects]);
  
  const handleCreateNewProjectClick = () => {
    if (selectedProjectId === 'new') return; // Already in create mode
    if (isDirty) {
      const discard = window.confirm("You have unsaved changes. Are you sure you want to create a new project? Your changes will be lost.");
      if (!discard) return;
    }
    resetState(true);
  };
  
    const handleDeleteProject = useCallback(async (projectToDelete: ProjectSummary) => {
        const confirmed = window.confirm(`Are you sure you want to delete the project "${projectToDelete.name}"? This action cannot be undone.`);
        if (!confirmed) return;

        setStatus('deleting');
        setError(null);
        try {
            // The project ID is the pathname, which must be encoded
            const response = await fetch(`/api/projects/${encodeURIComponent(projectToDelete.id)}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to delete project.');
            }
            
            if (selectedProjectId === projectToDelete.id) {
                resetState(true);
            }
            await listProjects();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setStatus('idle');
        }
    }, [listProjects, selectedProjectId]);


  const handleSaveProject = useCallback(async () => {
    const isUpdating = !!currentProject?.id;
    const projectName = isUpdating ? currentProject.name : newProjectName;

    if (!projectName?.trim()) {
        setError("Project name cannot be empty.");
        return;
    }

    setStatus('saving');
    setError(null);
    try {
        const payload: Omit<Project, 'id'> = {
            name: projectName.trim(),
            databaseFile: await fileToSerializable(databaseFile),
            contractFile: await fileToSerializable(contractFile),
            searchQuery,
            analysisResults,
            searchResults,
        };

        let response: Response;
        if (isUpdating) {
            // UPDATE existing project
            response = await fetch(`/api/projects/${encodeURIComponent(currentProject.id!)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } else {
            // CREATE new project
            response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to save project.');
        }

        const savedSummary: ProjectSummary = await response.json();
        
        const updatedProjectState: Project = { ...payload, id: savedSummary.id };
        setCurrentProject(updatedProjectState);
        setSelectedProjectId(savedSummary.id);
        setNewProjectName('');
        setIsDirty(false);
        
        await listProjects();

    } catch (err: any) {
        setError(err.message);
    } finally {
        setStatus('idle');
    }
  }, [currentProject, newProjectName, databaseFile, contractFile, searchQuery, analysisResults, searchResults, listProjects]);

  const handleFileSelect = (setter: React.Dispatch<React.SetStateAction<File | null>>) => (file: File) => {
      setter(file);
      setIsDirty(true);
  };

  const handleModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as AppMode;
    setAppMode(newMode);
  };
  
  const handleNewProjectNameChange = (name: string) => {
    setNewProjectName(name);
    setIsDirty(true);
  };

  const handleAnalyze = useCallback(async () => {
    if (!databaseFile || !contractFile) {
      setError("Please upload both the database and contract files.");
      return;
    }
    setStatus('analyzing');
    setError(null);
    setAnalysisResults(null);

    if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
    }

    const initialSteps: ProgressStep[] = [
      { name: 'Reading and validating files...', status: 'in-progress', progress: 0 },
      { name: 'AI performing analysis...', status: 'pending', progress: 0 },
      { name: 'Generating final report...', status: 'pending', progress: 0 },
    ];
    setProgress(initialSteps);

    try {
      const startFakeProgress = (stepIndex: number) => {
          progressIntervalRef.current = window.setInterval(() => {
              setProgress(prev => {
                  const updated = [...prev];
                  if (updated[stepIndex]) {
                      const currentProgress = updated[stepIndex].progress;
                      if (currentProgress < 95) {
                          updated[stepIndex].progress = currentProgress + 1;
                      }
                  }
                  return updated;
              });
          }, 150);
      };

      const finishStep = (stepIndex: number) => {
          if (progressIntervalRef.current) {
              window.clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
          }
          setProgress(prev => {
              const updated = [...prev];
              if (updated[stepIndex]) {
                  updated[stepIndex].status = 'done';
                  updated[stepIndex].progress = 100;
              }
              return updated;
          });
      };

      // === STEP 1: Reading and validating files ===
      startFakeProgress(0);
      const [dbClauses, contractContent] = await Promise.all([
          parseDatabaseFile(databaseFile),
          parseContractFile(contractFile)
      ]);
      finishStep(0);
      
      if (!dbClauses || dbClauses.length === 0) throw new Error("Could not parse the database file or it is empty.");
      if (!contractContent || (contractContent.type === 'text' && contractContent.clauses.length === 0) || (contractContent.type === 'image' && contractContent.pages.length === 0)) {
        throw new Error("Could not extract any content from the contract file.");
      }
      
      // === STEP 2: AI Analysis ===
      const analysisStepName = contractContent.type === 'image' 
        ? 'Performing OCR & analysis on scanned document...' 
        : 'Analyzing contract clauses...';
      
      setProgress(prev => {
          const updated = [...prev];
          updated[1].name = analysisStepName;
          updated[1].status = 'in-progress';
          return updated;
      });
      startFakeProgress(1);

      const results = await analyzeContract(contractContent, dbClauses);
      finishStep(1);

      // === STEP 3: Generating final report (with 1s fake delay) ===
      setProgress(prev => {
          const updated = [...prev];
          updated[2].status = 'in-progress';
          return updated;
      });
      
      await new Promise<void>(resolve => {
        let currentProgress = 0;
        const reportInterval = window.setInterval(() => {
            currentProgress += 10;
            setProgress(prev => {
                const updated = [...prev];
                if (updated[2]) {
                    updated[2].progress = Math.min(currentProgress, 100);
                }
                return updated;
            });
            if (currentProgress >= 100) {
                window.clearInterval(reportInterval);
                resolve();
            }
        }, 100);
      });
      finishStep(2);

      setAnalysisResults(results);
      setIsDirty(true);

      window.setTimeout(() => {
        setStatus('idle');
        setProgress([]);
      }, 1200);

    } catch (err: any) {
      console.error(err);
      if (progressIntervalRef.current) {
          window.clearInterval(progressIntervalRef.current);
      }
      setError(err.message || "An unknown error occurred during analysis.");
      setStatus('idle');
      setProgress([]);
    }
  }, [databaseFile, contractFile]);

  const handleSearch = useCallback(async () => {
    if (!contractFile) {
      setError("Please upload the contract file.");
      return;
    }
    if (!searchQuery.trim()) {
        setError("Please enter a search query.");
        return;
    }
    setStatus('searching');
    setError(null);
    setSearchResults(null);

    if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
    }

    const initialSteps: ProgressStep[] = [
        { name: 'Reading and validating contract file...', status: 'in-progress', progress: 0 },
        { name: 'AI searching for relevant clauses...', status: 'pending', progress: 0 },
        { name: 'Compiling results...', status: 'pending', progress: 0 },
    ];
    setProgress(initialSteps);

    try {
        const startFakeProgress = (stepIndex: number) => {
            progressIntervalRef.current = window.setInterval(() => {
                setProgress(prev => {
                    const updated = [...prev];
                    if (updated[stepIndex]) {
                        const currentProgress = updated[stepIndex].progress;
                        if (currentProgress < 95) {
                            updated[stepIndex].progress = currentProgress + 1;
                        }
                    }
                    return updated;
                });
            }, 150);
        };

        const finishStep = (stepIndex: number) => {
            if (progressIntervalRef.current) {
                window.clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
            setProgress(prev => {
                const updated = [...prev];
                if (updated[stepIndex]) {
                    updated[stepIndex].status = 'done';
                    updated[stepIndex].progress = 100;
                }
                return updated;
            });
        };

        // === STEP 1: Reading contract file ===
        startFakeProgress(0);
        const contractContent = await parseContractFile(contractFile);
        finishStep(0);

        if (!contractContent || (contractContent.type === 'text' && contractContent.clauses.length === 0) || (contractContent.type === 'image' && contractContent.pages.length === 0)) {
            throw new Error("Could not extract any content from the contract file.");
        }

        // === STEP 2: AI Searching ===
        const searchStepName = contractContent.type === 'image'
            ? 'AI performing OCR & searching scanned document...'
            : 'AI searching for relevant clauses...';

        setProgress(prev => {
            const updated = [...prev];
            updated[1].name = searchStepName;
            updated[1].status = 'in-progress';
            return updated;
        });
        startFakeProgress(1);

        const results = await searchContract(contractContent, searchQuery);
        finishStep(1);

        // === STEP 3: Compiling results (with 1s fake delay) ===
        setProgress(prev => {
            const updated = [...prev];
            updated[2].status = 'in-progress';
            return updated;
        });

        await new Promise<void>(resolve => {
            let currentProgress = 0;
            const reportInterval = window.setInterval(() => {
                currentProgress += 10;
                setProgress(prev => {
                    const updated = [...prev];
                    if (updated[2]) {
                        updated[2].progress = Math.min(currentProgress, 100);
                    }
                    return updated;
                });
                if (currentProgress >= 100) {
                    window.clearInterval(reportInterval);
                    resolve();
                }
            }, 100);
        });
        finishStep(2);
        
        setSearchResults(results);
        setIsDirty(true);

        window.setTimeout(() => {
            setStatus('idle');
            setProgress([]);
        }, 1200);

    } catch (err: any) {
        console.error("Error during search:", err);
        if (progressIntervalRef.current) {
            window.clearInterval(progressIntervalRef.current);
        }
        setError(err.message || "An unknown error occurred during search.");
        setStatus('idle');
        setProgress([]);
    }
  }, [contractFile, searchQuery]);

  return (
    <div className="h-screen w-screen flex font-sans">
      <Sidebar
        appMode={appMode}
        onModeChange={handleModeChange}
        isBusy={isBusy}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onProjectSelection={handleProjectSelection}
        onDeleteProject={handleDeleteProject}
        onCreateNewProject={handleCreateNewProjectClick}
        isDirty={isDirty}
        newProjectName={newProjectName}
        onNewProjectNameChange={handleNewProjectNameChange}
        onSaveProject={handleSaveProject}
        status={status}
        currentProject={currentProject}
      />
      <div className="flex-grow flex flex-col min-h-0">
         <header className="bg-slate-800/50 shadow-lg z-10 border-b border-slate-700">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold leading-tight text-white">
                    Construction Contracts AI Manager
                </h1>
                <p className="text-gray-400 mt-1">
                    {appMode === 'analysis' ? "Analyze new contracts against your company's clause database." : "Find specific clauses in a contract using natural language."}
                </p>
            </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 w-full flex-grow overflow-y-auto">
            <div className="px-4 py-6 sm:px-0">
                {appMode === 'analysis' ? (
                    <div className="bg-slate-800 p-8 rounded-lg shadow-xl space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-100 flex items-center"><DatabaseIcon className="w-6 h-6 mr-2 text-blue-400" />Step 1: Upload Clause Database</h2>
                            <FileUpload onFileSelect={handleFileSelect(setDatabaseFile)} acceptedFormats=".xlsx, .csv, .json" title="Clause Database" fileName={databaseFile?.name} key={`db-upload-${currentProject?.id || 'new'}`} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-100 flex items-center"><ContractIcon className="w-6 h-6 mr-2 text-blue-400" />Step 2: Upload New Contract</h2>
                            <FileUpload onFileSelect={handleFileSelect(setContractFile)} acceptedFormats=".pdf, .docx" title="New Contract" fileName={contractFile?.name} key={`contract-upload-analysis-${currentProject?.id || 'new'}`} />
                        </div>
                        </div>
                        <div className="text-center">
                        <button onClick={handleAnalyze} disabled={!databaseFile || !contractFile || isBusy} className="w-full md:w-1/2 lg:w-1/3 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md">
                            {status === 'analyzing' ? 'Analyzing...' : 'Run Analysis'}
                        </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-800 p-8 rounded-lg shadow-xl space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-100 flex items-center"><ContractIcon className="w-6 h-6 mr-2 text-blue-400" />Step 1: Upload New Contract</h2>
                            <FileUpload onFileSelect={handleFileSelect(setContractFile)} acceptedFormats=".pdf, .docx" title="New Contract" fileName={contractFile?.name} key={`contract-upload-search-${currentProject?.id || 'new'}`} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-100 flex items-center"><SearchIcon className="w-6 h-6 mr-2 text-blue-400" />Step 2: Describe what you're looking for</h2>
                            <textarea
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setIsDirty(true);
                                }}
                                placeholder="e.g., 'Find all clauses related to payment terms and retention...'"
                                className="w-full h-28 p-4 bg-slate-700 border border-slate-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Search query"
                            />
                        </div>
                        <div className="text-center">
                            <button onClick={handleSearch} disabled={!contractFile || !searchQuery || isBusy} className="w-full md:w-1/2 lg:w-1/3 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md">
                                {status === 'searching' ? 'Searching...' : 'Run Search'}
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-8 bg-red-900/50 border-l-4 border-red-500 text-red-300 p-4 rounded-md shadow" role="alert">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                    </div>
                )}
                
                {isProcessing && progress.length > 0 && (
                    <div className="mt-8">
                        <AnalysisProgress steps={progress} />
                    </div>
                )}
                
                <div className="mt-8 space-y-8">
                    {appMode === 'analysis' && analysisResults && (
                        <>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-100 mb-4">Analysis Summary</h2>
                                <SummaryTable results={analysisResults} />
                            </div>
                            <ResultsTable results={analysisResults} />
                        </>
                    )}
                    {appMode === 'search' && searchResults && (
                        <SearchResultsTable results={searchResults} />
                    )}
                </div>
            </div>
        </main>
        
        <footer className="text-center py-2 px-4 text-xs text-gray-600 border-t border-slate-700">
            Version 08.08.2025
        </footer>
      </div>
    </div>
  );
}

export default App;