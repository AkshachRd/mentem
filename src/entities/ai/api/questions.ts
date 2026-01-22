import { streamText } from 'ai';
import { openrouter } from '@openrouter/ai-sdk-provider';

import { getSystemPrompt } from '../lib/prompts';

export async function POST(req: Request) {
    const { prompt }: { prompt: string } = await req.json();

    const result = streamText({
        model: openrouter('deepseek/deepseek-r1:free'),
        system: getSystemPrompt(),
        prompt,
    });

    return result.toUIMessageStreamResponse();
}
