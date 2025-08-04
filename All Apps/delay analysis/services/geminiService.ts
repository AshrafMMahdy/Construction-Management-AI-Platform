import { GoogleGenAI, Type } from "@google/genai";
import { ReportData, AdditionalDocData } from '../types';

const MODEL_NAME = 'gemini-2.5-flash';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING, description: "A high-level overview of the project, the delay, and the claim. For a senior executive." },
        methodology: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "Title for the methodology section, reflecting the chosen analysis method." },
                description: { type: Type.STRING, description: "A detailed explanation of the specific delay analysis method used for this report." }
            },
            required: ['title', 'description']
        },
        delayAnalysis: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "Title for the delay analysis findings section." },
                findings: {
                    type: Type.ARRAY,
                    description: "A list of all identified delayed activities with details, relevant to the chosen analysis method.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            activity: { type: Type.STRING, description: "Name of the construction activity or delay event." },
                            plannedStart: { type: Type.STRING, description: "Planned start date (e.g., YYYY-MM-DD)." },
                            plannedEnd: { type: Type.STRING, description: "Planned end date (e.g., YYYY-MM-DD)." },
                            actualStart: { type: Type.STRING, description: "Actual start date (e.g., YYYY-MM-DD)." },
                            actualEnd: { type: Type.STRING, description: "Actual end date (e.g., YYYY-MM-DD)." },
                            delayDays: { type: Type.NUMBER, description: "The total number of calendar days of delay for this activity." },
                            impact: { type: Type.STRING, description: "A brief explanation of the impact of this specific delay on the project, supported by evidence from additional documents if provided." }
                        },
                        required: ['activity', 'plannedStart', 'plannedEnd', 'actualStart', 'actualEnd', 'delayDays', 'impact']
                    }
                }
            },
            required: ['title', 'findings']
        },
        claimSummary: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "Title for the claim summary section." },
                summary: { type: Type.STRING, description: "A summary of the claim being made, requesting an extension of time and any associated costs, justified by the analysis and supporting documents." }
            },
            required: ['title', 'summary']
        },
        supportingDocuments: {
            type: Type.ARRAY,
            description: "A list of supporting documents relevant to the analysis. This should include both documents inferred from the schedule data and those uploaded by the user.",
            items: {
                type: Type.OBJECT,
                properties: {
                    documentName: { type: Type.STRING, description: "The name of the referenced document (e.g., 'Baseline Programme Rev A', 'Site Diary 2024-05-15', 'Email from Client RE: Design Change')." },
                    referenceLink: { type: Type.STRING, description: "A placeholder URL for the document, e.g., 'doc_link/baseline_programme_rev_a.pdf'." },
                    references: {
                        type: Type.ARRAY,
                        description: "A list of specific quotes or paragraphs from this document that are used as evidence to support findings in the report. Each reference must include a page number and the exact text.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                pageNumber: { type: Type.STRING, description: "The page number or identifier (e.g., 'p. 5', 'Email Subject') where the evidence is located." },
                                paragraph: { type: Type.STRING, description: "The specific paragraph, sentence, or quote used as evidence." }
                            },
                            required: ['pageNumber', 'paragraph']
                        }
                    }
                },
                required: ['documentName', 'referenceLink', 'references']
            }
        }
    },
    required: ['executiveSummary', 'methodology', 'delayAnalysis', 'claimSummary', 'supportingDocuments']
};

const parseJsonFromResponse = (text: string): any => {
    const jsonRegex = /```json\s*([\s\S]*?)\s*```|({[\s\S]*}|\[[\s\S]*\])/;
    const match = text.match(jsonRegex);

    if (!match) {
        console.error("No JSON block found in the response:", text);
        throw new Error("The AI response did not contain a valid JSON object. It might be malformed.");
    }
    
    const jsonString = match[1] || match[2];

    if (!jsonString) {
        console.error("Could not extract JSON string from match:", match);
        throw new Error("The AI response format is unreadable.");
    }

    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse extracted JSON:", jsonString);
        console.error("Original parsing error:", e);
        throw new Error("The AI returned invalid JSON. Please try again.");
    }
};

