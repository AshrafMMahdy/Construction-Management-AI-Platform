
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Clause, SearchResult } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const analysisResultSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      contract_clause_index: {
        type: Type.INTEGER,
        description: "The 0-based index of the clause from the input new contract list that this analysis pertains to.",
      },
      contract_clause_text: {
        type: Type.STRING,
        description: "The full text of the clause from the new contract being analyzed. This should be an exact copy from the input.",
      },
      status: {
        type: Type.STRING,
        description: "The AI's analysis status based on the comparison.",
        enum: ['Accepted', 'Rejected', 'Acceptable subject to modification', 'Requires Review (Inferred)'],
      },
      matched_database_clause_id: {
        type: Type.STRING,
        description: "The identifier (usually the 'id' field or index) of the database clause that was matched. This MUST be null if no direct match is found and the status is 'Requires Review (Inferred)'.",
      },
      portion_to_modify: {
          type: Type.STRING,
          description: "If status is 'Acceptable subject to modification', this MUST contain the specific text snippet from the new contract's clause that requires changes. Otherwise, this field should be omitted."
      },
      justification: {
        type: Type.STRING,
        description: "A detailed justification for the assigned status. If 'Requires Review (Inferred)', explain which database clauses (and their IDs) were used as a basis for the inference and why. If a direct match was found, explain the comparison.",
      },
    },
    required: ['contract_clause_index', 'contract_clause_text', 'status', 'justification'],
  },
};

const searchResultSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            contract_clause_index: {
                type: Type.INTEGER,
                description: "The 0-based index of the relevant clause from the input contract list.",
            },
            contract_clause_text: {
                type: Type.STRING,
                description: "The full text of the relevant clause from the contract. This must be an exact copy from the input.",
            },
            relevant_portion: {
                type: Type.STRING,
                description: "The specific portion of the clause text that is most relevant to the user's search query. This portion MUST be an exact substring of 'contract_clause_text'.",
            },
        },
        required: ['contract_clause_index', 'contract_clause_text', 'relevant_portion'],
    },
};


export const analyzeContract = async (contractClauses: string[], dbClauses: Clause[]): Promise<AnalysisResult[]> => {
  const model = "gemini-2.5-flash";

  const indexedDbClauses = dbClauses.map((clause, index) => ({ id: clause.id || index, ...clause }));
  const databaseJsonString = JSON.stringify(indexedDbClauses, null, 2);

  const contractClausesJsonString = JSON.stringify(contractClauses, null, 2);

  const prompt = `
    You are an expert AI legal assistant specializing in construction contract analysis. Your task is to analyze a list of clauses from a new contract and compare them against a master database of pre-approved clauses.

    Here is the master database of clauses in JSON format. Each object has an 'id' which you should use as 'matched_database_clause_id' when you find a match:
    \`\`\`json
    ${databaseJsonString}
    \`\`\`

    Here is the new contract, presented as a JSON array of strings, where each string is a clause:
    \`\`\`json
    ${contractClausesJsonString}
    \`\`\`

    Please perform the following for EACH clause in the new contract array:
    1.  Identify the clause from the new contract by its 0-based index. This index MUST be used for the 'contract_clause_index' field in your response.
    2.  Search the master database to find the most semantically similar or relevant clause.
    3.  **If a strong match is found:**
        - Compare the new contract's clause against the matched database clause and its annotation/content.
        - Assign a status: 'Accepted', 'Acceptable subject to modification', or 'Rejected'.
        - Provide the ID of the matched database clause in 'matched_database_clause_id'.
        - If the status is 'Acceptable subject to modification', you MUST populate 'portion_to_modify' with the exact text snippet from the new contract that needs changing.
    4.  **If NO direct or strong match is found in the database:**
        - The clause from the new contract is considered new or unrecognized.
        - You MUST assign the status 'Requires Review (Inferred)'.
        - In the 'justification' field, you must:
            a) State clearly that no direct match was found.
            b) Identify 1-3 of the most closely related clauses from the database.
            c) Summarize the company's position on these related clauses.
            d) Use this information to infer a risk level or recommended action for the new clause.
        - The 'matched_database_clause_id' MUST be null.
    5.  Provide a clear 'justification' for every determination.
    6.  Return a JSON array of result objects. **Crucially, your response array must have exactly one object for every clause in the input new contract array, and they must be in the same order.**
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisResultSchema,
                temperature: 0.2,
            },
        });
        
        const jsonText = response.text;
        if (!jsonText) {
            throw new Error("The API returned an empty response. This could be due to a content safety filter or other issue.");
        }

        const parsedResult = JSON.parse(jsonText);

        if (!Array.isArray(parsedResult)) {
            throw new Error("API response is not in the expected array format.");
        }
        
        // Post-processing and validation to ensure all clauses are accounted for.
        const resultsMap = new Map<number, AnalysisResult>();
        for (const item of parsedResult) {
            if (typeof item.contract_clause_index === 'number') {
                resultsMap.set(item.contract_clause_index, item);
            }
        }

        const finalResults: AnalysisResult[] = [];
        for (let i = 0; i < contractClauses.length; i++) {
            if (resultsMap.has(i)) {
                finalResults.push(resultsMap.get(i)!);
            } else {
                // If the AI failed to return an analysis for a clause, create a default entry.
                finalResults.push({
                    contract_clause_index: i,
                    contract_clause_text: contractClauses[i],
                    status: 'Requires Review (Inferred)',
                    justification: 'The AI model did not provide an analysis for this specific clause. Manual review is required.',
                    matched_database_clause_id: null
                });
            }
        }
        
        return finalResults;

    } catch (error: any) {
        console.error("Error calling Gemini API:", error);
        throw new Error(`Failed to analyze contract: ${error.message}`);
    }
};

export const searchContract = async (contractClauses: string[], query: string): Promise<SearchResult[]> => {
    const model = "gemini-2.5-flash";
    const contractClausesJsonString = JSON.stringify(contractClauses, null, 2);

    const prompt = `
        You are an expert AI legal assistant specializing in semantic search within construction contracts. Your task is to find all clauses in a contract that are relevant to a user's search query.

        Here is the contract, presented as a JSON array of strings, where each string is a clause:
        \`\`\`json
        ${contractClausesJsonString}
        \`\`\`

        Here is the user's search query:
        "${query}"

        Please perform the following steps:
        1.  Read through every clause in the provided JSON array of contract clauses.
        2.  For EACH clause that is semantically related to the user's search query, create a result object.
        3.  In the result object, you must include:
            - 'contract_clause_index': The original 0-based index of the clause from the input array.
            - 'contract_clause_text': The full, unmodified text of the clause.
            - 'relevant_portion': The specific, exact substring of the clause that directly pertains to the user's query. This is the most critical part of your response.
        4.  If a clause is not relevant, do not include it in the output.
        5.  Return a JSON array of these result objects. If no relevant clauses are found, return an empty array.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: searchResultSchema,
                temperature: 0.1,
            },
        });
        
        const jsonText = response.text.trim();
        if (!jsonText) {
            return [];
        }

        const parsedResult = JSON.parse(jsonText);

        if (!Array.isArray(parsedResult)) {
            throw new Error("API response is not in the expected array format.");
        }
        
        return parsedResult.filter(item => 
            typeof item.contract_clause_index === 'number' &&
            typeof item.contract_clause_text === 'string' &&
            typeof item.relevant_portion === 'string'
        );

    } catch (error: any) {
        console.error("Error calling Gemini API for search:", error);
        throw new Error(`Failed to search contract: ${error.message}`);
    }
};
