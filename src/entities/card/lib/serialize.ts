import { Card } from '../model/types';

export function cardToMarkdown(card: Card): string {
    const fm = {
        id: card.id,
        kind: card.kind,
        title: card.title,
        tldr: card.tldr,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        tagIds: card.tagIds,
    };
    const yaml = toYAML(fm);

    return `---\n${yaml}\n---\n\n# Front\n\n${card.frontSide}\n\n---\n\n# Back\n\n${card.backSide}\n`;
}

function toYAML(obj: Record<string, unknown>): string {
    const lines: string[] = [];

    for (const [k, v] of Object.entries(obj)) {
        if (v === undefined) continue;
        if (Array.isArray(v)) {
            lines.push(`${k}:`);
            for (const item of v)
                lines.push(`  - ${typeof item === 'string' ? item : String(item)}`);
        } else {
            lines.push(`${k}: ${typeof v === 'string' ? v : String(v)}`);
        }
    }

    return lines.join('\n');
}
