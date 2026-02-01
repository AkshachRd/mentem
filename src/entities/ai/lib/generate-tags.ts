import { MemoryKind } from '@/entities/memory/model/types';

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
        const response = await fetch('/api/ai/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, kind }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate tags');
        }

        const reader = response.body?.getReader();

        if (!reader) throw new Error('No response body');

        let result = '';
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;
            result += decoder.decode(value, { stream: true });
        }

        // Parse the streamed JSON
        const parsed = JSON.parse(result);

        return parsed.tags || [];
    } catch (err) {
        console.error('[generate-tags] failed', err);

        return [];
    }
}
