import type { Memory, MemoryKind } from '../model/types';
import type { ParseContext } from './kinds';

import { parseNote, parseCard, parseImage, parseQuote, parseArticle, parseProduct } from './kinds';

type KindParser = (ctx: ParseContext) => Memory | null;

const PARSERS: Record<MemoryKind, KindParser> = {
    note: parseNote,
    card: parseCard,
    image: parseImage,
    quote: parseQuote,
    article: parseArticle,
    product: parseProduct,
};

export function parseMemoryMarkdown(content: string): Memory | null {
    const trimmed = content.trimStart();

    if (!trimmed.startsWith('---')) return null;

    const secondIdx = trimmed.indexOf('\n---', 3);

    if (secondIdx === -1) return null;

    const fmBlock = trimmed.slice(3, secondIdx).trim();
    const body = trimmed.slice(secondIdx + 4).trimStart();

    const fm = parseSimpleYaml(fmBlock) as Record<string, unknown>;

    if (!fm || typeof fm !== 'object') return null;

    const kind = String(fm.kind ?? 'note') as MemoryKind;
    const parser = PARSERS[kind];

    if (!parser) return null;

    const now = Date.now();
    const ctx: ParseContext = {
        base: {
            id: String(fm.id),
            kind,
            title: fm.title ? String(fm.title) : undefined,
            tldr: fm.tldr ? String(fm.tldr) : undefined,
            createdAt: fm.createdAt ? Number(fm.createdAt) : now,
            updatedAt: fm.updatedAt ? Number(fm.updatedAt) : now,
            tagIds: Array.isArray(fm.tagIds) ? fm.tagIds.map(String) : [],
        },
        body,
        meta: fm.meta as Record<string, unknown> | undefined,
    };

    return parser(ctx);
}

function parseSimpleYaml(yaml: string): unknown {
    const lines = yaml.split(/\r?\n/);
    const stack: unknown[] = [{}];
    const indents: number[] = [0];

    for (const raw of lines) {
        if (!raw.trim()) continue;
        const indent = raw.match(/^\s*/)?.[0].length ?? 0;
        const line = raw.trim();

        while (indent < indents[indents.length - 1]) {
            indents.pop();
            stack.pop();
        }

        if (line.startsWith('- ')) {
            const current = stack[stack.length - 1];
            const arr = Array.isArray(current) ? current : [];

            if (!Array.isArray(current)) {
                (stack[stack.length - 1] as Record<string, unknown>) = arr as unknown as Record<
                    string,
                    unknown
                >;
            }
            arr.push(parseScalar(line.slice(2)));
            continue;
        }

        const idx = line.indexOf(':');

        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();

        if (!value) {
            const obj: Record<string, unknown> = {};

            (stack[stack.length - 1] as Record<string, unknown>)[key] = obj;
            stack.push(obj);
            indents.push(indent + 2);
        } else {
            (stack[stack.length - 1] as Record<string, unknown>)[key] = parseScalar(value);
        }
    }

    return stack[0];
}

function parseScalar(value: string): unknown {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (/^[-]?\d+(?:\.\d+)?$/.test(value)) return Number(value);
    try {
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            return JSON.parse(value.replace(/'/g, '"'));
        }
    } catch {
        /* ignore */
    }

    return value;
}
