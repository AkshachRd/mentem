import type { QuoteMemory } from '../../model/types';
import type { ParseContext, SerializeResult } from './types';

export function parseQuote({ base, body, meta }: ParseContext): QuoteMemory {
    let sourcePosition: QuoteMemory['sourcePosition'];

    if (meta?.sourcePosition) {
        try {
            sourcePosition = JSON.parse(String(meta.sourcePosition));
        } catch {
            // ignore malformed position data
        }
    }

    return {
        ...base,
        kind: 'quote',
        text: body ?? '',
        author: meta?.author ? String(meta.author) : undefined,
        sourceUrl: meta?.sourceUrl ? String(meta.sourceUrl) : undefined,
        sourcePosition,
    };
}

export function serializeQuote(memory: QuoteMemory): SerializeResult {
    return {
        meta: {
            author: memory.author,
            sourceUrl: memory.sourceUrl,
            sourcePosition: memory.sourcePosition
                ? JSON.stringify(memory.sourcePosition)
                : undefined,
        },
        body: memory.text,
    };
}
