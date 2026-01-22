export { useQuoteStore } from './model/store';
export type { Quote, QuoteSource, TextPosition, NavigationTarget } from './model/types';
export { QuoteBlock } from './ui/quote-block';
export { QuoteBadge } from './ui/quote-badge';
export {
    formatQuoteForChat,
    extractQuoteId,
    hasQuoteMarker,
    QUOTE_MARKER_PATTERN,
} from './lib/format';
