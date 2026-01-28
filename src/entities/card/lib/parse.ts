import type { Card } from '../model/types';

export function parseCardMarkdown(content: string): Card | null {
    const trimmed = content.trimStart();

    if (!trimmed.startsWith('---')) return null;

    const secondIdx = trimmed.indexOf('\n---', 3);

    if (secondIdx === -1) return null;

    const fmBlock = trimmed.slice(3, secondIdx).trim();
    const body = trimmed.slice(secondIdx + 4).trimStart();

    const fm = parseSimpleYaml(fmBlock) as Record<string, unknown>;

    if (!fm || typeof fm !== 'object') return null;

    // Parse front and back from body
    // Format: # Front\n\n<content>\n\n---\n\n# Back\n\n<content>
    const frontMatch = body.match(
        /^#\s*Front\s*\n\n([\s\S]*?)\n\n---\n\n#\s*Back\s*\n\n([\s\S]*)$/,
    );

    if (!frontMatch) return null;

    const frontSide = frontMatch[1].trim();
    const backSide = frontMatch[2].trim();

    // MIGRATION: Handle old cards without timestamps
    const now = Date.now();
    const createdAt = fm.createdAt ? Number(fm.createdAt) : now;
    const updatedAt = fm.updatedAt ? Number(fm.updatedAt) : now;

    return {
        id: String(fm.id),
        kind: 'card' as const,
        frontSide,
        backSide,
        tagIds: Array.isArray(fm.tagIds) ? fm.tagIds.map(String) : [],
        createdAt,
        updatedAt,
        title: fm.title ? String(fm.title) : undefined,
        tldr: fm.tldr ? String(fm.tldr) : undefined,
    };
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