export const generateDelayReport = async (scheduleData: string, analysisMethod: string, additionalDocs: AdditionalDocData[]): Promise<ReportData> => {
    const analysisMethodDetails = {
        'as-built-vs-planned': {
            name: 'As-Built vs. As-Planned',
            description: 'This is a retrospective analysis comparing the initial baseline plan against the final as-built schedule. It identifies total variance for each activity over the entire project duration. The provided data should contain the complete baseline and actual dates for project activities.'
        },
        'window-analysis': {
            name: 'Window Analysis',
            description: 'This is a retrospective analysis that breaks the project duration into smaller "windows" (e.g., monthly periods). It analyzes delays within each specific window by comparing the schedule status at the beginning and end of the period. This helps pinpoint when delays occurred. The provided data should contain periodic schedule updates.'
        },
        'time-impact-analysis': {
            name: 'Time Impact Analysis (TIA)',
            description: 'This is a forward-looking, cause-and-effect analysis. It models a specific delay event by inserting it into a current, undelayed schedule update to forecast its impact on the project completion date. The provided data should be a schedule snapshot from just before a known delay event, and ideally include a description of the delay event (fragnet).'
        }
    };
    
    const selectedMethod = analysisMethodDetails[analysisMethod as keyof typeof analysisMethodDetails] || analysisMethodDetails['as-built-vs-planned'];

    const supportingDocsPrompt = additionalDocs.length > 0
        ? `
ADDITIONAL SUPPORTING EVIDENCE:
The following documents have been provided as additional context. You MUST use the content of these documents to corroborate facts, find root causes for delays, and strengthen the narrative and justification in the 'Executive Summary', 'Delay Analysis' (specifically the 'impact' field), and 'Claim Summary' sections of your report. Cross-reference this information with the schedule data to build a stronger case.

--- START OF SUPPORTING DOCUMENTS ---
${additionalDocs.map(doc => `
Document Name: ${doc.name}
Document Category: ${doc.category}
Content:
${doc.content}
-------------------------------------`).join('\n')}
--- END OF SUPPORTING DOCUMENTS ---
`
        : '';

    const prompt = `
    Act as a world-class Contracts and Claims Manager for a major construction company. Your task is to perform a detailed delay analysis and generate an Executive Report and Delay Claim for the client.

    METHODOLOGY:
    You MUST perform the analysis using the "${selectedMethod.name}" methodology.
    Methodology Context: ${selectedMethod.description}

    INPUT DATA:
    The following is the primary schedule data from a file uploaded by the user. It can be in various formats (CSV, JSON, plain text). You must intelligently parse this data to extract the necessary schedule information.
    ---
    ${scheduleData}
    ---

    ${supportingDocsPrompt}

    TASK:
    Analyze all the provided data, strictly following the "${selectedMethod.name}" methodology. Identify delays and their impacts. Based on your complete analysis (of both schedule data and any supporting evidence), generate a comprehensive and professional Executive Report structured according to the provided JSON schema. Your justification for delays and claims must be robust and, where possible, cite evidence from the provided documents. Crucially, for each supporting document you list, you MUST populate the 'references' field with specific quotes and their page numbers that you used as evidence. Generate plausible but fictional reference links for the supporting documents. Your final output must be only the raw JSON object, without any surrounding text, explanations, or markdown fences.
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.2
            },
        });
        
        const reportData: ReportData = parseJsonFromResponse(response.text);
        return reportData;
    } catch (error) {
        console.error("Error generating report with Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate the delay report. Reason: ${error.message}`);
        }
        throw new Error("Failed to generate the delay report. An unknown error occurred during API communication.");
    }
};