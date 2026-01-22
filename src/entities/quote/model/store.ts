import type { Quote, QuoteState } from './types';

import { create } from 'zustand';

export const useQuoteStore = create<QuoteState>()((set, get) => ({
    quotes: new Map(),
    activeQuoteId: null,
    navigationTarget: null,
    pendingQuotes: [],

    addQuote: (quote: Quote) => {
        set((state) => {
            const newQuotes = new Map(state.quotes);

            newQuotes.set(quote.id, quote);

            return { quotes: newQuotes };
        });
    },

    getQuote: (id: string) => get().quotes.get(id),

    setActiveQuote: (id: string | null) => set({ activeQuoteId: id }),

    navigateToQuote: (quoteId: string) => {
        const quote = get().quotes.get(quoteId);

        if (quote) {
            set({
                activeQuoteId: quoteId,
                navigationTarget: {
                    filePath: quote.source.filePath,
                    position: quote.source.position,
                },
            });
        }
    },

    clearNavigationTarget: () => set({ navigationTarget: null, activeQuoteId: null }),

    addPendingQuote: (quote: Quote) => {
        // Also add to main quotes storage for later reference
        get().addQuote(quote);
        set((state) => ({
            pendingQuotes: [...state.pendingQuotes, quote],
        }));
    },

    removePendingQuote: (quoteId: string) => {
        set((state) => ({
            pendingQuotes: state.pendingQuotes.filter((q) => q.id !== quoteId),
        }));
    },

    clearPendingQuotes: () => set({ pendingQuotes: [] }),
}));
