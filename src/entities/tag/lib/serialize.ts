import { Tag } from '../model/types';

export function tagToMarkdown(tag: Tag): string {
    const yaml = `id: ${tag.id}\nname: ${quoteIfNeeded(tag.name)}\ncolor: ${tag.color}`;

    return `---\n${yaml}\n---\n`;
}

function quoteIfNeeded(value: string): string {
    return /[:#\-\n]/.test(value) ? JSON.stringify(value) : value;
}
