import { streamText } from 'ai';

import { getSystemPrompt } from '@/entities/card/lib/prompts';
import { fleshModel } from '@/shared/ai/llm-models';

export async function POST(req: Request) {
    const { prompt }: { prompt: string } = await req.json();

    const result = streamText({
        model: fleshModel,
        system: getSystemPrompt(),
        prompt,
    });

    return result.toUIMessageStreamResponse();
}
