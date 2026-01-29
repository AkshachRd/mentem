import type { Memory } from '../../model/types';

export type BaseFields = {
    id: string;
    kind: Memory['kind'];
    title?: string;
    tldr?: string;
    createdAt: number;
    updatedAt: number;
    tagIds: string[];
};

export type ParseContext = {
    base: BaseFields;
    body: string;
    meta?: Record<string, unknown>;
};

export type SerializeResult = {
    meta?: Record<string, unknown>;
    body: string;
};
