/**
 * Position data for text selection in PDF
 */
export interface TextPosition {
    /** Page number (1-indexed) */
    pageNumber: number;

    /** Character offset from start of page text content */
    startOffset: number;

    /** Character offset for end of selection */
    endOffset: number;

    /**
     * DOM-based position data for scrolling/highlighting
     * Coordinates are relative to the page container
     */
    rect: {
        top: number;
        left: number;
        width: number;
        height: number;
    };
}

/**
 * Source reference for a quote
 */
export interface QuoteSource {
    /** Full PDF file path */
    filePath: string;

    /** Extracted filename for display */
    fileName: string;

    /** Position data for navigation */
    position: TextPosition;
}

/**
 * Quote entity - represents a text selection from PDF sent to chat
 */
export interface Quote {
    /** Unique identifier */
    id: string;

    /** The quoted text content */
    text: string;

    /** Source information with position data */
    source: QuoteSource;

    /** Timestamp when quote was created */
    createdAt: number;
}

/**
 * Navigation target for PDF viewer
 */
export interface NavigationTarget {
    filePath: string;
    position: TextPosition;
}

/**
 * Quote store state
 */
export interface QuoteState {
    /** Quote storage keyed by ID */
    quotes: Map<string, Quote>;

    /** Currently highlighted quote ID (for visual feedback) */
    activeQuoteId: string | null;

    /** Navigation target (set when quote clicked in chat) */
    navigationTarget: NavigationTarget | null;

    /** Pending quotes ready to be sent in chat */
    pendingQuotes: Quote[];

    /** Add a new quote */
    addQuote: (quote: Quote) => void;

    /** Get quote by ID */
    getQuote: (id: string) => Quote | undefined;

    /** Set active quote for highlighting */
    setActiveQuote: (id: string | null) => void;

    /** Navigate to a quote in PDF */
    navigateToQuote: (quoteId: string) => void;

    /** Clear navigation target after handling */
    clearNavigationTarget: () => void;

    /** Add quote to pending list (for chat input) */
    addPendingQuote: (quote: Quote) => void;

    /** Remove quote from pending list */
    removePendingQuote: (quoteId: string) => void;

    /** Clear all pending quotes (after sending) */
    clearPendingQuotes: () => void;
}
