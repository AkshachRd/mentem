'use client';

import { create } from 'zustand';

type SessionCard = {
    id: string;
    frontSide: string;
    backSide: string;
    createdAt: number;
};

type SessionCardsState = {
    cards: SessionCard[];
    addCard: (card: SessionCard) => void;
    clearSession: () => void;
};

export const useSessionCardsStore = create<SessionCardsState>()((set) => ({
    cards: [],
    addCard: (card) =>
        set((state) => ({
            cards: [...state.cards, card],
        })),
    clearSession: () => set(() => ({ cards: [] })),
}));

export function useSessionCards() {
    const cards = useSessionCardsStore((s) => s.cards);
    const addCard = useSessionCardsStore((s) => s.addCard);
    const clearSession = useSessionCardsStore((s) => s.clearSession);

    return {
        cards,
        count: cards.length,
        addCard,
        clearSession,
    };
}
