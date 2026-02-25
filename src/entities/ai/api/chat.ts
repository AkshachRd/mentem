import { streamText } from 'ai';

import { thinkingModel } from '@/shared/ai/llm-models';

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = streamText({
        model: thinkingModel,
        system: 'Ты помощник-литературовед. Пользователь читает книгу. Твоя задача — объяснять контекст, значение слов или обсуждать идеи из присланных фрагментов.',
        messages,
    });

    return result.toUIMessageStreamResponse();
}
