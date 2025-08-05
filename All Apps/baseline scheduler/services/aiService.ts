import { GoogleGenAI, Type } from "@google/genai";
import { ScheduleResponse, Activity, ProjectInput, EvaluationScores, AgentOutput, ProgressStep, ProgressUpdate, AgentActivitySuggestion, DependencyType } from '../types';
import { API_PROVIDER, LM_STUDIO_BASE_URL, MODELS } from '../config';
import { parseDataAndExtractFeatures } from "../utils/dataParser";
import { calculateScheduleForwardPass } from '../utils/scheduleCalculator';

// --- Constants and Schemas ---

// Schema for the FINAL output from the LEADER agent
const FINAL_SCHEDULE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        schedule: {
            type: Type.ARRAY,
            description: "The detailed project schedule, with predecessor strings calculated.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.INTEGER, description: "Unique sequential ID starting from 1." },
                    name: { type: Type.STRING, description: "Name of the activity." },
                    duration: { type: Type.INTEGER, description: "Duration in working days." },
                    predecessors: { type: Type.STRING, description: "Predecessor string (e.g., '4FS,5SS+3'). An empty string for no predecessors." },
                },
                required: ["id", "name", "duration", "predecessors"]
            },
        },
        narrative: {
            type: Type.STRING,
            description: "A detailed explanation of the schedule's logic, referencing agent proposals and explaining the final structure.",
        },
    },
    required: ["schedule", "narrative"]
};

// Schema for the LOCAL agent proposals
const SUCCESSOR_SUGGESTION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        successorId: { type: Type.INTEGER, description: "The ID of the activity that should come after this one." },
        dependencyType: { 
            type: Type.STRING, 
            enum: ['FS', 'SS', 'FF', 'SF'],
            description: "The dependency type: FS (Finish-to-Start), SS (Start-to-Start), FF (Finish-to-Finish), SF (Start-to-Finish)."
        },
        justification: { type: Type.STRING, description: "Brief reason why this is the logical successor and dependency type."}
    },
    required: ["successorId", "dependencyType", "justification"]
};

const LOCAL_AGENT_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        schedule: {
            type: Type.ARRAY,
            description: "The list of proposed project activities.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.INTEGER, description: "Unique sequential ID starting from 1. Ensure IDs are consistent across your proposal." },
                    name: { type: Type.STRING, description: "Name of the activity." },
                    duration: { type: Type.INTEGER, description: "Duration in working days." },
                    successorSuggestions: {
                        type: Type.ARRAY,
                        description: "An analysis of which activities should logically follow this one. An activity that is a natural end point should suggest the 'Project End' activity as its successor.",
                        items: SUCCESSOR_SUGGESTION_SCHEMA
                    }
                },
                required: ["id", "name", "duration", "successorSuggestions"]
            },
        },
        narrative: {
            type: Type.STRING,
            description: "A detailed explanation of the schedule's logic and activity choices, written in your unique agent voice.",
        },
    },
    required: ["schedule", "narrative"]
};


export const getInitialSteps = (apiProvider: 'GEMINI' | 'LM_STUDIO'): ProgressStep[] => {
    const steps: ProgressStep[] = [];
    if (apiProvider === 'LM_STUDIO') {
        steps.push({ name: 'Retrieving relevant context', status: 'pending' });
    } else {
        steps.push({ name: 'Reading & Analyzing Schedules database', status: 'pending' });
    }

    for (let i = 1; i <= 3; i++) {
        steps.push({ name: `Agent ${i} is Generating`, status: 'pending' });
    }

    steps.push({ name: 'Lead Agent is analyzing generated schedules', status: 'pending' });
    steps.push({ name: 'Lead agent is Generating', status: 'pending' });
    
    return steps;
};


// --- API Call Abstractions ---
async function callGemini(model: string, systemInstruction: string, userPrompt: string, schema: object): Promise<any> {
    const geminiAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await geminiAi.models.generateContent({
        model: model,
        contents: userPrompt,
        config: { 
            systemInstruction,
            responseMimeType: "application/json", 
            responseSchema: schema
        },
    });
    return JSON.parse(response.text.trim());
}

