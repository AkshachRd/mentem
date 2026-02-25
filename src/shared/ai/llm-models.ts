import 'server-only';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouterApiKey = process.env.OPENROUTER_API_KEY;

if (!openrouterApiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
}

const openrouter = createOpenRouter({ apiKey: openrouterApiKey });

export const MODEL_ID = 'arcee-ai/trinity-large-preview:free' as const;

export const thinkingModel = openrouter(MODEL_ID);
export const fleshModel = openrouter(MODEL_ID);
