import type { NoteMemory } from '../../model/types';
import type { ParseContext, SerializeResult } from './types';

export function parseNote({ base, body }: ParseContext): NoteMemory {
    return {
        ...base,
        kind: 'note',
        content: body ?? '',
    };
}

export function serializeNote(memory: NoteMemory): SerializeResult {
    return {
        body: memory.content,
    };
}
