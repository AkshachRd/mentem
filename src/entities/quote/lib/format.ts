import type { Quote } from '../model/types';

/**
 * Quote marker pattern for parsing messages
 */
export const QUOTE_MARKER_PATTERN = /\[QUOTE:([a-zA-Z0-9_-]+)\]/;

/**
 * Format a quote for sending to chat
 * The marker [QUOTE:id] is used to identify and render the quote block
 */
export function formatQuoteForChat(quote: Quote): string {
    return `[QUOTE:${quote.id}]\n> ${quote.text}`;
}

/**
 * Extract quote ID from a message text
 */
export function extractQuoteId(text: string): string | null {
    const match = text.match(QUOTE_MARKER_PATTERN);

    return match ? match[1] : null;
}

/**
 * Check if text contains a quote marker
 */
export function hasQuoteMarker(text: string): boolean {
    return QUOTE_MARKER_PATTERN.test(text);
}
