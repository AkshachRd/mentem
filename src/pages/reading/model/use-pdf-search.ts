'use client';

import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

import { useState, useEffect, useCallback, useRef, type RefObject } from 'react';

export interface SearchMatch {
    pageNumber: number;
    index: number;
}

interface UsePdfSearchReturn {
    isSearchOpen: boolean;
    searchTerm: string;
    matchCase: boolean;
    matchWholeWord: boolean;
    matches: SearchMatch[];
    currentMatchIndex: number;
    openSearch: (initialTerm?: string) => void;
    closeSearch: () => void;
    setSearchTerm: (term: string) => void;
    setMatchCase: (value: boolean) => void;
    setMatchWholeWord: (value: boolean) => void;
    goToNextMatch: () => void;
    goToPrevMatch: () => void;
    rehighlight: () => void;
}

export function usePdfSearch(
    pdfDocument: PDFDocumentProxy | null,
    scrollToPage: (page: number) => void,
    setPageNumber: (page: number) => void,
    containerRef: RefObject<HTMLElement | null>,
): UsePdfSearchReturn {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [matchCase, setMatchCase] = useState(false);
    const [matchWholeWord, setMatchWholeWord] = useState(false);
    const [matches, setMatches] = useState<SearchMatch[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [highlightVersion, setHighlightVersion] = useState(0);

    const pageTextsRef = useRef<string[][]>([]);
    const highlightedSpansRef = useRef<{ span: HTMLSpanElement; originalBg: string }[]>([]);

    // Extract text from all pages when document changes
    useEffect(() => {
        if (!pdfDocument) {
            pageTextsRef.current = [];

            return;
        }

        let cancelled = false;

        const extractText = async () => {
            const pages: string[][] = [];

            for (let i = 1; i <= pdfDocument.numPages; i++) {
                if (cancelled) return;

                const page = await pdfDocument.getPage(i);
                const textContent = await page.getTextContent();
                const items = textContent.items
                    .filter((item): item is TextItem => 'str' in item)
                    .map((item) => item.str);

                pages.push(items);
            }

            if (!cancelled) {
                pageTextsRef.current = pages;
            }
        };

        extractText();

        return () => {
            cancelled = true;
        };
    }, [pdfDocument]);

    // Debounced search when searchTerm or options change
    useEffect(() => {
        if (!searchTerm.trim()) {
            setMatches([]);
            setCurrentMatchIndex(0);

            return;
        }

        const timeoutId = setTimeout(() => {
            const newMatches: SearchMatch[] = [];
            const needleFn = matchCase ? (s: string) => s : (s: string) => s.toLowerCase();
            const needle = needleFn(searchTerm);

            pageTextsRef.current.forEach((pageItems, pageIndex) => {
                for (const itemText of pageItems) {
                    const haystack = needleFn(itemText);
                    let pos = 0;

                    while (pos < haystack.length) {
                        const foundIndex = haystack.indexOf(needle, pos);

                        if (foundIndex === -1) break;

                        // Check whole word boundary if enabled
                        if (matchWholeWord) {
                            const before = foundIndex > 0 ? haystack[foundIndex - 1] : ' ';
                            const after =
                                foundIndex + needle.length < haystack.length
                                    ? haystack[foundIndex + needle.length]
                                    : ' ';

                            if (/\w/.test(before) || /\w/.test(after)) {
                                pos = foundIndex + 1;
                                continue;
                            }
                        }

                        newMatches.push({
                            pageNumber: pageIndex + 1,
                            index: foundIndex,
                        });

                        pos = foundIndex + 1;
                    }
                }
            });

            setMatches(newMatches);
            setCurrentMatchIndex(0);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, matchCase, matchWholeWord]);

    // Remove all highlights
    const clearHighlights = useCallback(() => {
        highlightedSpansRef.current.forEach(({ span, originalBg }) => {
            span.style.backgroundColor = originalBg;
        });
        highlightedSpansRef.current = [];
    }, []);

    // Highlight matches in the DOM by coloring text layer spans directly
    useEffect(() => {
        clearHighlights();

        if (matches.length === 0 || !searchTerm.trim() || !containerRef.current) return;

        const needleFn = matchCase ? (s: string) => s : (s: string) => s.toLowerCase();
        const needle = needleFn(searchTerm);
        const highlighted: { span: HTMLSpanElement; originalBg: string }[] = [];
        const pageNumbers = Array.from(new Set(matches.map((m) => m.pageNumber))).sort(
            (a, b) => a - b,
        );

        let globalMatchCount = 0;

        for (const pageNum of pageNumbers) {
            const pageEl = containerRef.current.querySelector(`[data-page-number="${pageNum}"]`);

            if (!pageEl) {
                globalMatchCount += matches.filter((m) => m.pageNumber === pageNum).length;
                continue;
            }

            const textLayer = pageEl.querySelector('.react-pdf__Page__textContent');

            if (!textLayer) {
                globalMatchCount += matches.filter((m) => m.pageNumber === pageNum).length;
                continue;
            }

            // Select only leaf spans (text item spans, not markedContent wrappers)
            const spans = Array.from(textLayer.querySelectorAll('span')).filter(
                (span) => !span.querySelector('span'),
            ) as HTMLSpanElement[];

            for (const span of spans) {
                const spanText = span.textContent || '';
                const haystack = needleFn(spanText);
                let searchPos = 0;
                let spanHasMatch = false;
                let isCurrentInSpan = false;

                while (searchPos < haystack.length) {
                    const idx = haystack.indexOf(needle, searchPos);

                    if (idx === -1) break;

                    if (matchWholeWord) {
                        const before = idx > 0 ? haystack[idx - 1] : ' ';
                        const after =
                            idx + needle.length < haystack.length
                                ? haystack[idx + needle.length]
                                : ' ';

                        if (/\w/.test(before) || /\w/.test(after)) {
                            searchPos = idx + 1;
                            continue;
                        }
                    }

                    spanHasMatch = true;

                    if (globalMatchCount === currentMatchIndex) {
                        isCurrentInSpan = true;
                    }

                    globalMatchCount++;
                    searchPos = idx + 1;
                }

                if (spanHasMatch) {
                    const originalBg = span.style.backgroundColor;

                    span.style.backgroundColor = isCurrentInSpan
                        ? 'rgba(255, 165, 0, 0.5)'
                        : 'rgba(255, 255, 0, 0.35)';
                    highlighted.push({ span, originalBg });
                }
            }
        }

        highlightedSpansRef.current = highlighted;
    }, [
        matches,
        currentMatchIndex,
        searchTerm,
        matchCase,
        matchWholeWord,
        highlightVersion,
        containerRef,
        clearHighlights,
    ]);

    const rehighlight = useCallback(() => {
        setHighlightVersion((v) => v + 1);
    }, []);

    const goToNextMatch = useCallback(() => {
        if (matches.length === 0) return;

        const nextIndex = (currentMatchIndex + 1) % matches.length;
        const targetPage = matches[nextIndex].pageNumber;

        setCurrentMatchIndex(nextIndex);
        setPageNumber(targetPage);
        scrollToPage(targetPage);
    }, [matches, currentMatchIndex, scrollToPage, setPageNumber]);

    const goToPrevMatch = useCallback(() => {
        if (matches.length === 0) return;

        const prevIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
        const targetPage = matches[prevIndex].pageNumber;

        setCurrentMatchIndex(prevIndex);
        setPageNumber(targetPage);
        scrollToPage(targetPage);
    }, [matches, currentMatchIndex, scrollToPage, setPageNumber]);

    const openSearch = useCallback((initialTerm?: string) => {
        setIsSearchOpen(true);

        if (initialTerm !== undefined) {
            setSearchTerm(initialTerm);
        }
    }, []);

    const closeSearch = useCallback(() => {
        setIsSearchOpen(false);
        setSearchTerm('');
        setMatches([]);
        setCurrentMatchIndex(0);
        clearHighlights();
    }, [clearHighlights]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            highlightedSpansRef.current.forEach(({ span, originalBg }) => {
                span.style.backgroundColor = originalBg;
            });
            highlightedSpansRef.current = [];
        };
    }, []);

    return {
        isSearchOpen,
        searchTerm,
        matchCase,
        matchWholeWord,
        matches,
        currentMatchIndex,
        openSearch,
        closeSearch,
        setSearchTerm,
        setMatchCase,
        setMatchWholeWord,
        goToNextMatch,
        goToPrevMatch,
        rehighlight,
    };
}
