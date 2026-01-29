import type { Memory, MemoryKind } from '../model/types';
import type { SerializeResult } from './kinds';

import {
    serializeNote,
    serializeCard,
    serializeImage,
    serializeQuote,
    serializeArticle,
    serializeProduct,
} from './kinds';

type KindSerializer = (memory: Memory) => SerializeResult;

const SERIALIZERS: Record<MemoryKind, KindSerializer> = {
    note: serializeNote as KindSerializer,
    card: serializeCard as KindSerializer,
    image: serializeImage as KindSerializer,
    quote: serializeQuote as KindSerializer,
    article: serializeArticle as KindSerializer,
    product: serializeProduct as KindSerializer,
};

export function memoryToMarkdown(memory: Memory): string {
    const serializer = SERIALIZERS[memory.kind];
    const { meta, body } = serializer(memory);

    const frontMatter: Record<string, unknown> = {
        id: memory.id,
        kind: memory.kind,
        title: memory.title,
        tldr: memory.tldr,
        createdAt: memory.createdAt,
        updatedAt: memory.updatedAt,
        tagIds: memory.tagIds,
        meta,
    };

    const yaml = toYAML(frontMatter);

    return `---\n${yaml}\n---\n\n${body}`;
}

function toYAML(obj: Record<string, unknown>): string {
    const lines: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
            lines.push(`${key}:`);
            for (const item of value) {
                lines.push(`  - ${formatScalar(item)}`);
            }
        } else if (typeof value === 'object' && value !== null) {
            lines.push(`${key}:`);
            for (const [k, v] of Object.entries(value)) {
                if (v === undefined) continue;
                lines.push(`  ${k}: ${formatScalar(v)}`);
            }
        } else {
            lines.push(`${key}: ${formatScalar(value)}`);
        }
    }

    return lines.join('\n');
}

function formatScalar(value: unknown): string {
    if (typeof value === 'string') {
        if (/[:#\-\n]/.test(value)) {
            return JSON.stringify(value);
        }

        return value;
    }

    return String(value);
}
