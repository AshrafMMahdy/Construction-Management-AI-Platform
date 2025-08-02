
import React, { useState, useCallback, ChangeEvent } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultsTable } from './components/ResultsTable';
import { SummaryTable } from './components/SummaryTable';
import { Loader } from './components/Loader';
import { ContractIcon, DatabaseIcon, SearchIcon, ChevronDownIcon } from './components/icons';
import { parseContractFile, parseDatabaseFile } from './services/fileParser';
import { analyzeContract, searchContract } from './services/geminiService';
import { AnalysisResult, Clause, SearchResult } from './types';
import { SearchResultsTable } from './components/SearchResultsTable';

type AppMode = 'analysis' | 'search';

function App() {
  const [appMode, setAppMode] = useState<AppMode>('analysis');
  const [databaseFile, setDatabaseFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[] | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const handleModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as AppMode;
    setAppMode(newMode);
    // Reset all state
    setDatabaseFile(null);
    setContractFile(null);
    setSearchQuery('');
    setAnalysisResults(null);
    setSearchResults(null);
    setIsLoading(false);
    setError(null);
  };

  const handleAnalyze = useCallback(async () => {
    if (!databaseFile || !contractFile) {
      setError("Please upload both the database and contract files.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResults(null);

    try {
      setLoadingMessage("Parsing clause database...");
      const dbClauses: Clause[] = await parseDatabaseFile(databaseFile);
      
      setLoadingMessage("Parsing contract document...");
      const contractContent = await parseContractFile(contractFile);
      
      if (!dbClauses || dbClauses.length === 0) throw new Error("Could not parse the database file or it is empty.");
      if (!contractContent || (contractContent.type === 'text' && contractContent.clauses.length === 0) || (contractContent.type === 'image' && contractContent.pages.length === 0)) {
        throw new Error("Could not extract any content from the contract file.");
      }

      if (contractContent.type === 'image') {
        setLoadingMessage("Scanned document detected. AI is analyzing pages... This may take longer.");
      } else {
        setLoadingMessage("AI is analyzing the contract... This may take a moment.");
      }

      const results = await analyzeContract(contractContent, dbClauses);
      setAnalysisResults(results);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unknown error occurred during analysis.");
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
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
    setIsLoading(true);
    setError(null);
    setSearchResults(null);

    try {
        setLoadingMessage("Parsing contract document...");
        const contractContent = await parseContractFile(contractFile);
        
        if (!contractContent || (contractContent.type === 'text' && contractContent.clauses.length === 0) || (contractContent.type === 'image' && contractContent.pages.length === 0)) {
          throw new Error("Could not extract any content from the contract file.");
        }

        if (contractContent.type === 'image') {
          setLoadingMessage("Scanned document detected. AI is searching pages... This may take longer.");
        } else {
          setLoadingMessage("AI is searching the contract...");
        }

        const results = await searchContract(contractContent, searchQuery);
        setSearchResults(results);

    } catch (err: any) {
        console.error(err);
        setError(err.message || "An unknown error occurred during search.");
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [contractFile, searchQuery]);

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
                  className="appearance-none w-full md:w-72 bg-slate-700 border border-slate-600 text-white py-2.5 pl-4 pr-10 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      <button onClick={handleAnalyze} disabled={!databaseFile || !contractFile || isLoading} className="w-full md:w-1/2 lg:w-1/3 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md">
                        {isLoading ? 'Analyzing...' : 'Run Analysis'}
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
                        <button onClick={handleSearch} disabled={!contractFile || !searchQuery || isLoading} className="w-full md:w-1/2 lg:w-1/3 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md">
                            {isLoading ? 'Searching...' : 'Run Search'}
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

          {isLoading && (
             <div className="mt-8 text-center p-8 bg-slate-800 rounded-lg shadow-xl">
               <Loader />
               <p className="mt-4 text-lg font-medium text-gray-300">{loadingMessage}</p>
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
