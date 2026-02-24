'use client';

import { useState, useCallback, useEffect, type RefObject } from 'react';

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;

export function usePdfZoom(containerRef: RefObject<HTMLElement | null>, containerWidth: number) {
    const [scale, setScale] = useState(1.0);
    const [pageFit, setPageFit] = useState(false);
    const [pageWidth, setPageWidth] = useState<number | null>(null);
    const [savedFitScale, setSavedFitScale] = useState<number | null>(null);

    const calculatePageFit = useCallback(() => {
        if (!containerRef.current || !pageWidth) return;

        const padding = 32;
        const width = containerRef.current.getBoundingClientRect().width;
        const availableWidth = width - padding;
        const calculatedScale = availableWidth / pageWidth;
        const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, calculatedScale));

        setSavedFitScale((prev) => prev ?? newScale);

        setScale((prev) => {
            const diff = Math.abs(prev - newScale);

            return diff > 0.01 ? newScale : prev;
        });
    }, [pageWidth, containerRef]);

    const onPageLoadSuccess = useCallback((page: { width: number; height: number }) => {
        setPageWidth(page.width);
    }, []);

    // Auto page fit calculation
    useEffect(() => {
        if (!pageFit || !pageWidth || containerWidth <= 0 || savedFitScale !== null) return;

        const timeoutId = setTimeout(() => {
            calculatePageFit();
        }, 50);

        return () => clearTimeout(timeoutId);
    }, [pageFit, pageWidth, containerWidth, savedFitScale, calculatePageFit]);

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
            if (savedFitScale !== null) {
                setScale(savedFitScale);
            } else if (pageWidth && containerRef.current) {
                setTimeout(() => {
                    calculatePageFit();
                }, 50);
            }
        }
    }, [pageFit, savedFitScale, pageWidth, containerRef, calculatePageFit]);

    const resetZoom = useCallback(() => {
        setScale(1.0);
        setPageFit(false);
        setPageWidth(null);
        setSavedFitScale(null);
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
