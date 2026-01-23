'use client';

import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';

const useMedia = (queries: string[], values: number[], defaultValue: number): number => {
    const get = () => values[queries.findIndex((q) => matchMedia?.(q).matches)] ?? defaultValue;

    const [value, setValue] = useState<number>(get);

    useEffect(() => {
        const handler = () => setValue(get);

        queries.forEach((q) => matchMedia?.(q).addEventListener('change', handler));

        return () => queries.forEach((q) => matchMedia?.(q).removeEventListener('change', handler));
    }, [queries]);

    return value;
};

type MasonryProps<TItem> = {
    items: TItem[];
    getItemKey: (item: TItem) => string;
    getItemHeight?: (item: TItem, columnWidth: number) => number;
    renderItem: (item: TItem) => React.ReactNode;
    columnWidth?: number;
    gap?: number;
};

export function Masonry<TItem>({
    items,
    getItemKey,
    renderItem,
    columnWidth = 380,
    gap = 16,
}: MasonryProps<TItem>) {
    const columns = useMedia(
        ['(min-width:1500px)', '(min-width:1000px)', '(min-width:600px)', '(min-width:400px)'],
        [4, 3, 2, 1],
        1,
    );

    const [isMounted, setIsMounted] = useState(false);

    useLayoutEffect(() => {
        setIsMounted(true);
    }, []);

    // Distribute items into columns
    const columnItems = useMemo(() => {
        const cols: TItem[][] = Array.from({ length: columns }, () => []);

        items.forEach((item, index) => {
            // Simple round-robin distribution
            cols[index % columns].push(item);
        });

        return cols;
    }, [items, columns]);

    if (!isMounted) {
        return <div className="w-full" style={{ minHeight: '400px' }} />;
    }

    return (
        <div className="flex w-full justify-center" style={{ gap: `${gap}px` }}>
            {columnItems.map((colItems, colIndex) => (
                <div
                    key={colIndex}
                    className="flex flex-col"
                    style={{ width: columnWidth, gap: `${gap}px` }}
                >
                    {colItems.map((item) => (
                        <div key={getItemKey(item)}>{renderItem(item)}</div>
                    ))}
                </div>
            ))}
        </div>
    );
}
