import { streamObject } from 'ai';
import { z } from 'zod';

import { thinkingModel } from '@/shared/ai/llm-models';

export const maxDuration = 30;

const tagsSchema = z.object({
    tags: z.array(z.string()).describe('Array of 2-5 relevant tags for the content'),
});

const SYSTEM_PROMPT = `You are an expert at categorizing and tagging content.

Your task is to analyze the provided text and generate 2-5 relevant tags.

Guidelines:
1. Tags should be concise (1-3 words each)
2. Tags should capture the main topics, concepts, or themes
3. Use lowercase for consistency
4. Prefer specific tags over generic ones
5. Include both topic tags and type tags when appropriate
6. Use the same language as the source text

Output an array of 2-5 tags.`;

export async function POST(req: Request) {
    const { text, kind } = await req.json();

    const prompt = `Content type: ${kind}\n\nText to generate tags for:\n"${text}"`;

    const result = streamObject({
        model: thinkingModel,
        schema: tagsSchema,
        system: SYSTEM_PROMPT,
        prompt,
    });

    return result.toTextStreamResponse();
}
