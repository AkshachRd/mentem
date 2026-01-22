'use client';

import { useCallback } from 'react';

export interface PdfTextSelectionData {
    text: string;
    pageNumber: number;
    startOffset: number;
    endOffset: number;
    rect: {
        top: number;
        left: number;
        width: number;
        height: number;
    };
}

/**
 * Find the page container element by traversing up from a node
 */
function findPageContainer(node: Node): HTMLElement | null {
    let current: Node | null = node;

    while (current) {
        if (current instanceof HTMLElement && current.dataset.pageNumber) {
            return current;
        }
        current = current.parentNode;
    }

    return null;
}

/**
 * Calculate character offsets within the text layer
 */
function calculateTextOffsets(
    range: Range,
    textLayer: Element | null,
): { startOffset: number; endOffset: number } {
    if (!textLayer) return { startOffset: 0, endOffset: 0 };

    const walker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT);
    let offset = 0;
    let startOffset = 0;
    let endOffset = 0;
    let node: Text | null;

    while ((node = walker.nextNode() as Text | null)) {
        const nodeLength = node.textContent?.length || 0;

        if (node === range.startContainer) {
            startOffset = offset + range.startOffset;
        }
        if (node === range.endContainer) {
            endOffset = offset + range.endOffset;
            break;
        }
        offset += nodeLength;
    }

    return { startOffset, endOffset };
}

/**
 * Hook for capturing PDF text selection with position data
 */
export function usePdfTextSelection() {
    const getSelectionWithPosition = useCallback((): PdfTextSelectionData | null => {
        const selection = window.getSelection();

        if (!selection || selection.isCollapsed) return null;

        const text = selection.toString().trim();

        if (!text) return null;

        const range = selection.getRangeAt(0);

        // Find the page container by traversing up from selection
        const pageElement = findPageContainer(range.commonAncestorContainer);

        if (!pageElement) return null;

        const pageNumber = parseInt(pageElement.dataset.pageNumber || '1', 10);

        // Get bounding rect relative to page
        const rangeRect = range.getBoundingClientRect();
        const pageRect = pageElement.getBoundingClientRect();

        // Calculate offsets within the text layer
        const textLayer = pageElement.querySelector('.react-pdf__Page__textContent');
        const { startOffset, endOffset } = calculateTextOffsets(range, textLayer);

        return {
            text,
            pageNumber,
            startOffset,
            endOffset,
            rect: {
                top: rangeRect.top - pageRect.top,
                left: rangeRect.left - pageRect.left,
                width: rangeRect.width,
                height: rangeRect.height,
            },
        };
    }, []);

    const clearSelection = useCallback(() => {
        window.getSelection()?.removeAllRanges();
    }, []);

    return { getSelectionWithPosition, clearSelection };
}
