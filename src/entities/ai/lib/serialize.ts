import type { Chat, ChatMessage, ChatMessagePart } from '@/shared/ai/types';

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
            const segments = m.parts.map((p) => {
                if (p.type === 'image') return `[IMAGE:${p.path}|${p.name}]`;

                return p.text;
            });

            return `[${m.role}]: ${segments.join('\n')}`;
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

        const imageMarkerRegex = /\[IMAGE:(.+?)\|(.+?)\]/g;

        for (let i = 0; i < parts.length; i++) {
            const end =
                i + 1 < parts.length ? body.lastIndexOf('\n', parts[i + 1].start) : body.length;
            const rawText = body.slice(parts[i].start, end).trim();

            const msgParts: ChatMessagePart[] = [];
            let lastIndex = 0;
            let imgMatch;

            imageMarkerRegex.lastIndex = 0;
            while ((imgMatch = imageMarkerRegex.exec(rawText)) !== null) {
                const before = rawText.slice(lastIndex, imgMatch.index).trim();

                if (before) msgParts.push({ type: 'text', text: before });
                msgParts.push({ type: 'image', path: imgMatch[1], name: imgMatch[2] });
                lastIndex = imgMatch.index + imgMatch[0].length;
            }

            const remaining = rawText.slice(lastIndex).trim();

            if (remaining) msgParts.push({ type: 'text', text: remaining });
            if (msgParts.length === 0) msgParts.push({ type: 'text', text: '' });

            messages.push({
                id: `msg-${meta.id}-${i}`,
                role: parts[i].role,
                parts: msgParts,
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
