import type { Chat, ChatMessage } from '@/shared/ai/types';

export function chatToMarkdown(chat: Chat): string {
    const frontmatter = [
        '---',
        `id: ${chat.id}`,
        `title: ${JSON.stringify(chat.title)}`,
        `createdAt: ${chat.createdAt}`,
        `updatedAt: ${chat.updatedAt}`,
        '---',
    ].join('\n');

    const body = chat.messages
        .map((m) => {
            const text = m.parts
                .filter((p) => p.type === 'text')
                .map((p) => p.text)
                .join('');

            return `[${m.role}]: ${text}`;
        })
        .join('\n\n');

    return body ? `${frontmatter}\n\n${body}` : frontmatter;
}

export function parseChat(content: string): Chat {
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (!fmMatch) {
        throw new Error('Invalid chat file: no frontmatter');
    }

    const meta: Record<string, string> = {};

    for (const line of fmMatch[1].split('\n')) {
        const idx = line.indexOf(':');

        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        let value = line.slice(idx + 1).trim();

        // Remove surrounding quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
            value = JSON.parse(value);
        }
        meta[key] = value;
    }

    const body = content.slice(fmMatch[0].length).trim();

    const messages: ChatMessage[] = [];

    if (body) {
        const msgRegex = /\[(user|assistant)\]:\s*/g;
        const parts: { role: 'user' | 'assistant'; start: number }[] = [];
        let match;

        while ((match = msgRegex.exec(body)) !== null) {
            parts.push({
                role: match[1] as 'user' | 'assistant',
                start: match.index + match[0].length,
            });
        }

        for (let i = 0; i < parts.length; i++) {
            const end =
                i + 1 < parts.length ? body.lastIndexOf('\n', parts[i + 1].start) : body.length;
            const text = body.slice(parts[i].start, end).trim();

            messages.push({
                id: `msg-${meta.id}-${i}`,
                role: parts[i].role,
                parts: [{ type: 'text', text }],
            });
        }
    }

    return {
        id: meta.id,
        title: meta.title || '',
        createdAt: Number(meta.createdAt),
        updatedAt: Number(meta.updatedAt),
        messages,
    };
}
