
import React, { useState, useCallback, ChangeEvent, useRef } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultsTable } from './components/ResultsTable';
import { SummaryTable } from './components/SummaryTable';
import { AnalysisProgress } from './components/AnalysisProgress';
import { ContractIcon, DatabaseIcon, SearchIcon, ChevronDownIcon } from './components/icons';
import { parseContractFile, parseDatabaseFile } from './services/fileParser';
import { analyzeContract, searchContract } from './services/geminiService';
import { AnalysisResult, Clause, SearchResult } from './types';
import { SearchResultsTable } from './components/SearchResultsTable';

type AppMode = 'analysis' | 'search';
type AppStatus = 'idle' | 'analyzing' | 'searching';

export type ProgressStep = {
  name: string;
  status: 'pending' | 'in-progress' | 'done';
  progress: number;
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
  
  const progressIntervalRef = useRef<number | null>(null);

  const handleModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as AppMode;
    setAppMode(newMode);
    // Reset all state
    setDatabaseFile(null);
    setContractFile(null);
    setSearchQuery('');
    setAnalysisResults(null);
    setSearchResults(null);
    setStatus('idle');
    setProgress([]);
    setError(null);
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
        }, 100); // 100ms * 10 steps = 1 second
      });
      finishStep(2);

      setAnalysisResults(results);

      // All done, wait to show success
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

        // All done, wait to show success
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

  const isBusy = status !== 'idle';

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <header className="bg-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight text-white">
            Construction Contracts AI Manager
          </h1>
          <p className="text-gray-400 mt-1">
            {appMode === 'analysis' ? "Analyze new contracts against your company's clause database." : "Find specific clauses in a contract using natural language."}
          </p>
           <div className="mt-6">
              <label htmlFor="app-mode-select" className="block text-sm font-medium text-gray-400 mb-2">Select Functionality</label>
              <div className="relative inline-block w-full md:w-auto">
                <select
                  id="app-mode-select"
                  value={appMode}
                  onChange={handleModeChange}
                  disabled={isBusy}
                  className="appearance-none w-full md:w-72 bg-slate-700 border border-slate-600 text-white py-2.5 pl-4 pr-10 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="analysis">Contract Analysis</option>
                  <option value="search">Semantic Search</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                  <ChevronDownIcon className="h-5 w-5" />
                </div>
              </div>
           </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
            {appMode === 'analysis' ? (
                <div className="bg-slate-800 p-8 rounded-lg shadow-xl space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-100 flex items-center"><DatabaseIcon className="w-6 h-6 mr-2 text-blue-400" />Step 1: Upload Clause Database</h2>
                        <FileUpload onFileSelect={setDatabaseFile} acceptedFormats=".xlsx, .csv, .json" title="Clause Database" key="db-upload" />
                      </div>
                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-100 flex items-center"><ContractIcon className="w-6 h-6 mr-2 text-blue-400" />Step 2: Upload New Contract</h2>
                        <FileUpload onFileSelect={setContractFile} acceptedFormats=".pdf, .docx" title="New Contract" key="contract-upload-analysis" />
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
                        <FileUpload onFileSelect={setContractFile} acceptedFormats=".pdf, .docx" title="New Contract" key="contract-upload-search" />
                    </div>
                     <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-100 flex items-center"><SearchIcon className="w-6 h-6 mr-2 text-blue-400" />Step 2: Describe what you're looking for</h2>
                        <textarea
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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
          
          {(status === 'analyzing' || status === 'searching') && progress.length > 0 && (
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
    </div>
  );
}

export default App;
