import type { SrsData } from '@/entities/card/model/srs-types';
import type { CardMemory } from '../../model/types';
import type { ParseContext, SerializeResult } from './types';

const CARD_BODY_REGEX = /^#\s*Front\s*\n\n([\s\S]*?)\n\n---\n\n#\s*Back\s*\n\n([\s\S]*)$/;

export function parseCard({ base, body, meta }: ParseContext): CardMemory | null {
    const match = body.match(CARD_BODY_REGEX);

    if (!match) return null;

    const card: CardMemory = {
        ...base,
        kind: 'card',
        frontSide: match[1].trim(),
        backSide: match[2].trim(),
    };

    // Parse SRS data from meta if present
    if (meta && meta.stability != null) {
        card.srs = {
            stability: Number(meta.stability),
            difficulty: Number(meta.difficulty),
            due: String(meta.due),
            interval: Number(meta.interval),
            lapses: Number(meta.lapses),
            reps: Number(meta.reps),
            state: String(meta.state) as SrsData['state'],
            lastReview: String(meta.lastReview),
        };
    }

    return card;
}

export function serializeCard(memory: CardMemory): SerializeResult {
    let meta: Record<string, unknown> | undefined;

    if (memory.srs) {
        meta = {
            stability: memory.srs.stability,
            difficulty: memory.srs.difficulty,
            due: memory.srs.due,
            interval: memory.srs.interval,
            lapses: memory.srs.lapses,
            reps: memory.srs.reps,
            state: memory.srs.state,
            lastReview: memory.srs.lastReview,
        };
    }

    return {
        meta,
        body: `# Front\n\n${memory.frontSide}\n\n---\n\n# Back\n\n${memory.backSide}`,
    };
}
