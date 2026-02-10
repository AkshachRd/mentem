import type { ArticleMemory } from '../../model/types';
import type { ParseContext, SerializeResult } from './types';

export function parseArticle({ base, meta }: ParseContext): ArticleMemory {
    return {
        ...base,
        kind: 'article',
        url: String(meta?.url ?? ''),
        excerpt: meta?.excerpt ? String(meta.excerpt) : undefined,
        source: meta?.source ? String(meta.source) : undefined,
    };
}

export function serializeArticle(memory: ArticleMemory): SerializeResult {
    return {
        meta: { url: memory.url, excerpt: memory.excerpt, source: memory.source },
        body: '',
    };
}
