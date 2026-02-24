'use client';

import { useState, useEffect, useCallback, type RefObject } from 'react';

export type ViewMode = 'single' | 'all';

export function usePdfNavigation(
    containerRef: RefObject<HTMLElement | null>,
    numPages: number | null,
    scale: number,
    viewMode: ViewMode,
) {
    const [pageNumber, setPageNumber] = useState(1);

    const scrollToPage = useCallback(
        (targetPage: number) => {
            if (!containerRef.current || !numPages) return;

            const pageElement = containerRef.current.querySelector(
                `[data-page-number="${targetPage}"]`,
            ) as HTMLElement;

            if (pageElement && containerRef.current) {
                const container = containerRef.current;
                const containerRect = container.getBoundingClientRect();
                const pageRect = pageElement.getBoundingClientRect();

                const scrollTop =
                    container.scrollTop +
                    pageRect.top -
                    containerRect.top -
                    containerRect.height / 2 +
                    pageRect.height / 2;

                container.scrollTo({
                    top: scrollTop,
                    behavior: 'smooth',
                });
            }
        },
        [containerRef, numPages],
    );

    const goToPrevPage = useCallback(() => {
        const newPage = Math.max(1, pageNumber - 1);

        setPageNumber(newPage);

        if (viewMode === 'all') {
            scrollToPage(newPage);
        }
    }, [pageNumber, viewMode, scrollToPage]);

    const goToNextPage = useCallback(() => {
        const newPage = Math.min(numPages || 1, pageNumber + 1);

        setPageNumber(newPage);

        if (viewMode === 'all') {
            scrollToPage(newPage);
        }
    }, [numPages, pageNumber, viewMode, scrollToPage]);

    // Track visible page during scroll in "all pages" mode
    useEffect(() => {
        if (viewMode !== 'all' || !numPages || !containerRef.current) return;

        const container = containerRef.current;
        let rafId: number | null = null;
        const lastPageRef = { current: pageNumber };

        container.scrollTo({ top: 0, behavior: 'instant' });
        setPageNumber(1);
        lastPageRef.current = 1;

        const updateVisiblePage = () => {
            const pageElements = Array.from(
                container.querySelectorAll('[data-page-number]'),
            ) as HTMLElement[];

            if (pageElements.length === 0) return;

            const containerRect = container.getBoundingClientRect();
            const containerCenter = containerRect.top + containerRect.height / 2;

            let closestPage = 1;
            let minDistance = Infinity;

            pageElements.forEach((pageEl) => {
                const pageRect = pageEl.getBoundingClientRect();
                const pageCenter = pageRect.top + pageRect.height / 2;
                const distance = Math.abs(containerCenter - pageCenter);

                const isVisible =
                    pageRect.bottom >= containerRect.top && pageRect.top <= containerRect.bottom;

                if (isVisible && distance < minDistance) {
                    minDistance = distance;
                    const pageNum = parseInt(pageEl.dataset.pageNumber || '1', 10);

                    closestPage = pageNum;
                }
            });

            if (
                closestPage !== lastPageRef.current &&
                closestPage >= 1 &&
                closestPage <= numPages
            ) {
                lastPageRef.current = closestPage;
                setPageNumber(closestPage);
            }
        };

        const handleScroll = () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }

            rafId = requestAnimationFrame(updateVisiblePage);
        };

        const timeoutId = setTimeout(() => {
            updateVisiblePage();
        }, 100);

        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScroll);
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            clearTimeout(timeoutId);
        };
    }, [viewMode, numPages, scale]);

    return {
        pageNumber,
        setPageNumber,
        goToPrevPage,
        goToNextPage,
        scrollToPage,
    };
}
