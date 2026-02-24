'use client';

import { useEffect, useRef } from 'react';
import { ALargeSmall, ChevronDown, ChevronUp, WholeWord, X } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { SearchIcon } from '@/shared/ui/icons';
import { Input } from '@/shared/ui/input';

export type PdfSearchBarProps = {
    searchTerm: string;
    matchCase: boolean;
    matchWholeWord: boolean;
    currentMatchIndex: number;
    totalMatches: number;
    onSearchTermChange: (term: string) => void;
    onMatchCaseChange: (value: boolean) => void;
    onMatchWholeWordChange: (value: boolean) => void;
    onNextMatch: () => void;
    onPrevMatch: () => void;
    onClose: () => void;
};

export function PdfSearchBar({
    searchTerm,
    matchCase,
    matchWholeWord,
    currentMatchIndex,
    totalMatches,
    onSearchTermChange,
    onMatchCaseChange,
    onMatchWholeWordChange,
    onNextMatch,
    onPrevMatch,
    onClose,
}: PdfSearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                onPrevMatch();
            } else {
                onNextMatch();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    return (
        <div className="flex items-center gap-2 border-b px-4 py-2">
            <SearchIcon className="text-muted-foreground h-4 w-4 shrink-0" />
            <Input
                ref={inputRef}
                className="flex-1"
                placeholder="Search in document..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <Button
                className="h-7 w-7"
                size="icon"
                title="Match Case"
                variant={matchCase ? 'default' : 'ghost'}
                onClick={() => onMatchCaseChange(!matchCase)}
            >
                <ALargeSmall className="h-4 w-4" />
            </Button>
            <Button
                className="h-7 w-7"
                size="icon"
                title="Match Whole Word"
                variant={matchWholeWord ? 'default' : 'ghost'}
                onClick={() => onMatchWholeWordChange(!matchWholeWord)}
            >
                <WholeWord className="h-4 w-4" />
            </Button>
            <span className="text-muted-foreground text-xs whitespace-nowrap">
                {totalMatches > 0
                    ? `${currentMatchIndex + 1} of ${totalMatches}`
                    : searchTerm.length > 0
                      ? 'No results'
                      : ''}
            </span>
            <Button
                className="h-7 w-7"
                disabled={totalMatches === 0}
                size="icon"
                variant="ghost"
                onClick={onPrevMatch}
            >
                <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
                className="h-7 w-7"
                disabled={totalMatches === 0}
                size="icon"
                variant="ghost"
                onClick={onNextMatch}
            >
                <ChevronDown className="h-4 w-4" />
            </Button>
            <Button className="h-7 w-7" size="icon" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}
