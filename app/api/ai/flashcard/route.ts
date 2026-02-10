import { openrouter } from '@openrouter/ai-sdk-provider';
import { streamObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

const flashcardSchema = z.object({
    frontSide: z.string().describe('Question or prompt for the flashcard front side'),
    backSide: z.string().describe('Answer or explanation for the flashcard back side'),
});

const SYSTEM_PROMPT = `You are an expert educator specialized in creating effective flashcards for learning.

Your task is to analyze the provided text and create a flashcard that helps memorize key information.

Guidelines:
1. Front side should contain a clear, specific question or prompt
2. Back side should contain a concise but complete answer
3. Focus on the most important concept, fact, or idea from the text
4. Questions should test understanding, not just recall
5. Keep answers concise but informative
6. Use the same language as the source text

Output a single flashcard with frontSide and backSide.`;

export async function POST(req: Request) {
    const { text, context } = await req.json();

    const prompt = context
        ? `Source: ${context}\n\nText to create flashcard from:\n"${text}"`
        : `Text to create flashcard from:\n"${text}"`;

    const result = streamObject({
        model: openrouter('tngtech/deepseek-r1t2-chimera:free'),
        schema: flashcardSchema,
        system: SYSTEM_PROMPT,
        prompt,
    });

    return result.toTextStreamResponse();
}
