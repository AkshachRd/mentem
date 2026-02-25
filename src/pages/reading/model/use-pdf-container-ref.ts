'use client';

import { useEffect, useRef } from 'react';

export function usePdfContainerRef(deps: unknown[]) {
    const containerRef = useRef<HTMLElement | null>(null);
    const scrollAreaContainerRef = useRef<HTMLDivElement>(null);

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

    return { containerRef, scrollAreaContainerRef };
}
