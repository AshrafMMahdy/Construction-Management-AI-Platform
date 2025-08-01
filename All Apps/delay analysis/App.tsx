import React, { useState, useCallback } from 'react';
import { ReportData, AdditionalDocData } from './types';
import { generateDelayReport } from './services/geminiService';

import Header from './components/Header';
import ReportOutput from './components/ReportOutput';
import Loader from './components/Loader';
import AdditionalDocsUploader from './components/AdditionalDocsUploader';

type AnalysisMethod = 'as-built-vs-planned' | 'window-analysis' | 'time-impact-analysis';

const analysisMethods: Record<AnalysisMethod, { name: string; description: string }> = {
  'as-built-vs-planned': {
    name: 'As-Built vs. As-Planned',
    description: 'Requires the original baseline schedule and the final as-built schedule data. Compares planned dates directly against actual dates for the entire project.',
  },
  'window-analysis': {
    name: 'Window Analysis',
    description: 'Requires periodic schedule updates throughout the project (e.g., monthly). The project is divided into "windows" and delays are analyzed for each period separately.',
  },
  'time-impact-analysis': {
    name: 'Time Impact Analysis (TIA)',
    description: 'Requires a schedule snapshot immediately before a known delay event and a "fragnet" describing the delay event itself. Forecasts the impact of a specific event.',
  },
};

const App: React.FC = () => {
  const [scheduleData, setScheduleData] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [analysisMethod, setAnalysisMethod] = useState<AnalysisMethod>('as-built-vs-planned');
  const [additionalDocs, setAdditionalDocs] = useState<AdditionalDocData[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setScheduleData(text);
        setFileName(file.name);
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
        setFileName('');
        setScheduleData('');
      };
      reader.readAsText(file);
    }
  }, []);

  const handleGenerateReport = useCallback(async () => {
    if (!scheduleData) {
      setError('Please upload a schedule data file first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setReport(null);
    try {
      const generatedReport = await generateDelayReport(scheduleData, analysisMethod, additionalDocs);
      setReport(generatedReport);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [scheduleData, analysisMethod, additionalDocs]);

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-6">
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 mb-6 space-y-6">
          
          <div>
            <label htmlFor="analysis-method" className="font-semibold text-slate-200 block mb-2">
              1. Select Delay Analysis Method
            </label>
            <select
              id="analysis-method"
              value={analysisMethod}
              onChange={(e) => setAnalysisMethod(e.target.value as AnalysisMethod)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              {Object.entries(analysisMethods).map(([key, { name }]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
            <div className="bg-slate-900/50 p-3 rounded-lg mt-2 text-sm text-slate-400 border border-slate-700">
              <p><span className="font-bold">Required Data:</span> {analysisMethods[analysisMethod].description}</p>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-2">
              2. Upload Schedule Data
            </label>
            <div className="relative flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-600 rounded-lg bg-slate-700/50 hover:border-blue-500 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept=".txt,.csv,.json"
              />
              <div className="text-center">
                {fileName ? (
                  <p className="text-green-400 font-semibold">{fileName}</p>
                ) : (
                  <p className="text-slate-400">Click to upload a file (.txt, .csv, .json)</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-2">
              3. (Optional) Add Supporting Documents
            </label>
             <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <AdditionalDocsUploader docs={additionalDocs} setDocs={setAdditionalDocs} />
             </div>
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={handleGenerateReport}
              disabled={isLoading || !scheduleData}
              className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? 'Analyzing...' : 'Analyze & Generate Report'}
            </button>
          </div>
        </div>

        <div className="mt-6">
          {isLoading && <Loader message="Performing delay analysis and compiling report..." />}
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg shadow" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {report && <ReportOutput data={report} />}
        </div>
      </main>
    </div>
  );
};

export default App;
