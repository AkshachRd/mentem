import { streamText } from 'ai';
import { openrouter } from '@openrouter/ai-sdk-provider';

import { getSystemPrompt } from '../lib/prompts';

export async function POST(req: Request) {
    const { prompt }: { prompt: string } = await req.json();

    const result = streamText({
        model: openrouter('tngtech/deepseek-r1t2-chimera:free'),
        system: getSystemPrompt(),
        prompt,
    });

    return result.toUIMessageStreamResponse();
}
