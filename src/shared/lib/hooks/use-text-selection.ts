'use client';

import { useRef, useCallback } from 'react';

export interface TextSelectionState {
    getSelectedText: () => string;
    clearSelection: () => void;
}

/**
 * Custom hook for tracking text selection in the document.
 * Uses refs instead of state to avoid re-renders during selection.
 */
export function useTextSelection(): TextSelectionState {
    const selectedTextRef = useRef('');

    const getSelectedText = useCallback(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim() || '';

        selectedTextRef.current = text;

        return text;
    }, []);

    const clearSelection = useCallback(() => {
        window.getSelection()?.removeAllRanges();
        selectedTextRef.current = '';
    }, []);

    return { getSelectedText, clearSelection };
}
