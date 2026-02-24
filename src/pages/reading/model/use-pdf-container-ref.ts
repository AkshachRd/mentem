'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export function usePdfContainerRef(deps: unknown[]) {
    const containerRef = useRef<HTMLElement | null>(null);
    const scrollAreaContainerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // Bind containerRef to ScrollArea viewport
    useEffect(() => {
        const updateViewportRef = () => {
            if (scrollAreaContainerRef.current) {
                const viewport = scrollAreaContainerRef.current.querySelector(
                    '[data-slot="scroll-area-viewport"]',
                ) as HTMLElement;

                if (viewport) {
                    containerRef.current = viewport;
                }
            }
        };

        const timeoutId = setTimeout(updateViewportRef, 0);

        const observer = new MutationObserver(updateViewportRef);

        if (scrollAreaContainerRef.current) {
            observer.observe(scrollAreaContainerRef.current, {
                childList: true,
                subtree: true,
            });
        }

        return () => {
            clearTimeout(timeoutId);
            observer.disconnect();
        };
    }, deps);

    // Track container width
    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const updateWidth = () => {
            if (containerRef.current) {
                const width = containerRef.current.getBoundingClientRect().width;

                setContainerWidth(width);
            }
        };

        updateWidth();

        const resizeObserver = new ResizeObserver(updateWidth);

        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    return { containerRef, scrollAreaContainerRef, containerWidth };
}
