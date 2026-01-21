'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';

const useMedia = (queries: string[], values: number[], defaultValue: number): number => {
    const get = () => {
        // Check if we're in a browser environment
        if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
            return defaultValue;
        }

        return values[queries.findIndex((q) => matchMedia(q).matches)] ?? defaultValue;
    };

    const [value, setValue] = useState<number>(defaultValue);

    useEffect(() => {
        // Only run in browser
        if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
            return;
        }

        // Set initial value
        setValue(get());

        const handler = () => setValue(get());

        queries.forEach((q) => matchMedia(q).addEventListener('change', handler));

        return () => queries.forEach((q) => matchMedia(q).removeEventListener('change', handler));
    }, [queries]);

    return value;
};

const useMeasure = <T extends HTMLElement>() => {
    const ref = useRef<T | null>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useLayoutEffect(() => {
        if (!ref.current) return;
        const element = ref.current;

        // Set initial size immediately so first layout can compute
        const rect = element.getBoundingClientRect();

        setSize({ width: rect.width, height: rect.height });

        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;

            setSize({ width, height });
        });

        ro.observe(element);

        return () => ro.disconnect();
    }, []);

    return [ref, size] as const;
};

type GridItem = {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
};

type AnimateFrom = 'bottom' | 'top' | 'left' | 'right' | 'center' | 'random';

type MasonryProps<TItem> = {
    items: TItem[];
    getItemKey: (item: TItem) => string;
    getItemHeight: (item: TItem, columnWidth: number) => number;
    renderItem: (item: TItem) => React.ReactNode;
    columnWidth?: number;
    gap?: number;
    ease?: string;
    duration?: number;
    stagger?: number;
    animateFrom?: AnimateFrom;
    scaleOnHover?: boolean;
    hoverScale?: number;
    blurToFocus?: boolean;
};

