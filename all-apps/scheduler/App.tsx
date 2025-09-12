
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Activity, AgentOutput, ProjectInput, ProjectFeatures, ProgressStep, ProgressUpdate, GanttActivity, SavedProject, AiSchedulerData, SupportingDocument, ChartData } from './types';
import FileUpload from './components/FileUpload';
import ProjectForm from './components/ProjectForm';
import ScheduleTable from './components/ScheduleTable';
import NarrativeDisplay from './components/NarrativeDisplay';
import Spinner from './components/Spinner';
import EvaluationTable from './components/EvaluationTable';
import ProgressDisplay from './components/ProgressDisplay';
import SavedProjects from './components/SavedProjects';
import { generateFinalSchedule, getInitialSteps } from './services/aiService';
import { parseDataAndExtractFeatures } from './utils/dataParser';
import { WandIcon, DownloadIcon, UsersIcon, TableIcon, BarChartIcon, MessageSquareIcon, SaveIcon, PlusCircleIcon, TrendingUpIcon, LinkIcon, LinkOffIcon } from './components/IconComponents';
import DatePicker from './components/DatePicker';
import GanttChart from './components/GanttChart';
import ConfirmationModal from './components/ConfirmationModal';
import { calculateScheduleWithMetrics, countWorkdays, calculateChartData } from './utils/scheduleCalculator';
import { API_PROVIDER } from './config';
import SupportingDocsUpload from './components/SupportingDocsUpload';
import ChartsView from './components/ChartsView';

