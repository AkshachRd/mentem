'use client';

import { useState, useCallback, useEffect, useRef, type RefObject } from 'react';

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;

export function usePdfZoom(containerRef: RefObject<HTMLElement | null>, panelState: string) {
    const [scale, setScale] = useState(1.0);
    const [pageFit, setPageFit] = useState(false);
    const [pageWidth, setPageWidth] = useState<number | null>(null);

    const calculatePageFit = useCallback(() => {
        if (!containerRef.current || !pageWidth) return;

        const padding = 32;
        const width = containerRef.current.getBoundingClientRect().width;
        const availableWidth = width - padding;
        const calculatedScale = availableWidth / pageWidth;
        const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, calculatedScale));

        setScale((prev) => {
            const diff = Math.abs(prev - newScale);

            return diff > 0.01 ? newScale : prev;
        });
    }, [pageWidth, containerRef]);

    const onPageLoadSuccess = useCallback((page: { width: number; height: number }) => {
        setPageWidth(page.width);
    }, []);

    // Recalculate fit only when panel layout changes (collapse/expand)
    const prevPanelStateRef = useRef(panelState);

    useEffect(() => {
        if (prevPanelStateRef.current === panelState) {
            prevPanelStateRef.current = panelState;

            return;
        }
        prevPanelStateRef.current = panelState;

        if (!pageFit || !pageWidth) return;

        // Wait for CSS transition (300ms) to finish before measuring
        const timeoutId = setTimeout(calculatePageFit, 350);

        return () => clearTimeout(timeoutId);
    }, [pageFit, pageWidth, panelState, calculatePageFit]);

    const handleZoomIn = useCallback(() => {
        setPageFit(false);
        setScale((prev) => {
            const nextRound = Math.ceil(prev / ZOOM_STEP) * ZOOM_STEP;
            const diff = Math.abs(prev - nextRound);

            if (diff < 0.001) {
                return Math.min(MAX_ZOOM, nextRound + ZOOM_STEP);
            }

            return Math.min(MAX_ZOOM, nextRound);
        });
    }, []);

    const handleZoomOut = useCallback(() => {
        setPageFit(false);
        setScale((prev) => {
            const prevRound = Math.floor(prev / ZOOM_STEP) * ZOOM_STEP;
            const diff = Math.abs(prev - prevRound);

            if (diff < 0.001) {
                return Math.max(MIN_ZOOM, prevRound - ZOOM_STEP);
            }

            return Math.max(MIN_ZOOM, prevRound);
        });
    }, []);

    const handleResetZoom = useCallback(() => {
        setPageFit(false);
        setScale(1.0);
    }, []);

    const handlePageFit = useCallback(() => {
        const newPageFit = !pageFit;

        setPageFit(newPageFit);

        if (newPageFit) {
            calculatePageFit();
        }
    }, [pageFit, calculatePageFit]);

    const resetZoom = useCallback(() => {
        setScale(1.0);
        setPageFit(false);
        setPageWidth(null);
    }, []);

    return {
        scale,
        pageFit,
        MIN_ZOOM,
        MAX_ZOOM,
        handleZoomIn,
        handleZoomOut,
        handleResetZoom,
        handlePageFit,
        onPageLoadSuccess,
        resetZoom,
    };
}
