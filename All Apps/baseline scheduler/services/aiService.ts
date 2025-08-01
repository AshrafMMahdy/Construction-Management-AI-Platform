import { GoogleGenAI, Type } from "@google/genai";
import { ScheduleResponse, Activity, ProjectInput, EvaluationScores, AgentOutput } from '../types';
import { API_PROVIDER, LM_STUDIO_BASE_URL, MODELS } from '../config';

let ai: GoogleGenAI | null = null;
if (API_PROVIDER === 'GEMINI') {
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set. App will not function with Gemini provider.");
    } else {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
}

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        schedule: {
            type: Type.ARRAY,
            description: "The detailed project schedule.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.INTEGER, description: "Unique sequential ID starting from 1." },
                    name: { type: Type.STRING, description: "Name of the activity." },
                    duration: { type: Type.INTEGER, description: "Duration in working days." },
                    predecessors: { type: Type.STRING, description: "Predecessor string (e.g., '4SS+5' or '4FS,5SS+3'). An empty string for no predecessors." },
                },
                required: ["id", "name", "duration", "predecessors"]
            },
        },
        narrative: {
            type: Type.STRING,
            description: "A detailed explanation of the schedule's logic, written in a unique voice.",
        },
    },
    required: ["schedule", "narrative"]
};

const generateJsonContent = async (model: string, systemInstruction: string, userPrompt: string): Promise<any> => {
    if (API_PROVIDER === 'LM_STUDIO') {
        console.log(`Making request to LM Studio with model: ${model}`);
        const response = await fetch(`${LM_STUDIO_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7,
            }),
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`LM Studio API request failed with status ${response.status}: ${errorBody}`);
        }
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    } else { // GEMINI
        if (!ai) throw new Error("Gemini AI client not initialized. Is the API_KEY environment variable set?");
        const genAiResponse = await ai.models.generateContent({
            model: model,
            contents: [{ role: "user", parts: [{text: userPrompt}]}],
            config: { 
                systemInstruction: systemInstruction,
                responseMimeType: "application/json", 
                responseSchema: responseSchema
            },
        });
        return JSON.parse(genAiResponse.text.trim());
    }
};

const parsePredecessorIds = (predecessorString: string): number[] => {
    if (!predecessorString || predecessorString.trim() === '—' || predecessorString.trim() === '') return [];
    return predecessorString.split(',').map(p => p.trim().match(/^(\d+)/)).filter(Boolean).map(match => parseInt(match![1], 10));
};

const validateScheduleConnectivity = (activities: Activity[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!activities || activities.length === 0) {
        return { isValid: true, errors: [] };
    }

    const activityMap = new Map<number, Activity>(activities.map(a => [a.id, a]));

    const projectStart = activities.find(a => a.name?.toLowerCase().includes('project start'));
    if (!projectStart) {
        errors.push('The schedule is missing a "Project Start" activity.');
    }

    const projectEnd = activities.find(a => a.name?.toLowerCase().includes('project end'));
    if (!projectEnd) {
        errors.push('The schedule is missing a "Project End" activity.');
    }
    
    if (!projectStart || !projectEnd) {
        return { isValid: false, errors };
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
    
    // Check for dangling tasks (no successors)
    for (const [id, succs] of successors.entries()) {
        if (succs.length === 0 && id !== projectEnd.id) {
            const activityName = activityMap.get(id)?.name || `ID ${id}`;
            errors.push(`Dangling Task: Activity "${activityName}" is a dead end. It must connect to other tasks that lead towards "Project End".`);
        }
    }

    // Check for orphans (not reachable from start) using traversal
    const visited = new Set<number>();
    const queue: number[] = [projectStart.id];
    visited.add(projectStart.id);
    let head = 0;
    while (head < queue.length) {
        const currentId = queue[head++];
        (successors.get(currentId) || []).forEach(succId => {
            if (!visited.has(succId)) {
                visited.add(succId);
                queue.push(succId);
            }
        });
    }

    if (visited.size !== activities.length) {
        activities.forEach(activity => {
            if (!visited.has(activity.id)) {
                errors.push(`Orphan Task: Activity "${activity.name}" (ID ${activity.id}) is unreachable from "Project Start".`);
            }
        });
    }
    
    return { isValid: errors.length === 0, errors };
};


const evaluateSchedule = (scheduleData: Activity[]): EvaluationScores => {
    if (!scheduleData || scheduleData.length === 0) return { "Overall Status": "No data", "Total Activities": 0 };
    const totalDuration = scheduleData.reduce((sum, item) => sum + (Number(item.duration) || 0), 0);
    const hasProjectStart = scheduleData.some(item => item.name?.toLowerCase().includes('project start'));
    const hasProjectEnd = scheduleData.some(item => item.name?.toLowerCase().includes('project end'));
    const { isValid } = validateScheduleConnectivity(scheduleData);
    return {
        "Overall Status": isValid ? "Valid" : "Invalid",
        "Connectivity": isValid ? "Pass" : "Fail",
        "Total Activities": scheduleData.length,
        "Sum of Durations (days)": totalDuration,
        "Has Start/End": (hasProjectStart && hasProjectEnd) ? "Yes" : "No",
    };
};

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
    historicalData: string,
    projectInput: ProjectInput
): Promise<ScheduleResponse> => {
    const projectDesc = getProjectDescriptionText(projectInput);

    const userPrompt = `
You MUST follow these rules:
1. Base your schedule ONLY on the provided "Historical Project Data".
2. Output a JSON object: {"schedule": [...], "narrative": "..."}.
3. The schedule MUST start with "Project Start" (ID 1, duration 0) and end with "Project End" (duration 0).
4. ALL tasks must form a single connected graph from Start to End. No dangling tasks.
5. Predecessors use IDs, e.g., "4FS,5SS+3". An empty string for no predecessors.

Historical Project Data:
\`\`\`
${historicalData}
\`\`\`

New Project Details:
\`\`\`
${projectDesc}
\`\`\`

Now, generate the schedule and narrative.
    `;
    
    const model = API_PROVIDER === 'GEMINI' ? MODELS.GEMINI.AGENT : MODELS.LM_STUDIO.AGENT;
    const parsedJson = await generateJsonContent(model, systemInstruction, userPrompt);
    
    if (!parsedJson.schedule || !parsedJson.narrative) {
        throw new Error(`Agent ${agentId} produced an invalid format.`);
    }
    return parsedJson as ScheduleResponse;
};

const runLeaderAgent = async (
    historicalData: string,
    projectInput: ProjectInput,
    agentOutputs: AgentOutput[]
): Promise<ScheduleResponse> => {

    const agentSummaries = agentOutputs.map(out => `
---
Agent: ${out.agentId}
Evaluation Scores: ${JSON.stringify(out.scores)}
Narrative: "${out.narrative}"
Schedule proposal (JSON):
${JSON.stringify(out.schedule, null, 2)}
---
    `).join('\n');

    const systemInstruction = `You are the expert LEADER of an AI agent team. Your task is to analyze their work and create ONE final, superior, and logically sound schedule.
CRITICAL RULES:
1. Analyze all agent proposals, scores, and narratives. Synthesize the best elements from each.
2. Your final schedule MUST be logically perfect: NO DANGLING TASKS. Every task must be on a path from "Project Start" to "Project End".
3. The final schedule MUST start with a "Project Start" milestone (duration 0) and end with a "Project End" milestone (duration 0).
4. Output a SINGLE JSON object: {"schedule": [...], "narrative": "..."}.
5. Your narrative MUST be concise, around 150 words. It must explain your final decisions, referencing why you chose certain elements from your agents' proposals and the rationale for the final schedule's structure.
6. If you are given feedback on a previous attempt, you MUST correct all listed errors.`;

    const projectDesc = getProjectDescriptionText(projectInput);
    const model = API_PROVIDER === 'GEMINI' ? MODELS.GEMINI.LEADER : MODELS.LM_STUDIO.LEADER;
    
    let attempt = 0;
    const MAX_ATTEMPTS = 10;
    let feedbackPrompt = "";

    while (attempt < MAX_ATTEMPTS) {
        const userPrompt = `**New Project Details:**
\`\`\`
${projectDesc}
\`\`\`

**Historical Project Data:**
\`\`\`
${historicalData}
\`\`\`

**Your Team's Proposals:**
${agentSummaries}

${feedbackPrompt}

Now, generate the single best, final, and validated schedule and narrative.`;
        
        try {
            const parsedJson = await generateJsonContent(model, systemInstruction, userPrompt) as ScheduleResponse;
            
            const validationResult = validateScheduleConnectivity(parsedJson.schedule);
            if (validationResult.isValid) {
                return parsedJson; // Success!
            }

            attempt++;
            console.warn(`Leader agent output failed validation on attempt ${attempt}. Retrying with feedback...`);
            feedbackPrompt = `
ATTENTION: Your previous attempt to create a schedule was invalid. You MUST correct the following errors. Do not repeat them.
Critique of Previous Attempt:
${validationResult.errors.map(e => `- ${e}`).join('\n')}

Please analyze this feedback carefully. Keep the valid parts of your previous attempt, but fix ALL listed errors to create a new, fully connected schedule.
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

export const generateFinalSchedule = async (
    historicalData: string,
    projectInput: ProjectInput,
    onLeaderStart: () => void
): Promise<{ agentOutputs: AgentOutput[], finalSchedule: ScheduleResponse }> => {
    
    const agentConfigs = [
        { id: "Agent_1", instruction: "You are Agent 1. You prioritize creating the FASTEST possible schedule, maximizing parallel tasks." },
        { id: "Agent_2", instruction: "You are Agent 2. You prioritize RISK AVERSION, creating a conservative schedule with clear, simple dependencies." },
        { id: "Agent_3", instruction: "You are Agent 3. You prioritize adherence to the HISTORICAL DATA, mimicking past project structures precisely." },
    ];

    const agentPromises = agentConfigs.map(config => 
        runLocalAgent(config.id, config.instruction, historicalData, projectInput)
    );
    
    const results = await Promise.allSettled(agentPromises);

    const successfulOutputs: AgentOutput[] = [];
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            const scheduleResponse = result.value;
            successfulOutputs.push({
                agentId: agentConfigs[index].id,
                ...scheduleResponse,
                scores: evaluateSchedule(scheduleResponse.schedule)
            });
        } else {
             console.error(`Agent ${agentConfigs[index].id} failed:`, result.reason);
             successfulOutputs.push({
                agentId: agentConfigs[index].id,
                schedule: [],
                narrative: "This agent failed to generate a response.",
                scores: { "Overall Status": "Failed" }
             });
        }
    });

    if (successfulOutputs.filter(o => o.schedule.length > 0).length === 0) {
        throw new Error("All local agents failed to generate a schedule.");
    }
    
    onLeaderStart();

    const finalSchedule = await runLeaderAgent(historicalData, projectInput, successfulOutputs);

    return { agentOutputs: successfulOutputs, finalSchedule };
};