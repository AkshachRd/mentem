import { streamText } from 'ai';

import { getSystemPrompt } from '../lib/prompts';

import { thinkingModel } from '@/shared/ai/llm-models';

export async function POST(req: Request) {
    const { prompt }: { prompt: string } = await req.json();

    const result = streamText({
        model: thinkingModel,
        system: getSystemPrompt(),
        prompt,
    });

    return result.toUIMessageStreamResponse();
}
