import type { ImageMemory } from '../../model/types';
import type { ParseContext, SerializeResult } from './types';

export function parseImage({ base, meta }: ParseContext): ImageMemory {
    return {
        ...base,
        kind: 'image',
        url: String(meta?.url ?? ''),
        alt: meta?.alt ? String(meta.alt) : undefined,
    };
}

export function serializeImage(memory: ImageMemory): SerializeResult {
    return {
        meta: { url: memory.url, alt: memory.alt },
        body: '',
    };
}
