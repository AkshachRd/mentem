export type { CardMemory as Card } from '@/entities/memory/model/types';

export type CardInput = {
    id?: string;
    frontSide: string;
    backSide: string;
    tagIds?: string[];
    title?: string;
    tldr?: string;
    createdAt?: number;
    updatedAt?: number;
};
