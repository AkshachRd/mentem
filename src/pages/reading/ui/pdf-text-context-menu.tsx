'use client';

import { ReactNode, useState, useCallback, MouseEvent } from 'react';

import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent,
} from '@/shared/ui/shadcn/context-menu';
import { CopyDocumentIcon, AddNoteIcon, SearchIcon } from '@/shared/ui/icons';

const iconClasses = 'text-base pointer-events-none shrink-0';

// Highlight color options
const HIGHLIGHT_COLORS = [
    { name: 'Yellow', value: '#fef08a', className: 'bg-yellow-200' },
    { name: 'Green', value: '#bbf7d0', className: 'bg-green-200' },
    { name: 'Blue', value: '#bfdbfe', className: 'bg-blue-200' },
    { name: 'Pink', value: '#fbcfe8', className: 'bg-pink-200' },
] as const;

export interface PdfTextContextMenuProps {
    children: ReactNode;
    getSelectedText: () => string;
    onCopy: (text: string) => void;
    onAddNote: (text: string) => void;
    onHighlight: (text: string, color: string) => void;
    onSearch: (text: string) => void;
}

export function PdfTextContextMenu({
    children,
    getSelectedText,
    onCopy,
    onAddNote,
    onHighlight,
    onSearch,
}: PdfTextContextMenuProps) {
    const [currentText, setCurrentText] = useState('');
    const [hasSelection, setHasSelection] = useState(false);

    // Capture selected text when context menu is about to open
    const handleContextMenu = useCallback(
        (e: MouseEvent) => {
            const text = getSelectedText();

            if (text) {
                setCurrentText(text);
                setHasSelection(true);
            } else {
                setHasSelection(false);
                // Allow default browser context menu when no text selected
                e.stopPropagation();
            }
        },
        [getSelectedText],
    );

    return (
        <ContextMenu>
            <ContextMenuTrigger className="contents" onContextMenu={handleContextMenu}>
                {children}
            </ContextMenuTrigger>
            {hasSelection && (
                <ContextMenuContent className="w-48">
                    <ContextMenuItem onClick={() => onCopy(currentText)}>
                        <CopyDocumentIcon className={iconClasses} />
                        <span>Copy</span>
                    </ContextMenuItem>

                    <ContextMenuItem onClick={() => onAddNote(currentText)}>
                        <AddNoteIcon className={iconClasses} />
                        <span>Add Note</span>
                    </ContextMenuItem>

                    <ContextMenuSub>
                        <ContextMenuSubTrigger>
                            <div className="size-4 rounded border border-current opacity-60" />
                            <span>Highlight</span>
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-32">
                            {HIGHLIGHT_COLORS.map((color) => (
                                <ContextMenuItem
                                    key={color.value}
                                    onClick={() => onHighlight(currentText, color.value)}
                                >
                                    <div
                                        className={`size-4 rounded ${color.className}`}
                                        style={{ backgroundColor: color.value }}
                                    />
                                    <span>{color.name}</span>
                                </ContextMenuItem>
                            ))}
                        </ContextMenuSubContent>
                    </ContextMenuSub>

                    <ContextMenuSeparator />

                    <ContextMenuItem onClick={() => onSearch(currentText)}>
                        <SearchIcon className={iconClasses} />
                        <span>Search in Document</span>
                    </ContextMenuItem>
                </ContextMenuContent>
            )}
        </ContextMenu>
    );
}
