import { openrouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = streamText({
        model: openrouter('tngtech/deepseek-r1t2-chimera:free'),
        system: 'Ты помощник-литературовед. Пользователь читает книгу. Твоя задача — объяснять контекст, значение слов или обсуждать идеи из присланных фрагментов.',
        messages,
    });

    return result.toUIMessageStreamResponse();
}
