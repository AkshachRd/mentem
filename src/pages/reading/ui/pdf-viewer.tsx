'use client';

import type { ViewMode } from '../model/use-pdf-navigation';

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

import { usePdfContainerRef } from '../model/use-pdf-container-ref';
import { usePdfFileLoader } from '../model/use-pdf-file-loader';
import { usePdfSearch } from '../model/use-pdf-search';
import { usePdfZoom } from '../model/use-pdf-zoom';
import { usePdfNavigation } from '../model/use-pdf-navigation';
import { usePdfContextActions } from '../model/use-pdf-context-actions';
import { usePdfQuoteNavigation } from '../model/use-pdf-quote-navigation';

import { SessionCardsPanel } from './session-cards-panel';
import { PdfSearchBar } from './pdf-search-bar';
import { PdfTextContextMenu } from './pdf-text-context-menu';
import { CreateFlashcardDialog } from './create-flashcard-dialog';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { useTextSelection, usePdfTextSelection } from '@/shared/lib/hooks';
import { Switch } from '@/shared/ui/switch';

// Worker setup for pdfjs
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

type PdfViewerProps = {
    filePath: string | null;
};

export function PdfViewer({ filePath }: PdfViewerProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('single');

    // Text selection for context menu
    const { getSelectedText } = useTextSelection();
    const { getSelectionWithPosition } = usePdfTextSelection();

    // File loading
    const { fileUrl, error, numPages, pdfDocument, onDocumentLoadSuccess, onDocumentLoadError } =
        usePdfFileLoader(filePath);

    // Container ref binding
    const { containerRef, scrollAreaContainerRef, containerWidth } = usePdfContainerRef([
        viewMode,
        numPages,
        fileUrl,
    ]);

    // Zoom controls
    const zoom = usePdfZoom(containerRef, containerWidth);

    // Page navigation
    const nav = usePdfNavigation(containerRef, numPages, zoom.scale, viewMode);

    // PDF search
    const search = usePdfSearch(pdfDocument, nav.scrollToPage, nav.setPageNumber, containerRef);

    // Context menu actions
    const ctx = usePdfContextActions(filePath, nav.pageNumber, search.openSearch);

    // Quote navigation from chat
    usePdfQuoteNavigation(filePath, containerRef, viewMode, nav.scrollToPage, nav.setPageNumber);

    // Keyboard shortcuts for search (stable ref to avoid listener re-registration)
    const searchRef = useRef(search);

    searchRef.current = search;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                searchRef.current.openSearch();
            } else if (e.key === 'Escape' && searchRef.current.isSearchOpen) {
                searchRef.current.closeSearch();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Reset zoom and page number when file changes
    useEffect(() => {
        if (filePath) {
            zoom.resetZoom();
            nav.setPageNumber(1);
        }
    }, [filePath]);

    if (!filePath) {
        return (
            <Card className="flex h-full items-center justify-center">
                <CardContent>
                    <p className="text-muted-foreground text-center">
                        Please select a PDF file to view
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!fileUrl && !error) {
        return (
            <Card className="flex h-full items-center justify-center">
                <CardContent>
                    <p className="text-muted-foreground text-center">Loading PDF file...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="flex h-full flex-col">
            <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle>PDF Viewer</CardTitle>
                    <div className="flex items-center gap-4">
                        {numPages && (
                            <div className="flex items-center gap-2">
                                <Button
                                    disabled={nav.pageNumber <= 1}
                                    size="sm"
                                    variant="outline"
                                    onClick={nav.goToPrevPage}
                                >
                                    Previous
                                </Button>
                                <span className="text-muted-foreground text-sm">
                                    Page {nav.pageNumber} of {numPages}
                                </span>
                                <Button
                                    disabled={nav.pageNumber >= numPages}
                                    size="sm"
                                    variant="outline"
                                    onClick={nav.goToNextPage}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-xs">Single page</span>
                                <Switch
                                    aria-label="Toggle view mode"
                                    checked={viewMode === 'all'}
                                    size="sm"
                                    onCheckedChange={(checked) => {
                                        setViewMode(checked ? 'all' : 'single');
                                    }}
                                />
                                <span className="text-muted-foreground text-xs">All pages</span>
                            </div>
                            <div className="flex items-center gap-2 border-l pl-4">
                                <Button
                                    disabled={zoom.scale <= zoom.MIN_ZOOM}
                                    size="sm"
                                    title="Zoom out"
                                    variant="outline"
                                    onClick={zoom.handleZoomOut}
                                >
                                    −
                                </Button>
                                <Button
                                    size="sm"
                                    title="Fit to page"
                                    variant={zoom.pageFit ? 'default' : 'outline'}
                                    onClick={zoom.handlePageFit}
                                >
                                    Fit
                                </Button>
                                <span className="text-muted-foreground min-w-[3rem] text-center text-xs">
                                    {Math.round(zoom.scale * 100)}%
                                </span>
                                <Button
                                    disabled={zoom.scale >= zoom.MAX_ZOOM}
                                    size="sm"
                                    title="Zoom in"
                                    variant="outline"
                                    onClick={zoom.handleZoomIn}
                                >
                                    +
                                </Button>
                                <Button
                                    disabled={zoom.scale === 1.0 && !zoom.pageFit}
                                    size="sm"
                                    title="Reset zoom"
                                    variant="outline"
                                    onClick={zoom.handleResetZoom}
                                >
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
            {search.isSearchOpen && (
                <PdfSearchBar
                    currentMatchIndex={search.currentMatchIndex}
                    matchCase={search.matchCase}
                    matchWholeWord={search.matchWholeWord}
                    searchTerm={search.searchTerm}
                    totalMatches={search.matches.length}
                    onClose={search.closeSearch}
                    onMatchCaseChange={search.setMatchCase}
                    onMatchWholeWordChange={search.setMatchWholeWord}
                    onNextMatch={search.goToNextMatch}
                    onPrevMatch={search.goToPrevMatch}
                    onSearchTermChange={search.setSearchTerm}
                />
            )}
            <CardContent className="flex flex-1 flex-col overflow-hidden p-4">
                <div ref={scrollAreaContainerRef} className="min-h-0 flex-1">
                    <ScrollArea className="h-full w-full">
                        {error ? (
                            <div className="text-destructive text-center">
                                <p>{error}</p>
                            </div>
                        ) : (
                            fileUrl && (
                                <PdfTextContextMenu
                                    getSelectedText={getSelectedText}
                                    getSelectionWithPosition={getSelectionWithPosition}
                                    onAddNote={ctx.handlers.onAddNote}
                                    onCopy={ctx.handlers.onCopy}
                                    onCreateFlashcard={ctx.handlers.onCreateFlashcard}
                                    onHighlight={ctx.handlers.onHighlight}
                                    onSaveAsQuote={ctx.handlers.onSaveAsQuote}
                                    onSearch={ctx.handlers.onSearch}
                                    onSendToChat={ctx.handlers.onSendToChat}
                                >
                                    <div className="flex flex-col items-center gap-4 p-4">
                                        <Document
                                            file={fileUrl}
                                            loading={
                                                <div className="text-muted-foreground">
                                                    Loading PDF...
                                                </div>
                                            }
                                            onLoadError={onDocumentLoadError}
                                            onLoadSuccess={onDocumentLoadSuccess}
                                        >
                                            {viewMode === 'single' ? (
                                                <div
                                                    className="flex justify-center"
                                                    data-page-number={nav.pageNumber}
                                                >
                                                    <Page
                                                        className="max-w-full"
                                                        pageNumber={nav.pageNumber}
                                                        renderAnnotationLayer={true}
                                                        renderTextLayer={true}
                                                        scale={zoom.scale}
                                                        onLoadSuccess={zoom.onPageLoadSuccess}
                                                        onRenderTextLayerSuccess={
                                                            search.rehighlight
                                                        }
                                                    />
                                                </div>
                                            ) : (
                                                numPages &&
                                                Array.from(new Array(numPages), (el, index) => {
                                                    const pageNum = index + 1;

                                                    return (
                                                        <div
                                                            key={`page_${pageNum}`}
                                                            className="flex justify-center"
                                                            data-page-number={pageNum}
                                                        >
                                                            <Page
                                                                className="max-w-full"
                                                                pageNumber={pageNum}
                                                                renderAnnotationLayer={true}
                                                                renderTextLayer={true}
                                                                scale={zoom.scale}
                                                                onLoadSuccess={
                                                                    zoom.onPageLoadSuccess
                                                                }
                                                                onRenderTextLayerSuccess={
                                                                    search.rehighlight
                                                                }
                                                            />
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </Document>
                                    </div>
                                </PdfTextContextMenu>
                            )
                        )}
                    </ScrollArea>
                </div>
            </CardContent>

            {/* Flashcard creation dialog */}
            <CreateFlashcardDialog
                open={ctx.flashcardDialogOpen}
                selectedText={ctx.flashcardText}
                sourceContext={
                    filePath
                        ? `${filePath.split(/[\\/]/).pop()}, Page ${nav.pageNumber}`
                        : undefined
                }
                onOpenChange={ctx.setFlashcardDialogOpen}
            />

            {/* Session cards floating panel */}
            <SessionCardsPanel />
        </Card>
    );
}
