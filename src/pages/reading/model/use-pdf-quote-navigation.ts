'use client';

import type { ViewMode } from './use-pdf-navigation';

import { useEffect, useRef, type RefObject } from 'react';

import { useQuoteStore } from '@/entities/quote';

export function usePdfQuoteNavigation(
    filePath: string | null,
    containerRef: RefObject<HTMLElement | null>,
    viewMode: ViewMode,
    scrollToPage: (page: number) => void,
    setPageNumber: (page: number) => void,
) {
    const navigationTarget = useQuoteStore((state) => state.navigationTarget);
    const clearNavigationTarget = useQuoteStore((state) => state.clearNavigationTarget);
    const highlightCleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!navigationTarget || !containerRef.current) return;

        if (navigationTarget.filePath !== filePath) {
            return;
        }

        const { position } = navigationTarget;

        if (highlightCleanupRef.current) {
            highlightCleanupRef.current();
            highlightCleanupRef.current = null;
        }

        if (viewMode === 'all') {
            scrollToPage(position.pageNumber);
        } else {
            setPageNumber(position.pageNumber);
        }

        const timeoutId = setTimeout(() => {
            if (!containerRef.current) return;

            const pageElement = containerRef.current.querySelector(
                `[data-page-number="${position.pageNumber}"]`,
            ) as HTMLElement;

            if (pageElement && position.rect) {
                const highlight = document.createElement('div');

                highlight.className = 'quote-highlight-overlay';
                highlight.style.cssText = `
                    position: absolute;
                    top: ${position.rect.top}px;
                    left: ${position.rect.left}px;
                    width: ${position.rect.width}px;
                    height: ${position.rect.height}px;
                    background-color: rgba(255, 213, 0, 0.4);
                    pointer-events: none;
                    border-radius: 2px;
                    animation: quote-highlight-fade 2s ease-out forwards;
                `;

                const pageContent = pageElement.querySelector('.react-pdf__Page') as HTMLElement;

                if (pageContent) {
                    pageContent.style.position = 'relative';
                    pageContent.appendChild(highlight);

                    highlightCleanupRef.current = () => {
                        highlight.remove();
                    };

                    setTimeout(() => {
                        highlight.remove();
                        highlightCleanupRef.current = null;
                    }, 2000);
                }
            }

            clearNavigationTarget();
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [navigationTarget, filePath, viewMode, clearNavigationTarget]);
}
