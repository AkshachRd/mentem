import type { ProductMemory } from '../../model/types';
import type { ParseContext, SerializeResult } from './types';

export function parseProduct({ base, meta }: ParseContext): ProductMemory {
    return {
        ...base,
        kind: 'product',
        url: meta?.url ? String(meta.url) : undefined,
        price: meta?.price ? String(meta.price) : undefined,
        currency: meta?.currency ? String(meta.currency) : undefined,
    };
}

export function serializeProduct(memory: ProductMemory): SerializeResult {
    return {
        meta: { url: memory.url, price: memory.price, currency: memory.currency },
        body: '',
    };
}
