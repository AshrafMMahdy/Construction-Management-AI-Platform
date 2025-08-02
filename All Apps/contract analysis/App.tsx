import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultsTable } from './components/ResultsTable';
import { SummaryTable } from './components/SummaryTable';
import { Loader } from './components/Loader';
import { ContractIcon, DatabaseIcon } from './components/icons';
import { parseContractFile, parseDatabaseFile } from './services/fileParser';
import { analyzeContract } from './services/geminiService';
import { AnalysisResult, Clause } from './types';

function App() {
  const [databaseFile, setDatabaseFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

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
      const contractClauses: string[] = await parseContractFile(contractFile);
      
      if (!dbClauses || dbClauses.length === 0) {
        throw new Error("Could not parse the database file or it is empty.");
      }
      if (!contractClauses || contractClauses.length === 0) {
        throw new Error("Could not extract any valid clauses from the contract file. Please check the file content and filtering logic.");
      }

      setLoadingMessage("AI is analyzing the contract... This may take a moment.");
      const results = await analyzeContract(contractClauses, dbClauses);
      setAnalysisResults(results);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unknown error occurred during analysis.");
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [databaseFile, contractFile]);

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <header className="bg-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight text-white">
            Construction Contracts AI Manager
          </h1>
          <p className="text-gray-400 mt-1">
            Analyze new contracts against your company's clause database.
          </p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-slate-800 p-8 rounded-lg shadow-xl space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-100 flex items-center">
                  <DatabaseIcon className="w-6 h-6 mr-2 text-blue-400" />
                  Step 1: Upload Clause Database
                </h2>
                <FileUpload
                  onFileSelect={setDatabaseFile}
                  acceptedFormats=".xlsx, .csv, .json"
                  title="Clause Database"
                />
              </div>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-100 flex items-center">
                   <ContractIcon className="w-6 h-6 mr-2 text-blue-400" />
                  Step 2: Upload New Contract
                </h2>
                <FileUpload
                  onFileSelect={setContractFile}
                  acceptedFormats=".pdf, .docx"
                  title="New Contract"
                />
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleAnalyze}
                disabled={!databaseFile || !contractFile || isLoading}
                className="w-full md:w-1/2 lg:w-1/3 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md"
              >
                {isLoading ? 'Analyzing...' : 'Run Analysis'}
              </button>
            </div>
          </div>

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

          {analysisResults && (
            <div className="mt-8 space-y-8">
               <div>
                  <h2 className="text-2xl font-semibold text-gray-100 mb-4">Analysis Summary</h2>
                  <SummaryTable results={analysisResults} />
               </div>
               <ResultsTable results={analysisResults} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;