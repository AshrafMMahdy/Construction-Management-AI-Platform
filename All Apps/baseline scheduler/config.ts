
/**
 * Determines which API provider to use for generating schedules.
 * Change to 'LM_STUDIO' to use local models via LM Studio.
 *
 * @type {'GEMINI' | 'LM_STUDIO'}
 */
export const API_PROVIDER: 'GEMINI' | 'LM_STUDIO' = 'GEMINI';

/**
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
        AGENT: 'lm-studio-community/Meta-Llama-3-8B-Instruct-GGUF',
        LEADER: 'lm-studio-community/Meta-Llama-3-8B-Instruct-GGUF',
    }
};
