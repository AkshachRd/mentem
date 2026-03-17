import { MemoryKind } from '@/entities/memory/model/types';
import { claudePrompt } from '@/shared/ai/claude-cli';

const SYSTEM_PROMPT = `You are an expert at categorizing and tagging content.

Your task is to analyze the provided text and generate 2-5 relevant tags.

Guidelines:
1. Tags should be concise (1-3 words each)
2. Tags should capture the main topics, concepts, or themes
3. Use lowercase for consistency
4. Prefer specific tags over generic ones
5. Include both topic tags and type tags when appropriate
6. Use the same language as the source text

Output ONLY a JSON object in this exact format: {"tags": ["tag1", "tag2", "tag3"]}`;

function getTextFromMemory(kind: MemoryKind, data: Record<string, unknown>): string {
    switch (kind) {
        case 'note':
            return [data.title, data.tldr, data.content].filter(Boolean).join('\n');
        case 'card':
            return [data.title, data.frontSide, data.backSide].filter(Boolean).join('\n');
        case 'quote':
            return [data.text, data.author].filter(Boolean).join(' - ');
        case 'article':
            return [data.title, data.excerpt, data.source].filter(Boolean).join('\n');
        case 'image':
            return [data.title, data.alt].filter(Boolean).join('\n');
        case 'product':
            return [data.title, data.price, data.currency].filter(Boolean).join(' ');
        default:
            return (data.title as string) || '';
    }
}

export async function generateTagsForMemory(
    kind: MemoryKind,
    data: Record<string, unknown>,
): Promise<string[]> {
    const text = getTextFromMemory(kind, data);

    if (!text.trim()) return [];

    try {
        const prompt = `Content type: ${kind}\n\nText to generate tags for:\n"${text}"`;
        const result = await claudePrompt(SYSTEM_PROMPT, prompt);

        // Extract JSON from the response (handle possible markdown wrapping)
        const jsonMatch = result.match(/\{[\s\S]*"tags"[\s\S]*\}/);

        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);

            return parsed.tags || [];
        }

        return [];
    } catch (err) {
        console.error('[generate-tags] failed', err);

        return [];
    }
}
