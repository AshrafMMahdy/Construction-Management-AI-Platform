
import React, { useState, useCallback, useEffect } from 'react';
import { ReportData, AdditionalDocData, AnalysisMethod, Project, ProjectSummary } from './types';
import { generateDelayReport } from './services/geminiService';

import Header from './components/Header';
import ReportOutput from './components/ReportOutput';
import ProgressTracker from './components/ProgressTracker';
import AdditionalDocsUploader from './components/AdditionalDocsUploader';
import SaveIcon from './components/icons/SaveIcon';

interface ProgressStep {
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
}

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
  // Project State
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string>('new');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Form State
  const [projectName, setProjectName] = useState<string>('');
  const [scheduleData, setScheduleData] = useState<string>('');
  const [scheduleFileName, setScheduleFileName] = useState<string>('');
  const [analysisMethod, setAnalysisMethod] = useState<AnalysisMethod>('as-built-vs-planned');
  const [additionalDocs, setAdditionalDocs] = useState<AdditionalDocData[]>([]);
  
  // Report State
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Progress State
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  const fetchProjects = async () => {
    setError(null);
    try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Failed to fetch projects' }));
            throw new Error(err.message);
        }
        const data: ProjectSummary[] = await response.json();
        setProjects(data);
    } catch (e: any) {
        setError(e.message);
        setProjects([]);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const resetProjectState = useCallback(() => {
    setCurrentProjectId('new');
    setProjectName('');
    setScheduleData('');
    setScheduleFileName('');
    setAnalysisMethod('as-built-vs-planned');
    setAdditionalDocs([]);
    setReport(null);
    setError(null);
    setIsDirty(false);
  }, []);

  const loadProject = useCallback(async (id: string) => {
    setError(null);
    try {
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) {
            if (response.status === 404) throw new Error(`Project with ID ${id} not found.`);
            const err = await response.json().catch(() => ({ message: `Failed to load project.`}));
            throw new Error(err.message);
        }
        const project: Project = await response.json();
        setCurrentProjectId(project.id);
        setProjectName(project.name);
        setScheduleData(project.scheduleData);
        setScheduleFileName(project.scheduleFileName);
        setAnalysisMethod(project.analysisMethod);
        setAdditionalDocs(project.additionalDocs);
        setReport(project.report);
        setIsDirty(false);
    } catch (e: any) {
        setError(e.message);
        resetProjectState(); // Fallback to a new project state on error
    }
  }, [resetProjectState]);

  const handleLoadSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (isDirty) {
        if (!window.confirm("You have unsaved changes. Are you sure you want to switch projects? Your current work will be lost.")) {
            e.target.value = currentProjectId; // Revert selection
            return;
        }
    }
    if (selectedId && selectedId !== 'new') {
        loadProject(selectedId);
    }
  };
  
  const handleCreateNew = () => {
    if (currentProjectId === 'new' && !isDirty) return;

    if (isDirty) {
        if (!window.confirm("You have unsaved changes. Are you sure you want to start a new project? Your current work will be lost.")) {
            return;
        }
    }
    resetProjectState();
  };


  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setScheduleData(text);
        setScheduleFileName(file.name);
        setError(null);
        setIsDirty(true);
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
        setScheduleFileName('');
        setScheduleData('');
      };
      reader.readAsText(file);
    }
  }, []);
  
  const handleDocsChange = useCallback((newDocs: AdditionalDocData[]) => {
    setAdditionalDocs(newDocs);
    setIsDirty(true);
  }, []);

  const handleGenerateReport = useCallback(async () => {
    if (!scheduleData) {
      setError('Please upload a schedule data file first.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setReport(null);

    const initialSteps: ProgressStep[] = [
        { name: 'Parsing Schedule Data', status: 'pending' },
        { name: 'Analyzing Supporting Documents', status: 'pending' },
        { name: 'Performing Delay Analysis', status: 'pending' },
        { name: 'Compiling Executive Report', status: 'pending' }
    ];
    setProgressSteps(initialSteps);
    setOverallProgress(0);

    const updateStepStatus = (index: number, status: ProgressStep['status']) => {
        setProgressSteps(prev => prev.map((step, i) => i === index ? { ...step, status } : step));
    };
    
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        updateStepStatus(0, 'in_progress');
        setOverallProgress(10);
        await sleep(700);
        updateStepStatus(0, 'completed');

        updateStepStatus(1, 'in_progress');
        setOverallProgress(35);
        await sleep(1000);
        updateStepStatus(1, 'completed');
        
        updateStepStatus(2, 'in_progress');
        setOverallProgress(65);
        await sleep(800);
        updateStepStatus(2, 'completed');

        updateStepStatus(3, 'in_progress');
        setOverallProgress(90);

        const generatedReport = await generateDelayReport(scheduleData, analysisMethod, additionalDocs);

        updateStepStatus(3, 'completed');
        setOverallProgress(100);

        await sleep(500);

        setReport(generatedReport);
        setIsDirty(true); // Generated report is unsaved data
        setIsLoading(false);

    } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
        setProgressSteps(prev => prev.map(s => {
            if (s.status === 'in_progress') return {...s, status: 'pending' };
            return s;
        }));
        setOverallProgress(0);
        setIsLoading(false);
    }
  }, [scheduleData, analysisMethod, additionalDocs]);

  const handleSaveProject = async () => {
     if (isSaving || !isDirty) return;
     if (currentProjectId === 'new' && !projectName.trim()) {
        setError("Please enter a project name before saving.");
        return;
     }

     setIsSaving(true);
     setError(null);

     const projectData = {
        name: projectName.trim(),
        scheduleData,
        scheduleFileName,
        analysisMethod,
        additionalDocs,
        report
     };

     try {
        const isNew = currentProjectId === 'new';
        const url = isNew ? '/api/projects' : `/api/projects/${currentProjectId}`;
        const method = isNew ? 'POST' : 'PUT';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to save project.');
        }

        const savedProject: Project = await response.json();
        
        if(isNew) {
            setProjects(prev => [...prev, { id: savedProject.id, name: savedProject.name }].sort((a, b) => a.name.localeCompare(b.name)));
        } else {
            setProjects(prev => prev.map(p => p.id === savedProject.id ? { ...p, name: savedProject.name } : p).sort((a,b) => a.name.localeCompare(b.name)));
        }
        
        setCurrentProjectId(savedProject.id);
        setProjectName(savedProject.name);
        setIsDirty(false);

     } catch (e: any) {
        setError(e.message);
     } finally {
        setIsSaving(false);
     }
  };

  const canSave = isDirty && !(currentProjectId === 'new' && !projectName.trim());

  return (
    <div className="min-h-screen bg-slate-900 font-sans flex flex-col">
      <Header />
      <div className="flex-grow container mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-8">
        {/* --- Sidebar --- */}
        <aside className="md:w-1/3 lg:w-1/4 xl:w-1/5 max-w-sm flex-shrink-0">
          <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 space-y-6 sticky top-6">
            <h2 className="text-xl font-bold text-slate-100 border-b border-slate-600 pb-3">Project Controls</h2>
            
            {/* 1. Analysis Method */}
            <div>
              <label htmlFor="analysis-method" className="font-semibold text-slate-200 block mb-2">
                Analysis Method
              </label>
              <select
                id="analysis-method"
                value={analysisMethod}
                onChange={(e) => { setAnalysisMethod(e.target.value as AnalysisMethod); setIsDirty(true); }}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {Object.entries(analysisMethods).map(([key, { name }]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>

            {/* 2. Load Project */}
            <div>
              <label htmlFor="project-load-select" className="font-semibold text-slate-200 block mb-2">
                  Load Existing Project
              </label>
               <select
                id="project-load-select"
                value={currentProjectId}
                onChange={handleLoadSelect}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="new" disabled>-- Select a Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            {/* 3. New Project Name */}
            {currentProjectId === 'new' && (
                <div className="animate-fade-in-item">
                    <label htmlFor="project-name" className="font-semibold text-slate-200 block mb-2">
                        New Project Name
                    </label>
                    <input
                        id="project-name"
                        type="text"
                        value={projectName}
                        onChange={(e) => { setProjectName(e.target.value); setIsDirty(true); }}
                        placeholder="e.g. 'Downtown Tower'"
                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>
            )}
            
            {/* 4. Create New Project */}
            <button
              onClick={handleCreateNew}
              className="w-full px-4 py-2 bg-slate-600 text-slate-200 font-bold rounded-lg shadow-md hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 transition-all duration-200"
            >
              + Start a New Project
            </button>
            
            {/* 5. Save Button */}
            <div className="pt-6 border-t border-slate-700">
               <p className="text-sm text-slate-400 mb-2 h-5">
                    {isDirty ? "You have unsaved changes." : "Everything is up-to-date."}
                </p>
              <button
                onClick={handleSaveProject}
                disabled={isSaving || !canSave}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500 transition-all duration-200"
              >
                 <SaveIcon className="w-5 h-5" />
                 {isSaving ? 'Saving...' : (currentProjectId !== 'new' ? 'Save Changes' : 'Save New Project')}
              </button>
            </div>
          </div>
        </aside>

        {/* --- Main Content --- */}
        <main className="flex-grow space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 space-y-6">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-100">
                Analysis Workspace: <span className="text-blue-400 font-semibold">{projectName || 'New Project'}</span>
              </h2>
              <div className="bg-slate-900/50 p-3 rounded-lg text-sm text-slate-400 border border-slate-700">
                <p><span className="font-bold">Required Data for {analysisMethods[analysisMethod].name}:</span> {analysisMethods[analysisMethod].description}</p>
              </div>

              <div>
                <label className="font-semibold text-slate-200 block mb-2">
                  1. Upload Schedule Data
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
                    {scheduleFileName ? (
                      <p className="text-green-400 font-semibold">{scheduleFileName}</p>
                    ) : (
                      <p className="text-slate-400">Click to upload a file (.txt, .csv, .json)</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-200 block mb-2">
                  2. (Optional) Add Supporting Documents
                </label>
                 <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                    <AdditionalDocsUploader docs={additionalDocs} setDocs={handleDocsChange} />
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
          </div>

          {isLoading && <ProgressTracker steps={progressSteps} overallProgress={overallProgress} />}
          
          {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg shadow" role="alert">
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">{error}</span>
              </div>
          )}

          {report && !isLoading && (
              <div className="mt-6 space-y-6">
                  <ReportOutput data={report} />
              </div>
          )}
        </main>
      </div>

      <footer className="w-full text-right p-4">
          <p className="text-xs text-slate-500">Version: 08.08.2025</p>
      </footer>
       <style>{`
          @keyframes fade-in-item {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-item {
            animation: fade-in-item 0.3s ease-out forwards;
          }
        `}</style>
    </div>
  );
};

export default App;