export function Masonry<TItem>({
    items,
    getItemKey,
    getItemHeight,
    renderItem,
    columnWidth,
    gap = 16,
    ease = 'power3.out',
    duration = 0.6,
    stagger = 0.05,
    animateFrom = 'bottom',
    scaleOnHover = true,
    hoverScale = 0.95,
    blurToFocus = true,
}: MasonryProps<TItem>) {
    const columnsByBreakpoint = useMedia(
        ['(min-width:1500px)', '(min-width:1000px)', '(min-width:600px)', '(min-width:400px)'],
        [5, 4, 3, 2],
        1,
    );

    const [containerRef, { width }] = useMeasure<HTMLDivElement>();
    const [forcedWidth, setForcedWidth] = useState<number | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useLayoutEffect(() => {
        // Force an initial width based on parent or viewport to avoid 0×0 on first paint
        const parentWidth = containerRef.current?.parentElement?.getBoundingClientRect().width;

        if (parentWidth && parentWidth > 0) {
            setForcedWidth(parentWidth);
        } else if (typeof window !== 'undefined') {
            setForcedWidth(Math.max(window.innerWidth - 32, 320));
        }
        setIsMounted(true);
    }, []);

    const getInitialPosition = (item: GridItem) => {
        const containerRect = containerRef.current?.getBoundingClientRect();

        if (!containerRect) return { x: item.x, y: item.y };

        let direction = animateFrom;

        if (animateFrom === 'random') {
            const dirs = ['top', 'bottom', 'left', 'right'];

            direction = dirs[Math.floor(Math.random() * dirs.length)] as AnimateFrom;
        }

        switch (direction) {
            case 'top':
                return { x: item.x, y: -200 };
            case 'bottom':
                return { x: item.x, y: window.innerHeight + 200 };
            case 'left':
                return { x: -200, y: item.y };
            case 'right':
                return { x: window.innerWidth + 200, y: item.y };
            case 'center':
                return {
                    x: containerRect.width / 2 - item.w / 2,
                    y: containerRect.height / 2 - item.h / 2,
                };
            default:
                return { x: item.x, y: item.y + 100 };
        }
    };

    const measuredWidth = useMemo(() => {
        if (width && width > 0) return width;
        if (forcedWidth && forcedWidth > 0) return forcedWidth;
        const parentWidth = containerRef.current?.parentElement?.getBoundingClientRect().width;

        if (parentWidth && parentWidth > 0) return parentWidth;
        if (typeof window !== 'undefined') return Math.max(window.innerWidth - 32, 320);

        return 0;
    }, [width, forcedWidth]);

    const layout = useMemo(() => {
        if (!measuredWidth) return { grid: [] as GridItem[], containerHeight: 0, columnW: 0 };
        let columns = columnsByBreakpoint;
        let columnW = columnWidth ?? 0;

        if (columnWidth && columnWidth > 0) {
            columns = Math.max(1, Math.floor((measuredWidth + gap) / (columnWidth + gap)));
            columnW = columnWidth;
        } else {
            const totalGaps = (columns - 1) * gap;

            columnW = (measuredWidth - totalGaps) / columns;
        }

        const colHeights = new Array(columns).fill(0) as number[];

        const grid = items.map((child) => {
            const id = getItemKey(child);
            const col = colHeights.indexOf(Math.min(...colHeights));
            const x = col * (columnW + gap);
            const height = getItemHeight(child, columnW);
            const y = colHeights[col];

            colHeights[col] += height + gap;

            return { id, x, y, w: columnW, h: height } as GridItem;
        });

        const containerHeight = Math.max(0, ...colHeights) - gap;

        return { grid, containerHeight, columnW };
    }, [columnsByBreakpoint, items, measuredWidth, getItemKey, getItemHeight, columnWidth, gap]);

    const hasMounted = useRef(false);

    useLayoutEffect(() => {
        layout.grid.forEach((item, index) => {
            const selector = `[data-key="${item.id}"]`;
            const animProps = { x: item.x, y: item.y, width: item.w, height: item.h };

            if (!hasMounted.current) {
                const start = getInitialPosition(item);

                gsap.fromTo(
                    selector,
                    {
                        opacity: 0,
                        x: start.x,
                        y: start.y,
                        width: item.w,
                        height: item.h,
                        ...(blurToFocus && { filter: 'blur(10px)' }),
                    },
                    {
                        opacity: 1,
                        ...animProps,
                        ...(blurToFocus && { filter: 'blur(0px)' }),
                        duration: 0.8,
                        ease: 'power3.out',
                        delay: index * stagger,
                    },
                );
            } else {
                gsap.to(selector, {
                    ...animProps,
                    duration,
                    ease,
                    overwrite: 'auto',
                });
            }
        });

        hasMounted.current = true;
    }, [layout, stagger, animateFrom, blurToFocus, duration, ease]);

    const handleMouseEnter = (id: string) => {
        if (!scaleOnHover) return;
        gsap.to(`[data-key="${id}"]`, {
            scale: hoverScale,
            duration: 0.3,
            ease: 'power2.out',
        });
    };

    const handleMouseLeave = (id: string) => {
        if (!scaleOnHover) return;
        gsap.to(`[data-key="${id}"]`, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
        });
    };

    if (items.length > 0 && layout.grid.length === 0) {
        return (
            <div className="flex w-full flex-col items-center gap-4">
                {items.map((item) => (
                    <div key={getItemKey(item)} className="w-full">
                        {renderItem(item)}
                    </div>
                ))}
            </div>
        );
    }

    const fallbackHeight = useMemo(() => {
        if (!items || items.length === 0) return 0;
        const gap = 16;

        return items.reduce(
            (sum, item, idx) =>
                sum + getItemHeight(item, layout.columnW || 380) + (idx > 0 ? gap : 0),
            0,
        );
    }, [items, getItemHeight, layout.columnW]);

    // Don't render until mounted to avoid hydration mismatch
    if (!isMounted) {
        return (
            <div ref={containerRef} className="relative w-full" style={{ minHeight: '400px' }} />
        );
    }

    return (
        <div
            ref={containerRef}
            className="relative w-full"
            style={{ height: Math.max(0, layout.containerHeight || fallbackHeight) }}
        >
            {layout.grid.map((item, index) => {
                const data = items[index];
                const id = item.id;

                return (
                    <div
                        key={id}
                        className="absolute box-content"
                        data-key={id}
                        style={{ willChange: 'transform, width, height, opacity' }}
                        onMouseEnter={() => handleMouseEnter(id)}
                        onMouseLeave={() => handleMouseLeave(id)}
                    >
                        <div className="relative h-full w-full">{renderItem(data)}</div>
                    </div>
                );
            })}
        </div>
    );
}
