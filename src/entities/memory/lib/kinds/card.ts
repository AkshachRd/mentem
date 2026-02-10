import type { CardMemory } from '../../model/types';
import type { ParseContext, SerializeResult } from './types';

const CARD_BODY_REGEX = /^#\s*Front\s*\n\n([\s\S]*?)\n\n---\n\n#\s*Back\s*\n\n([\s\S]*)$/;

export function parseCard({ base, body }: ParseContext): CardMemory | null {
    const match = body.match(CARD_BODY_REGEX);

    if (!match) return null;

    return {
        ...base,
        kind: 'card',
        frontSide: match[1].trim(),
        backSide: match[2].trim(),
    };
}

export function serializeCard(memory: CardMemory): SerializeResult {
    return {
        body: `# Front\n\n${memory.frontSide}\n\n---\n\n# Back\n\n${memory.backSide}`,
    };
}