async function callLmStudio(model: string, systemInstruction: string, userPrompt:string, schema: object): Promise<any> {
    const response = await fetch(`${LM_STUDIO_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: userPrompt }
            ],
            // Not all LM Studio models support response_format with schema, so we provide it as a text-based guide
            response_format: { type: "json_object", schema: schema },
            temperature: 0.7,
        }),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`LM Studio API request failed for model ${model} with status ${response.status}: ${errorBody}`);
    }
    const data = await response.json();
    // Hope that the model followed instructions to output JSON in its content
    return JSON.parse(data.choices[0].message.content);
}

// --- RAG and Vector Logic (LM Studio Specific) ---
// Note: This part is simplified for brevity and assumes a compatible embedding model is running.
async function retrieveRelevantContext(historicalData: string, fileName: string, projectInput: ProjectInput): Promise<string> {
    console.log("Starting RAG pipeline for LM Studio...");
    // In a real scenario, this would involve vector search.
    // For this example, we'll return a summarized version of the data.
    const { data: allRows } = parseDataAndExtractFeatures(historicalData, fileName);
    return JSON.stringify(allRows.slice(0, 50), null, 2); // Return top 50 rows as context
}


// --- Core Agent Logic ---
const getProjectDescriptionText = (projectInput: ProjectInput): string => {
    if (projectInput.isNotInDb) {
        return `This is a new type of project not in the database. The user described it as: "${projectInput.description}"`;
    } else if (Object.keys(projectInput.selections).length > 0) {
        const selectionsText = Object.entries(projectInput.selections)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
        return `This project should be generated based on historical projects with the following features: ${selectionsText}.`;
    } else {
        return "This is a typical project based on the historical data provided. Generate a representative schedule.";
    }
};

const runLocalAgent = async (
    agentId: string,
    systemInstruction: string,
    contextData: string,
    projectInput: ProjectInput,
    model: string,
): Promise<{schedule: AgentActivitySuggestion[], narrative: string}> => {
    const projectDesc = getProjectDescriptionText(projectInput);
    const contextHeader = API_PROVIDER === 'LM_STUDIO' ? "Relevant Historical Data (from RAG search)" : "Historical Project Data";

    const userPrompt = `
You MUST follow these critical rules:
1. Your entire output MUST be a single JSON object matching the required schema.
2. Your primary task is to propose a list of activities.
3. For EACH activity, you MUST analyze and determine its most logical successor(s) and the correct dependency type (FS, SS, FF, SF). This is the most important part of your job.
4. You MUST include "Project Start" (ID 1, duration 0) and "Project End" activities.
5. All activities must eventually lead to "Project End". Do this by correctly setting successor suggestions. For example, the last real activities should suggest "Project End" as their successor.
6. DO NOT calculate predecessors. Your job is to suggest successors.

${contextHeader}:
\`\`\`json
${contextData}
\`\`\`

New Project Details:
\`\`\`
${projectDesc}
\`\`\`

Now, generate your list of activities and their successor suggestions.
    `;
    
    if (API_PROVIDER === 'GEMINI') {
        return await callGemini(model, systemInstruction, userPrompt, LOCAL_AGENT_SCHEMA);
    } else { // LM_STUDIO
        return await callLmStudio(model, systemInstruction, userPrompt, LOCAL_AGENT_SCHEMA);
    }
};

const runLeaderAgent = async (
    contextData: string,
    projectInput: ProjectInput,
    agentOutputs: AgentOutput[],
    onProgressUpdate: (updates: ProgressUpdate[]) => void,
    leaderGenerateStepName: string
): Promise<ScheduleResponse> => {
    const agentSummaries = agentOutputs.map(out => `
---
Agent: ${out.agentId}
Evaluation Scores: ${JSON.stringify(out.scores)}
Narrative: "${out.narrative}"
Schedule proposal (with successor suggestions):
${JSON.stringify(out.schedule, null, 2)}
---
    `).join('\n');

    const systemInstruction = `You are the expert LEADER of an AI agent team. You are a master project scheduler. Your task is to analyze your team's proposals and create ONE final, superior, and logically sound schedule.

**YOUR CRITICAL TASKS:**
1.  **ANALYZE & SELECT:** Review all activities and successor suggestions from your agents. Discard redundant or illogical activities. Select the best and most comprehensive set of tasks to form a complete project.
2.  **CONSTRUCT THE GRAPH:** This is your most important task. Based on the successor suggestions, you must build the final schedule. For each activity you select, you will calculate its \`predecessors\` string (e.g., '5FS', '6SS+2'). You do this by looking at which other activities have listed it as a successor.
3.  **ENSURE LOGICAL SOUNDNESS:** The final schedule MUST be a fully connected graph. It must begin with "Project Start" (ID 1, duration 0) and end with "Project End" (duration 0). There must be a continuous path of dependencies from Start to End. NO orphan or dangling tasks.
4.  **PRODUCE FINAL OUTPUT:** Your output must be a single JSON object matching the final schedule schema, including the calculated \`predecessors\` for each activity.
5.  **NARRATIVE:** Write a concise narrative (around 150 words) explaining your final decisions, referencing why you chose certain elements from your agents' proposals and the rationale for the final schedule's structure.
6.  **SELF-CORRECTION:** If you are given feedback on a previous attempt, you MUST correct all listed errors in your new attempt.`;
    
    const leaderModel = API_PROVIDER === 'GEMINI' ? MODELS.GEMINI.LEADER : MODELS.LM_STUDIO.LEADER;
    const projectDesc = getProjectDescriptionText(projectInput);
    
    let attempt = 0;
    const MAX_ATTEMPTS = 10;
    let feedbackPrompt = "";

    while (attempt < MAX_ATTEMPTS) {
        const attemptText = ` (Attempt ${attempt + 1} of ${MAX_ATTEMPTS})`;
        onProgressUpdate([{ name: leaderGenerateStepName, status: 'running', newName: `${leaderGenerateStepName}${attemptText}` }]);

        const userPrompt = `**Project Details:**
\`\`\`
${projectDesc}
\`\`\`

**Your Team's Proposals (Activities with Successor Suggestions):**
${agentSummaries}

${feedbackPrompt}

Now, perform your duties. Analyze, select, construct the graph, and generate the single best, final, and validated schedule and narrative.`;
        
        try {
            const parsedJson = await callGemini(leaderModel, systemInstruction, userPrompt, FINAL_SCHEDULE_SCHEMA) as ScheduleResponse;
            const validationResult = validateScheduleConnectivity(parsedJson.schedule);
            if (validationResult.isValid) {
                return parsedJson; // Success!
            }

            attempt++;
            console.warn(`Leader agent output failed validation on attempt ${attempt}. Retrying with feedback...`);
            feedbackPrompt = `
**ATTENTION: Your previous attempt was invalid. You MUST correct the following errors.**
Critique of Previous Attempt:
${validationResult.errors.map(e => `- ${e}`).join('\n')}

Please analyze this feedback carefully. Re-evaluate your activity selection and predecessor calculations to create a new, fully connected schedule. Fix ALL listed errors.
`;

        } catch (e) {
            attempt++;
            console.error(`Leader agent failed on attempt ${attempt}`, e);
            if (attempt >= MAX_ATTEMPTS) {
                throw e; // Re-throw the last error
            }
            feedbackPrompt = `Your previous attempt resulted in an error and could not be processed. Please try again, ensuring your output is a valid JSON object matching the required schema. Error: ${e instanceof Error ? e.message : String(e)}`;
        }
    }
    throw new Error(`Leader agent failed to produce a validly connected schedule after ${MAX_ATTEMPTS} attempts.`);
};


// --- Orchestration and Validation ---

const parsePredecessorIds = (predecessorString: string): number[] => {
    if (!predecessorString || predecessorString.trim() === '—' || predecessorString.trim() === '') return [];
    return predecessorString.split(',').map(p => p.trim().match(/^(\d+)/)).filter(Boolean).map(match => parseInt(match![1], 10));
};

const validateScheduleConnectivity = (activities: Activity[]): { isValid: boolean; message: string; errors: string[] } => {
    const errors: string[] = [];
    if (!activities || activities.length === 0) {
        return { isValid: true, message: "Pass: The schedule is empty, so it is trivially valid.", errors: [] };
    }

    const activityMap = new Map<number, Activity>(activities.map(a => [a.id, a]));
    const projectStart = activities.find(a => a.name?.toLowerCase().includes('project start'));
    if (!projectStart) errors.push('The schedule is missing a "Project Start" activity.');

    const projectEnd = activities.find(a => a.name?.toLowerCase().includes('project end'));
    if (!projectEnd) errors.push('The schedule is missing a "Project End" activity.');
    
    if (!projectStart || !projectEnd) {
        return { isValid: false, message: "Fail: " + errors.join(' '), errors };
    }

    const successors = new Map<number, number[]>(activities.map(a => [a.id, []]));
    for (const activity of activities) {
        parsePredecessorIds(activity.predecessors).forEach(predId => {
            if (successors.has(predId)) {
                successors.get(predId)!.push(activity.id);
            } else {
                errors.push(`Activity "${activity.name}" lists a non-existent predecessor with ID ${predId}.`);
            }
        });
    }
    
    for (const [id, succs] of successors.entries()) {
        if (succs.length === 0 && id !== projectEnd.id) {
            const activityName = activityMap.get(id)?.name || `ID ${id}`;
            errors.push(`Dangling Task: Activity "${activityName}" is a dead end. It must connect to tasks that lead towards "Project End".`);
        }
    }

    const visited = new Set<number>();
    const queue: number[] = [projectStart.id];
    visited.add(projectStart.id);
    let head = 0;
    while (head < queue.length) {
        const currentId = queue[head++];
        (successors.get(currentId) || []).forEach(succId => {
            if (activityMap.has(succId) && !visited.has(succId)) {
                visited.add(succId);
                queue.push(succId);
            }
        });
    }

    if (visited.size < activities.length) {
        activities.forEach(activity => {
            if (!visited.has(activity.id)) {
                errors.push(`Orphan Task: Activity "${activity.name}" (ID ${activity.id}) is unreachable from "Project Start".`);
            }
        });
    }
    
    return errors.length > 0
        ? { isValid: false, message: `Fail: ${errors.join(' ')}`, errors }
        : { isValid: true, message: "Pass: The schedule forms a single, fully connected graph.", errors: [] };
};

const countWorkdays = (startDate: Date, endDate: Date): number => {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    while (curDate <= endDate) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
};

const evaluateAgentProposal = (proposal: AgentActivitySuggestion[]): EvaluationScores => {
    if (!proposal || proposal.length === 0) return { "Total Activities": 0 };

    // --- Graph Inversion & Forward Pass Calculation ---
    // 1. Convert successor suggestions into predecessor strings
    const activityList: Activity[] = proposal.map(p => ({ 
        id: p.id,
        name: p.name,
        duration: p.duration,
        predecessors: '' 
    }));
    const activityMap = new Map<number, Activity>(activityList.map(a => [a.id, a]));

    proposal.forEach(sourceActivity => {
        sourceActivity.successorSuggestions?.forEach(suggestion => {
            const targetActivity = activityMap.get(suggestion.successorId);
            if (targetActivity) {
                // Agent proposals are simple, they don't include lag. Format: "ID<TYPE>"
                const newPred = `${sourceActivity.id}${suggestion.dependencyType}`;
                targetActivity.predecessors = targetActivity.predecessors
                    ? `${targetActivity.predecessors},${newPred}`
                    : newPred;
            }
        });
    });
    
    // 2. Run forward pass
    const ganttActivities = calculateScheduleForwardPass(activityList, new Date().toISOString().split('T')[0]);
    
    // 3. Calculate total duration from the result
    let calculatedDuration: number | string = 'N/A';
    const projectStartActivity = ganttActivities.find(a => a.name?.toLowerCase().includes('project start'));
    const projectEndActivity = ganttActivities.find(a => a.name?.toLowerCase().includes('project end'));

    if (projectStartActivity && projectEndActivity && projectEndActivity.endDate.getTime() > 0 && projectStartActivity.startDate.getTime() > 0) {
        calculatedDuration = countWorkdays(projectStartActivity.startDate, projectEndActivity.endDate);
    } else {
        // Fallback if the graph is broken and start/end can't be calculated
        calculatedDuration = 'Invalid Graph';
    }

    const hasProjectStart = proposal.some(item => item.name?.toLowerCase().includes('project start'));
    const hasProjectEnd = proposal.some(item => item.name?.toLowerCase().includes('project end'));
    const totalSuccessorLinks = proposal.reduce((sum, item) => sum + (item.successorSuggestions?.length || 0), 0);

    return {
        "Calculated Duration (workdays)": calculatedDuration,
        "Total Activities": proposal.length,
        "Total Successor Links": totalSuccessorLinks,
        "Has Start/End": (hasProjectStart && hasProjectEnd) ? "Yes" : "No",
    };
};

export const generateFinalSchedule = async (
    historicalData: string,
    fileName: string,
    projectInput: ProjectInput,
    onProgressUpdate: (updates: ProgressUpdate[]) => void,
    onAgentOutputsReady: (outputs: AgentOutput[]) => void
): Promise<{ agentOutputs: AgentOutput[], finalSchedule: ScheduleResponse }> => {
    
    const agentConfigs = API_PROVIDER === 'GEMINI' ? [
        { id: "Agent_1", instruction: "You are Agent 1. You prioritize creating the FASTEST possible schedule, maximizing parallel tasks by suggesting aggressive successor links.", model: MODELS.GEMINI.AGENT },
        { id: "Agent_2", instruction: "You are Agent 2. You prioritize RISK AVERSION, creating a conservative schedule with clear, simple, and safe successor links.", model: MODELS.GEMINI.AGENT },
        { id: "Agent_3", instruction: "You are Agent 3. You prioritize adherence to the HISTORICAL DATA, proposing activities and successors that mimic past project structures.", model: MODELS.GEMINI.AGENT },
    ] : [ /* LM Studio configs */ ];
    
    const initialSteps = getInitialSteps(API_PROVIDER);
    const contextStepName = initialSteps[0].name;

    onProgressUpdate([{ name: contextStepName, status: 'running' }]);
    let contextData = historicalData;
    if (API_PROVIDER === 'LM_STUDIO') { // This logic is simplified
        contextData = await retrieveRelevantContext(historicalData, fileName, projectInput);
    }
    onProgressUpdate([{ name: contextStepName, status: 'completed' }]);

    const agentPromises = agentConfigs.map((config, index) => {
        const agentStepName = initialSteps[1 + index].name;
        return (async () => {
            onProgressUpdate([{ name: agentStepName, status: 'running' }]);
            try {
                const result = await runLocalAgent(config.id, config.instruction, contextData, projectInput, config.model);
                onProgressUpdate([{ name: agentStepName, status: 'completed' }]);
                return { status: 'fulfilled' as const, value: result, config };
            } catch (reason) {
                onProgressUpdate([{ name: agentStepName, status: 'failed' }]);
                return { status: 'rejected' as const, reason, config };
            }
        })();
    });
    
    const results = await Promise.all(agentPromises);

    const successfulOutputs: AgentOutput[] = [];
    results.forEach((result) => {
        if (result.status === 'fulfilled') {
            successfulOutputs.push({
                agentId: result.config.id,
                ...result.value,
                scores: evaluateAgentProposal(result.value.schedule)
            });
        } else {
             console.error(`Agent ${result.config.id} failed:`, result.reason);
             successfulOutputs.push({
                agentId: result.config.id,
                schedule: [],
                narrative: `This agent failed to generate a response. Error: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`,
                scores: { "Overall Status": "Failed" }
             });
        }
    });

    onAgentOutputsReady(successfulOutputs);

    if (successfulOutputs.filter(o => o.schedule.length > 0).length === 0) {
        throw new Error("All local agents failed to generate a schedule proposal.");
    }

    const leaderAnalysisStepName = initialSteps[initialSteps.length - 2].name;
    const leaderGenerateStepName = initialSteps[initialSteps.length - 1].name;

    onProgressUpdate([{ name: leaderAnalysisStepName, status: 'completed' }, { name: leaderGenerateStepName, status: 'running' }]);
    
    try {
        const finalSchedule = await runLeaderAgent(contextData, projectInput, successfulOutputs, onProgressUpdate, leaderGenerateStepName);
        onProgressUpdate([{ name: leaderGenerateStepName, status: 'completed' }]);
        return { agentOutputs: successfulOutputs, finalSchedule };
    } catch(e) {
        onProgressUpdate([{ name: leaderGenerateStepName, status: 'failed' }]);
        throw e;
    }
};