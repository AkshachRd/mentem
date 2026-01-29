import type { QuoteMemory } from '../../model/types';
import type { ParseContext, SerializeResult } from './types';

export function parseQuote({ base, body, meta }: ParseContext): QuoteMemory {
    return {
        ...base,
        kind: 'quote',
        text: body ?? '',
        author: meta?.author ? String(meta.author) : undefined,
        sourceUrl: meta?.sourceUrl ? String(meta.sourceUrl) : undefined,
    };
}

export function serializeQuote(memory: QuoteMemory): SerializeResult {
    return {
        meta: { author: memory.author, sourceUrl: memory.sourceUrl },
        body: memory.text,
    };
}
