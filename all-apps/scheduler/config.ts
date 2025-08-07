
/**
 * Determines which API provider to use for generating schedules.
 * - 'GEMINI': Uses Google Gemini for all agents.
 * - 'LM_STUDIO': Uses local models for agents and embeddings, but a powerful Gemini model for the final leader agent.
 *
 * @type {'GEMINI' | 'LM_STUDIO'}
 */
export const API_PROVIDER: 'GEMINI' | 'LM_STUDIO' = 'GEMINI';

/**
 * --- LM STUDIO CONFIGURATION ---
 * The base URL for your LM Studio server.
 * This is typically 'http://localhost:1234/v1'
 */
export const LM_STUDIO_BASE_URL = 'http://localhost:1234/v1';

/**
 * Define the model names for each provider.
 * For LM Studio, use the model identifier shown in the server logs when you load a model.
 * e.g., 'lm-studio-community/Meta-Llama-3-8B-Instruct-GGUF'
 */
export const MODELS = {
    GEMINI: {
        AGENT: 'gemini-2.5-flash',
        LEADER: 'gemini-2.5-flash',
    },
    LM_STUDIO: {
        AGENT_1: 'gemma-2-9b-it-gguf', // Example, replace with your model
        AGENT_2: 'gemma-2-9b-it-gguf', // Example, replace with your model
        AGENT_3: 'gemma-2-9b-it-gguf', // Example, replace with your model
        EMBED: 'nomic-ai/nomic-embed-text-v1.5-GGUF', // Example, replace with your embedding model
        LEADER: 'gemini-2.5-flash', // The leader is intentionally a Gemini model for superior reasoning
    }
};