const App: React.FC = () => {
  const [historicalData, setHistoricalData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [projectFeatures, setProjectFeatures] = useState<ProjectFeatures | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [supportingDocs, setSupportingDocs] = useState<SupportingDocument[]>([]);

  const initialProjectInput: ProjectInput = {
    isNotInDb: false,
    description: '',
    selections: {},
  };
  const [projectInput, setProjectInput] = useState<ProjectInput>(initialProjectInput);
  
  const [agentOutputs, setAgentOutputs] = useState<AgentOutput[] | null>(null);
  const [generatedSchedule, setGeneratedSchedule] = useState<Activity[] | null>(null);
  const [generatedNarrative, setGeneratedNarrative] = useState<string | null>(null);
  const [totalProjectDuration, setTotalProjectDuration] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRegeneration, setIsRegeneration] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [ganttData, setGanttData] = useState<GanttActivity[] | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [view, setView] = useState<'schedule' | 'gantt' | 'charts'>('schedule');
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'critical'>('all');
  const [showLinks, setShowLinks] = useState<boolean>(true);


  const [showFeedbackForm, setShowFeedbackForm] = useState<boolean>(false);
  const [feedbackCategory, setFeedbackCategory] = useState<string>('General Feedback');
  const [feedbackText, setFeedbackText] = useState<string>('');

  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchProjects = async () => {
        setIsLoadingProjects(true);
        setError(null);
        try {
            const response = await fetch('/api/projects');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to fetch projects: ${response.statusText} - ${errorData.details || ''}`);
            }
            const projects = await response.json();
            setSavedProjects(projects);
        } catch (e) {
            console.error("Failed to load projects from blob storage", e);
            setError("Could not load saved projects. Please try refreshing.");
        } finally {
            setIsLoadingProjects(false);
        }
    };
    fetchProjects();
  }, []);

  const clearGeneratedData = useCallback((options: { keepAgentOutputs?: boolean, keepFeedbackText?: boolean } = {}) => {
    if (!options.keepAgentOutputs) {
      setAgentOutputs(null);
    }
    setGeneratedSchedule(null);
    setGeneratedNarrative(null);
    setProgress([]);
    setGanttData(null);
    setChartData(null);
    setTotalProjectDuration(null);
    setView('schedule');
    setScheduleFilter('all');
    setShowFeedbackForm(false);
    if (!options.keepFeedbackText) {
        setFeedbackText('');
    }
    setIsRegeneration(false);
    setShowLinks(true);
  }, []);

  const resetAllState = useCallback(() => {
    clearGeneratedData();
    setError(null);
    setProjectFeatures(null);
    setHistoricalData(null);
    setFileName(null);
    setProjectInput(initialProjectInput);
    setProjectName('');
    setSupportingDocs([]);
    setStartDate(new Date().toISOString().split('T')[0]);
    setCurrentProjectId(null);
  }, [clearGeneratedData, initialProjectInput]);

  const handleResetForNewProject = useCallback(() => {
    clearGeneratedData();
    setError(null);
    
    // Keep historical data if user wants to use it for a new project
    // setHistoricalData(null);
    // setFileName(null);
    // setProjectFeatures(null);
    
    // Reset project-specific fields
    setProjectName('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setCurrentProjectId(null);
    setSupportingDocs([]);
    
    // Reset project input form to defaults based on existing features
    const defaultSelections: Record<string, string> = {};
    if (projectFeatures) {
      for (const key in projectFeatures) {
          if (projectFeatures[key].length > 0) {
              defaultSelections[key] = projectFeatures[key][0];
          }
      }
    }
    setProjectInput({ ...initialProjectInput, selections: defaultSelections });

}, [projectFeatures, clearGeneratedData, initialProjectInput]);

  const handleFileLoad = useCallback((content: string, name: string) => {
    clearGeneratedData();
    setError(null);
    setSupportingDocs([]); // Clear supporting docs when new primary data is loaded

    // If no project is currently loaded, also clear the project name field
    // to signify we are starting a completely new project.
    if (!currentProjectId) {
        setProjectName('');
    }

    try {
      const { features } = parseDataAndExtractFeatures(content, name);
      setHistoricalData(content);
      setFileName(name);
      setProjectFeatures(features);

      const defaultSelections: Record<string, string> = {};
      for (const key in features) {
          if (features[key].length > 0) {
              defaultSelections[key] = features[key][0];
          }
      }
      setProjectInput({ ...initialProjectInput, selections: defaultSelections });

    } catch (e) {
        if (e instanceof Error) {
            setError(`Error parsing file: ${e.message}`);
        } else {
            setError('An unknown error occurred during file parsing.');
        }
    }
  }, [clearGeneratedData, currentProjectId, initialProjectInput]);
  
  const handleSupportingDocsChange = (docs: SupportingDocument[]) => {
      setSupportingDocs(docs);
  };

  const calculateAndSetDuration = (scheduleData: GanttActivity[]) => {
      if (!scheduleData || scheduleData.length === 0) {
        setTotalProjectDuration(null);
        return;
      }
      
      const startDates = scheduleData.map(a => a.startDate.getTime()).filter(t => t > 0);
      const endDates = scheduleData.map(a => a.endDate.getTime()).filter(t => t > 0);

      if (startDates.length === 0 || endDates.length === 0) {
        setTotalProjectDuration(null);
        return;
      }

      const minDate = new Date(Math.min(...startDates));
      const maxDate = new Date(Math.max(...endDates));
      
      const duration = countWorkdays(minDate, maxDate);
      setTotalProjectDuration(duration);
  };

  const handleProgressUpdate = (updates: ProgressUpdate[]) => {
    setProgress(currentProgress => {
        const newProgress = [...currentProgress];
        updates.forEach(update => {
            const stepIndex = newProgress.findIndex(p => p.name.startsWith(update.name));
            if (stepIndex !== -1) {
                newProgress[stepIndex] = { 
                    ...newProgress[stepIndex], 
                    name: update.newName || newProgress[stepIndex].name, 
                    status: update.status 
                };
            }
        });
        return newProgress;
    });
  };

  const handleGenerateClick = async () => {
    if (!historicalData || !fileName) {
      setError('Please upload historical project data first.');
      return;
    }
    
    setError(null);
    clearGeneratedData();
    
    setIsLoading(true);
    setProgress(getInitialSteps(API_PROVIDER));

    try {
      const { agentOutputs: newAgentOutputs, finalSchedule } = await generateFinalSchedule(
          historicalData,
          fileName,
          projectInput,
          supportingDocs,
          handleProgressUpdate,
          (outputs) => setAgentOutputs(outputs)
      );
      
      setAgentOutputs(newAgentOutputs);
      setGeneratedSchedule(finalSchedule.schedule);
      setGeneratedNarrative(finalSchedule.narrative);
      
      if (finalSchedule.schedule && finalSchedule.schedule.length > 0) {
        const calculatedGanttData = calculateScheduleWithMetrics(finalSchedule.schedule, startDate);
        setGanttData(calculatedGanttData);
        setChartData(calculateChartData(calculatedGanttData));
        calculateAndSetDuration(calculatedGanttData);
        setView('gantt');
      }

    } catch (err) {
      if (err instanceof Error) {
        setError(`An unexpected error occurred: ${err.message}`);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateWithFeedback = async () => {
    if (!historicalData || !fileName || !agentOutputs || !feedbackText.trim()) {
      setError('Cannot regenerate without initial data, agent outputs, and feedback text.');
      return;
    }
    
    setError(null);
    clearGeneratedData({ keepAgentOutputs: true, keepFeedbackText: true });
    
    setIsLoading(true);
    setIsRegeneration(true);
    setProgress([
      ...agentOutputs.map((o): ProgressStep => ({
        name: `${o.agentId.replace('_', ' ')} Proposal`,
        status: o.scores['Overall Status'] === 'Failed' ? 'failed' : 'completed',
      })),
      { name: 'Lead Agent is re-analyzing with your feedback', status: 'completed' },
      { name: 'Lead Agent is regenerating the final schedule based on provided feedback', status: 'pending' },
    ]);

    try {
      const { finalSchedule } = await generateFinalSchedule(
          historicalData,
          fileName,
          projectInput,
          supportingDocs,
          handleProgressUpdate,
          () => {}, // Agent outputs are already set, no need for this callback
          { 
            existingAgentOutputs: agentOutputs, 
            feedback: { category: feedbackCategory, text: feedbackText }
          }
      );
      
      setGeneratedSchedule(finalSchedule.schedule);
      setGeneratedNarrative(finalSchedule.narrative);
      
      if (finalSchedule.schedule && finalSchedule.schedule.length > 0) {
        const calculatedGanttData = calculateScheduleWithMetrics(finalSchedule.schedule, startDate);
        setGanttData(calculatedGanttData);
        setChartData(calculateChartData(calculatedGanttData));
        calculateAndSetDuration(calculatedGanttData);
        setView('gantt');
      }

    } catch (err) {
      if (err instanceof Error) {
        setError(`An unexpected error occurred during regeneration: ${err.message}`);
      } else {
        setError('An unexpected error occurred during regeneration.');
      }
    } finally {
      setIsLoading(false);
      setFeedbackText(''); 
      setFeedbackCategory('General Feedback');
    }
  };
    
  const handleSaveOrUpdateProject = async () => {
      if (!generatedSchedule || !generatedNarrative || !agentOutputs || !historicalData || !fileName) {
          setError("Not enough data to save the project.");
          return false;
      }
  
      if (!projectName.trim()){
          setError("Please enter a project name before saving.");
          return false;
      }
  
      setIsLoading(true);
      setError(null);
  
      // NOTE: Supporting documents are not saved for now to avoid complexity with file serialization.
      const aiSchedulerData: AiSchedulerData = {
          historicalData,
          fileName,
          projectInput,
          startDate,
          agentOutputs,
          generatedSchedule,
          generatedNarrative,
      };
  
      try {
          if (currentProjectId) {
              // --- UPDATE EXISTING PROJECT ---
              const existingProject = savedProjects.find(p => p.id === currentProjectId);
              if (!existingProject) {
                  setError("Consistency error: Cannot find current project in list to update.");
                  setIsLoading(false);
                  return false;
              }
              
              const updatedProject: SavedProject = {
                  ...existingProject,
                  name: projectName.trim(),
                  aiSchedulerData: aiSchedulerData
              };
              
              const response = await fetch(`/api/projects/${currentProjectId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updatedProject),
              });
              
              if (!response.ok) {
                  throw new Error(`Failed to update project: ${response.statusText}`);
              }
  
              const savedBlob = await response.json();
              
              setSavedProjects(prev => prev.map(p => p.id === currentProjectId ? { ...updatedProject, url: savedBlob.url } : p));
              
          } else {
              // --- CREATE NEW PROJECT ---
              const newProject: SavedProject = {
                  id: new Date().toISOString(),
                  name: projectName.trim(),
                  createdAt: new Date().toISOString(),
                  aiSchedulerData: aiSchedulerData,
              };
  
              const response = await fetch('/api/projects', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newProject),
              });

              if (!response.ok) {
                  throw new Error(`Failed to save project: ${response.statusText}`);
              }
              
              const savedBlob = await response.json();
              const projectWithUrl = { ...newProject, url: savedBlob.url };
  
              setSavedProjects(prev => [...prev, projectWithUrl]);
              setCurrentProjectId(projectWithUrl.id);
          }
          return true;
      } catch (e) {
          console.error("Failed to save or update project", e);
          setError("Cloud not save project. Please try again.");
          return false;
      } finally {
          setIsLoading(false);
      }
  };

  const handleLoadProject = (projectId: string) => {
    const projectToLoad = savedProjects.find(p => p.id === projectId);
    if (!projectToLoad || isLoading) return;

    // Check for scheduler data BEFORE resetting.
    let schedulerData: AiSchedulerData | undefined | null = null;
    if (projectToLoad.aiSchedulerData && typeof projectToLoad.aiSchedulerData === 'object') {
        schedulerData = projectToLoad.aiSchedulerData;
    } else if (projectToLoad.historicalData && projectToLoad.generatedSchedule) {
        schedulerData = projectToLoad as unknown as AiSchedulerData;
    }

    // CASE 1: External project without scheduler data.
    // Set the context, show a message, but DO NOT reset state. This preserves any
    // historical data the user might have just uploaded.
    if (!schedulerData) {
        clearGeneratedData();
        setProjectName(projectToLoad.name);
        setCurrentProjectId(projectToLoad.id);
        setError(`Project "${projectToLoad.name}" does not contain AI Scheduler data. This file might be from another application or an older version. Please upload historical data to generate a new schedule for this project.`);
        setProjectInput(initialProjectInput); // Reset form for new input
        setSupportingDocs([]); // Also clear supporting docs
        return; 
    }
    
    // CASE 2: Project has scheduler data.
    // Perform a full reset and then load the project's state.
    resetAllState();
    
    try {
        const { features } = parseDataAndExtractFeatures(schedulerData.historicalData, schedulerData.fileName);
        
        setHistoricalData(schedulerData.historicalData);
        setFileName(schedulerData.fileName);
        setProjectFeatures(features);
        setProjectName(projectToLoad.name);
        setProjectInput(schedulerData.projectInput || initialProjectInput);
        setStartDate(schedulerData.startDate || new Date().toISOString().split('T')[0]);
        setAgentOutputs(schedulerData.agentOutputs || null);
        setGeneratedSchedule(schedulerData.generatedSchedule || null);
        setGeneratedNarrative(schedulerData.generatedNarrative || null);
        
        // Supporting documents are not saved/loaded for simplicity. Reset them.
        setSupportingDocs([]);
        
        if (schedulerData.generatedSchedule && schedulerData.generatedSchedule.length > 0) {
            const calculatedGanttData = calculateScheduleWithMetrics(schedulerData.generatedSchedule, schedulerData.startDate);
            setGanttData(calculatedGanttData);
            setChartData(calculateChartData(calculatedGanttData));
            calculateAndSetDuration(calculatedGanttData);
            setView('gantt');
        }

        setCurrentProjectId(projectToLoad.id);
    } catch(e) {
        if (e instanceof Error) {
            setError(`Error loading project: ${e.message}`);
        } else {
            setError('An unknown error occurred while loading the project.');
        }
        setProjectName(projectToLoad.name);
        setCurrentProjectId(projectToLoad.id);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
      try {
        const response = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error(`Failed to delete project: ${response.statusText}`);
        }
        setSavedProjects(savedProjects.filter(p => p.id !== projectId));
        if (currentProjectId === projectId) {
            resetAllState();
        }
      } catch (e) {
          console.error("Failed to delete project from blob", e);
          setError("Could not delete project. Please try again.");
      }
  };

  const handleRenameProject = async (projectId: string, newName: string) => {
    try {
        const existingProject = savedProjects.find(p => p.id === projectId);
        if (!existingProject) {
            throw new Error("Project not found in local state");
        }
        const updatedProject = { ...existingProject, name: newName };

        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProject),
        });

        if (!response.ok) {
            throw new Error(`Failed to rename project: ${response.statusText}`);
        }
        
        setSavedProjects(savedProjects.map(p => 
            p.id === projectId ? { ...p, name: newName } : p
        ));
        if (currentProjectId === projectId) {
            setProjectName(newName);
        }
    } catch (e) {
        console.error("Failed to rename project in blob", e);
        setError("Could not rename project. Please try again.");
    }
  };

  const handleCreateNewProjectClick = () => {
    if (generatedSchedule && !currentProjectId) {
      setShowSaveConfirmation(true);
    } else {
      handleResetForNewProject();
    }
  };

  const handleConfirmSaveAndReset = async () => {
    const savedSuccessfully = await handleSaveOrUpdateProject();
    if (savedSuccessfully) {
        handleResetForNewProject();
    }
    setShowSaveConfirmation(false);
  };

  const handleDiscardAndReset = () => {
      handleResetForNewProject();
      setShowSaveConfirmation(false);
  };

  const handleDownloadCSV = () => {
    if (!ganttData) return;
    const headers = [
        "ID", "Name", "Resource Group", "Members per Crew", "# Crews", "BOQ Quantity", "Package Cost", 
        "Duration", "Total Float", "Is Critical", "Predecessors", "Start Date", "End Date"
    ];

    const toCsvField = (value: any) => {
        const str = String(value ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const rows = ganttData.map(act => 
        [
            act.id, 
            toCsvField(act.name),
            toCsvField(act.resourceGroupName),
            act.membersPerCrew ?? '',
            act.numberOfCrews ?? '',
            toCsvField(act.boqQuantity),
            toCsvField(act.packageCost),
            act.duration, 
            act.totalFloat, 
            act.isCritical, 
            toCsvField(act.predecessors), 
            act.startDate.toISOString().split('T')[0], 
            act.endDate.toISOString().split('T')[0]
        ].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const safeFileName = projectName.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'project';
    link.setAttribute("download", `schedule_${safeFileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const filteredTableData = useMemo(() => {
    if (!ganttData) return null;
    if (scheduleFilter === 'critical') {
        return ganttData.filter(a => a.isCritical);
    }
    return ganttData;
  }, [ganttData, scheduleFilter]);

  const isButtonDisabled = isLoading || !historicalData || (projectInput.isNotInDb && !projectInput.description.trim());
  const hasRun = progress.length > 0;

  const renderCurrentView = () => {
    switch(view) {
        case 'gantt':
            return <GanttChart activities={ganttData!} filter={scheduleFilter} showLinks={showLinks} />;
        case 'schedule':
            return filteredTableData && <ScheduleTable activities={filteredTableData} />;
        case 'charts':
            return chartData && <ChartsView data={chartData} />;
        default:
            return null;
    }
  };

  return (
    <div className="min-h-screen bg-brand-primary font-sans">
      {showSaveConfirmation && (
        <ConfirmationModal
          message="Do you want to save the current project before creating a new one?"
          onConfirm={handleConfirmSaveAndReset}
          onDecline={handleDiscardAndReset}
          onClose={() => setShowSaveConfirmation(false)}
        />
      )}
      <header className="bg-brand-secondary/50 p-4 border-b border-brand-accent/20 flex items-center justify-center relative">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-light">
            AI Construction Scheduler (Multi-Agent)
          </h1>
          <p className="text-center text-brand-muted text-sm mt-1">
            Using a team of AI agents and a lead agent to build your project plan.
          </p>
        </div>
      </header>
      
      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 bg-brand-secondary rounded-xl shadow-2xl p-6 h-fit flex flex-col gap-8">
            <FileUpload onFileLoad={handleFileLoad} fileName={fileName} disabled={isLoading} />

            <SupportingDocsUpload
                docs={supportingDocs}
                onDocsChange={handleSupportingDocsChange}
                disabled={isLoading}
            />
            
            <SavedProjects
                projects={savedProjects}
                currentProjectId={currentProjectId}
                onLoad={handleLoadProject}
                onDelete={handleDeleteProject}
                onRename={handleRenameProject}
                disabled={isLoading}
                isLoading={isLoadingProjects}
            />

            {historicalData && (
                 <>
                    <div className="w-full">
                        <h3 className="text-lg font-semibold text-brand-accent mb-2">3. Project Name</h3>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Enter a unique name for this project"
                            disabled={isLoading}
                            className="w-full p-2 bg-brand-primary border-2 border-brand-muted rounded-md focus:outline-none focus:border-brand-accent transition-colors text-brand-light placeholder-brand-muted disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="New project name"
                        />
                        
                        {currentProjectId && (
                        <div className="mt-4 p-3 bg-brand-primary/50 rounded-lg border border-brand-muted/30">
                            <button 
                                onClick={handleResetForNewProject} 
                                className="w-full text-center text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
                                aria-label="Eject current project"
                            >
                                Eject Current Project
                            </button>
                            <p className="text-xs text-brand-muted mt-1 text-center">
                                Clears the generated schedule and inputs to let you start a new one.
                            </p>
                        </div>
                        )}
                    </div>

                    <DatePicker 
                        label="4. Expected Start Date"
                        selectedDate={startDate}
                        onChange={setStartDate}
                        disabled={isLoading}
                    />

                    {projectFeatures && (
                        <ProjectForm 
                            projectInput={projectInput} 
                            onInputChange={setProjectInput} 
                            projectFeatures={projectFeatures}
                            disabled={isLoading} 
                        />
                    )}
                 </>
            )}
            
            <div className="mt-2">
              <button
                onClick={handleGenerateClick}
                disabled={isButtonDisabled}
                className={`w-full flex items-center justify-center gap-2 text-lg font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg
                  ${isButtonDisabled 
                    ? 'bg-brand-muted/40 text-brand-muted cursor-not-allowed' 
                    : 'bg-brand-accent text-brand-primary hover:bg-yellow-400 transform hover:-translate-y-1'}`
                }
              >
                {isLoading ? <Spinner /> : <WandIcon className="w-6 h-6" />}
                <span>{isLoading && !isRegeneration ? 'Generating...' : (isLoading && isRegeneration ? 'Regenerating...' : 'Generate Schedule')}</span>
              </button>
            </div>
            {error && <div className="mt-4 text-center p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-md">{error}</div>}
          </div>

          <div className="lg:col-span-8 flex flex-col gap-8">
            {ganttData ? (
              <div className="flex flex-col gap-8">
                {!isRegeneration && agentOutputs && (
                    <div>
                      <h2 className="text-2xl font-bold text-brand-accent mb-4">Agent Performance Evaluation</h2>
                      <EvaluationTable agentOutputs={agentOutputs} />
                    </div>
                )}
                <div>
                  <div className="flex justify-between items-center mb-2 mt-4 flex-wrap gap-y-2">
                    <h2 className="text-2xl font-bold text-brand-accent">Final Synthesized Schedule</h2>
                     <div className="flex items-center gap-2">
                        {view !== 'charts' && (
                            <div className="flex items-center bg-brand-primary p-1 rounded-lg text-sm">
                                <button onClick={() => setScheduleFilter('all')} className={`px-3 py-1 rounded-md transition-colors ${scheduleFilter === 'all' ? 'bg-brand-accent text-brand-primary font-semibold' : 'hover:bg-brand-muted/20'}`}>
                                    All Activities
                                </button>
                                <button onClick={() => setScheduleFilter('critical')} className={`px-3 py-1 rounded-md transition-colors ${scheduleFilter === 'critical' ? 'bg-brand-accent text-brand-primary font-semibold' : 'hover:bg-brand-muted/20'}`}>
                                    Critical Path
                                </button>
                            </div>
                        )}
                        <div className="flex items-center bg-brand-primary p-1 rounded-lg">
                            <button onClick={() => setView('gantt')} className={`p-2 rounded-md transition-colors ${view === 'gantt' ? 'bg-brand-accent text-brand-primary' : 'hover:bg-brand-muted/20'}`} aria-label="Gantt Chart View">
                                <BarChartIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => setView('schedule')} className={`p-2 rounded-md transition-colors ${view === 'schedule' ? 'bg-brand-accent text-brand-primary' : 'hover:bg-brand-muted/20'}`} aria-label="Table View">
                                <TableIcon className="w-5 h-5"/>
                            </button>
                             <button onClick={() => setView('charts')} className={`p-2 rounded-md transition-colors ${view === 'charts' ? 'bg-brand-accent text-brand-primary' : 'hover:bg-brand-muted/20'}`} aria-label="Charts View">
                                <TrendingUpIcon className="w-5 h-5"/>
                            </button>
                            {view === 'gantt' && (
                                <>
                                    <div className="border-l h-5 border-brand-muted/30 mx-1"></div>
                                    <button
                                        onClick={() => setShowLinks(!showLinks)}
                                        className="p-2 rounded-md transition-colors hover:bg-brand-muted/20"
                                        title={showLinks ? "Hide Activity Links" : "Show Activity Links"}
                                    >
                                        {showLinks ? <LinkIcon className="w-5 h-5 text-brand-accent"/> : <LinkOffIcon className="w-5 h-5 text-brand-muted"/>}
                                    </button>
                                </>
                            )}
                        </div>
                        <button
                            onClick={handleDownloadCSV}
                            className="flex items-center gap-2 py-2 px-4 bg-brand-secondary hover:bg-brand-muted/20 text-brand-light font-semibold rounded-lg transition-colors border border-brand-muted"
                            aria-label="Download schedule as CSV"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            <span>CSV</span>
                        </button>
                    </div>
                  </div>
                  {totalProjectDuration !== null && (
                    <h3 className="text-md font-semibold text-brand-muted -mt-1 mb-4">
                      Overall Project Duration: {totalProjectDuration} workdays
                    </h3>
                  )}
                  
                  {renderCurrentView()}

                </div>
                {generatedNarrative && (
                  <div>
                    <NarrativeDisplay narrative={generatedNarrative} />
                  </div>
                )}

                {!isLoading && generatedSchedule && (
                    <div className="mt-2 bg-brand-secondary p-6 rounded-lg shadow-lg">
                        {!showFeedbackForm ? (
                            <div className="flex flex-col sm:flex-row gap-4">
                                 <button
                                    onClick={handleSaveOrUpdateProject}
                                    disabled={isLoading || !projectName.trim() || !generatedSchedule}
                                    className="flex-1 flex items-center justify-center gap-2 text-lg font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg bg-green-600 hover:bg-green-500 text-white disabled:bg-brand-muted/40 disabled:text-brand-muted disabled:cursor-not-allowed"
                                    aria-label={currentProjectId ? 'Update current project' : 'Save as new project'}
                                >
                                    <SaveIcon className="w-6 h-6" />
                                    <span>{currentProjectId ? 'Update Project' : 'Save New Project'}</span>
                                </button>
                                <button
                                    onClick={handleCreateNewProjectClick}
                                    className="flex-1 flex items-center justify-center gap-2 text-lg font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg bg-blue-600 hover:bg-blue-500 text-white"
                                >
                                    <PlusCircleIcon className="w-6 h-6" />
                                    <span>Create New Project</span>
                                </button>
                                <button
                                    onClick={() => setShowFeedbackForm(true)}
                                    className="flex-1 flex items-center justify-center gap-2 text-lg font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg bg-brand-primary hover:bg-brand-muted/20 text-brand-light border border-brand-accent/50"
                                >
                                    <MessageSquareIcon className="w-6 h-6" />
                                    <span>Provide Feedback</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-brand-accent">Provide Feedback</h3>
                                <p className="text-sm text-brand-muted">Help the lead agent improve the schedule by providing specific feedback. The agent proposals will be kept, but the lead agent will regenerate the final schedule based on your input.</p>
                                
                                <div>
                                    <label htmlFor="feedback-category" className="block text-sm font-medium text-brand-light mb-1">Feedback Category</label>
                                    <select
                                        id="feedback-category"
                                        value={feedbackCategory}
                                        onChange={(e) => setFeedbackCategory(e.target.value)}
                                        className="w-full p-2 bg-brand-primary border-2 border-brand-muted rounded-md focus:outline-none focus:border-brand-accent transition-colors text-brand-light"
                                    >
                                        <option>General Feedback</option>
                                        <option>Logical Error (e.g., wrong dependency)</option>
                                        <option>Missing Activities</option>
                                        <option>Incorrect Durations</option>
                                        <option>Redundant Activities</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="feedback-text" className="block text-sm font-medium text-brand-light mb-1">Feedback Details</label>
                                    <textarea
                                        id="feedback-text"
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        placeholder="e.g., 'Activity 5 should not start until Activity 3 is completely finished. Please change to a Finish-to-Start dependency.'"
                                        className="w-full h-24 p-3 bg-brand-primary border-2 border-brand-muted rounded-md focus:outline-none focus:border-brand-accent transition-colors text-brand-light placeholder-brand-muted"
                                        aria-label="Feedback details"
                                    />
                                </div>

                                <div className="flex justify-end gap-4">
                                    <button
                                        onClick={() => setShowFeedbackForm(false)}
                                        className="py-2 px-4 bg-brand-muted/40 text-brand-light font-semibold rounded-lg transition-colors hover:bg-brand-muted/60"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleRegenerateWithFeedback}
                                        disabled={!feedbackText.trim()}
                                        className="flex items-center justify-center gap-2 font-bold py-2 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg bg-brand-accent text-brand-primary hover:bg-yellow-400 disabled:bg-brand-muted/40 disabled:text-brand-muted disabled:cursor-not-allowed"
                                    >
                                        <WandIcon className="w-5 h-5" />
                                        <span>Regenerate with Feedback</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
              </div>
            ) : hasRun ? (
               <ProgressDisplay 
                 steps={progress}
                 agentOutputs={agentOutputs}
                 title={isLoading ? (isRegeneration ? "Regenerating Schedule..." : "Generating Your Schedule...") : "Generation Failed"}
                 feedback={isRegeneration && feedbackText.trim() ? { category: feedbackCategory, text: feedbackText } : undefined}
               />
            ) : (
              <div className="flex flex-col items-center justify-center text-center bg-brand-secondary rounded-xl shadow-2xl p-10 min-h-[400px]">
                <UsersIcon className="w-16 h-16 text-brand-muted mb-4"/>
                <h2 className="text-2xl font-bold text-brand-light">Ready to Build Your Schedule</h2>
                <p className="text-brand-muted mt-2 max-w-md">
                  Upload your data, define your project, and let the AI agent team do the heavy lifting.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
