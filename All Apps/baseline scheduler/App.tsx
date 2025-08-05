
import React, { useState, useCallback } from 'react';
import { Activity, AgentOutput, ProjectInput, ProjectFeatures, ProgressStep, ProgressUpdate, GanttActivity } from './types';
import FileUpload from './components/FileUpload';
import ProjectForm from './components/ProjectForm';
import ScheduleTable from './components/ScheduleTable';
import NarrativeDisplay from './components/NarrativeDisplay';
import Spinner from './components/Spinner';
import EvaluationTable from './components/EvaluationTable';
import ProgressDisplay from './components/ProgressDisplay';
import { generateFinalSchedule, getInitialSteps } from './services/aiService';
import { parseDataAndExtractFeatures } from './utils/dataParser';
import { WandIcon, DownloadIcon, UsersIcon, TableIcon, BarChartIcon, MessageSquareIcon } from './components/IconComponents';
import DatePicker from './components/DatePicker';
import GanttChart from './components/GanttChart';
import { calculateScheduleForwardPass, countWorkdays } from './utils/scheduleCalculator';
import { API_PROVIDER } from './config';

const App: React.FC = () => {
  const [historicalData, setHistoricalData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [projectFeatures, setProjectFeatures] = useState<ProjectFeatures | null>(null);

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
  const [view, setView] = useState<'schedule' | 'gantt'>('schedule');

  const [showFeedbackForm, setShowFeedbackForm] = useState<boolean>(false);
  const [feedbackCategory, setFeedbackCategory] = useState<string>('General Feedback');
  const [feedbackText, setFeedbackText] = useState<string>('');

  const handleFileLoad = useCallback((content: string, name: string) => {
    setError(null);
    setAgentOutputs(null);
    setGeneratedSchedule(null);
    setGeneratedNarrative(null);
    setProjectFeatures(null);
    setProgress([]);
    setGanttData(null);
    setTotalProjectDuration(null);
    setView('schedule');
    setShowFeedbackForm(false);
    setFeedbackText('');
    setIsRegeneration(false);

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
  }, []);
  
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
    setAgentOutputs(null);
    setGeneratedSchedule(null);
    setGeneratedNarrative(null);
    setGanttData(null);
    setTotalProjectDuration(null);
    setView('schedule');
    setShowFeedbackForm(false);
    setIsRegeneration(false);
    
    setIsLoading(true);
    setProgress(getInitialSteps(API_PROVIDER));

    try {
      const { agentOutputs: newAgentOutputs, finalSchedule } = await generateFinalSchedule(
          historicalData,
          fileName,
          projectInput,
          handleProgressUpdate,
          (outputs) => setAgentOutputs(outputs)
      );
      
      setAgentOutputs(newAgentOutputs);
      setGeneratedSchedule(finalSchedule.schedule);
      setGeneratedNarrative(finalSchedule.narrative);
      
      if (finalSchedule.schedule && finalSchedule.schedule.length > 0) {
        const calculatedGanttData = calculateScheduleForwardPass(finalSchedule.schedule, startDate);
        setGanttData(calculatedGanttData);
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
    setGeneratedSchedule(null);
    setGeneratedNarrative(null);
    setGanttData(null);
    setTotalProjectDuration(null);
    setView('schedule'); // Reset view
    setShowFeedbackForm(false); // Hide the form after submission
    
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
        const calculatedGanttData = calculateScheduleForwardPass(finalSchedule.schedule, startDate);
        setGanttData(calculatedGanttData);
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
      // The local feedback state can be cleared, as the view will have changed
      setFeedbackText(''); 
      setFeedbackCategory('General Feedback');
    }
  };
  
  const handleDownloadCSV = () => {
    if (!generatedSchedule) return;
    const headers = ["ID", "Name", "Duration", "Predecessors"];
    const toCsvField = (value: string | number) => {
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };
    const rows = generatedSchedule.map(act => 
        [act.id, toCsvField(act.name), act.duration, toCsvField(act.predecessors)].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const safeFileName = projectInput.description.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'project';
    link.setAttribute("download", `schedule_${safeFileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isButtonDisabled = isLoading || !historicalData || (projectInput.isNotInDb && !projectInput.description.trim());
  const hasRun = progress.length > 0;

  return (
    <div className="min-h-screen bg-brand-primary font-sans">
      <header className="bg-brand-secondary/50 p-4 border-b border-brand-accent/20">
        <h1 className="text-2xl font-bold text-center text-brand-light">
          AI Construction Scheduler (Multi-Agent)
        </h1>
        <p className="text-center text-brand-muted text-sm mt-1">
          Using a team of AI agents and a lead agent to build your project plan.
        </p>
      </header>
      
      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 bg-brand-secondary rounded-xl shadow-2xl p-6 h-fit flex flex-col gap-8">
            <FileUpload onFileLoad={handleFileLoad} fileName={fileName} disabled={isLoading} />
            {historicalData && (
                <>
                    <DatePicker 
                        label="Expected Start Date"
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
                  <div className="flex justify-between items-center mb-2 mt-4">
                    <h2 className="text-2xl font-bold text-brand-accent">Final Synthesized Schedule</h2>
                     <div className="flex items-center gap-2">
                        <div className="flex items-center bg-brand-primary p-1 rounded-lg">
                            <button onClick={() => setView('gantt')} className={`p-2 rounded-md transition-colors ${view === 'gantt' ? 'bg-brand-accent text-brand-primary' : 'hover:bg-brand-muted/20'}`} aria-label="Gantt Chart View">
                                <BarChartIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => setView('schedule')} className={`p-2 rounded-md transition-colors ${view === 'schedule' ? 'bg-brand-accent text-brand-primary' : 'hover:bg-brand-muted/20'}`} aria-label="Table View">
                                <TableIcon className="w-5 h-5"/>
                            </button>
                        </div>
                        <button
                            onClick={handleDownloadCSV}
                            className="flex items-center gap-2 py-2 px-4 bg-brand-secondary hover:bg-brand-muted/20 text-brand-light font-semibold rounded-lg transition-colors border border-brand-muted"
                            aria-label="Download schedule as CSV"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            <span>Download CSV</span>
                        </button>
                    </div>
                  </div>
                  {totalProjectDuration !== null && (
                    <h3 className="text-md font-semibold text-brand-muted -mt-1 mb-4">
                      Overall Project Duration: {totalProjectDuration} workdays
                    </h3>
                  )}
                  {view === 'gantt' ? (
                     <GanttChart activities={ganttData} />
                  ) : (
                     generatedSchedule && <ScheduleTable activities={generatedSchedule} />
                  )}
                </div>
                {generatedNarrative && (
                  <div>
                    <NarrativeDisplay narrative={generatedNarrative} />
                  </div>
                )}

                {!isLoading && generatedSchedule && (
                    <div className="mt-2 bg-brand-secondary p-6 rounded-lg shadow-lg">
                        {!showFeedbackForm ? (
                            <button
                                onClick={() => setShowFeedbackForm(true)}
                                className="w-full flex items-center justify-center gap-2 text-lg font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg bg-brand-primary hover:bg-brand-muted/20 text-brand-light border border-brand-accent/50"
                            >
                                <MessageSquareIcon className="w-6 h-6" />
                                <span>Provide Feedback on Generated Schedule</span>
                            </button>
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
