'use client';

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

import { Switch } from '@/shared/ui/switch';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { toast } from 'sonner';

import { PdfTextContextMenu } from './pdf-text-context-menu';
import { CreateFlashcardDialog } from './create-flashcard-dialog';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { useTextSelection, usePdfTextSelection } from '@/shared/lib/hooks';

import type { PdfTextSelectionData } from '@/shared/lib/hooks';

import { useMemoriesStore } from '@/entities/memory';
import { useQuoteStore } from '@/entities/quote';

import type { Quote } from '@/entities/quote';

// Настройка worker для pdfjs
// Используем версию из react-pdf (5.4.296)
if (typeof window !== 'undefined') {
    // Используем CDN с правильной версией
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

type PdfViewerProps = {
    filePath: string | null;
    pdfContent?: string;
};

type ViewMode = 'single' | 'all';

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;

export function PdfViewer({ filePath, pdfContent }: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [viewMode, setViewMode] = useState<ViewMode>('single');
    const [scale, setScale] = useState(1.0);
    const [pageFit, setPageFit] = useState(false);
    const [pageWidth, setPageWidth] = useState<number | null>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [savedFitScale, setSavedFitScale] = useState<number | null>(null);
    const containerRef = useRef<HTMLElement | null>(null);
    const scrollAreaContainerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);

    // Flashcard dialog state
    const [flashcardDialogOpen, setFlashcardDialogOpen] = useState(false);
    const [flashcardText, setFlashcardText] = useState('');

    // Text selection for context menu
    const { getSelectedText, clearSelection } = useTextSelection();
    const { getSelectionWithPosition } = usePdfTextSelection();

    // Memories store for adding notes
    const addMemory = useMemoriesStore((state) => state.addMemory);

    // Quote store for chat integration
    const addPendingQuote = useQuoteStore((state) => state.addPendingQuote);
    const navigationTarget = useQuoteStore((state) => state.navigationTarget);
    const clearNavigationTarget = useQuoteStore((state) => state.clearNavigationTarget);

    // Ref for highlight cleanup
    const highlightCleanupRef = useRef<(() => void) | null>(null);

    // Context menu action handlers
    const handleCopy = useCallback(
        async (text: string) => {
            if (!text) return;

            try {
                await navigator.clipboard.writeText(text);
            } catch {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');

                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            clearSelection();
        },
        [clearSelection],
    );

    const handleAddNote = useCallback(
        (text: string) => {
            if (!text) return;

            // Extract filename from path
            const fileName = filePath ? filePath.split(/[\\/]/).pop() || 'PDF' : 'PDF';

            // Create a new note memory with the selected text
            const newMemory = {
                id: crypto.randomUUID(),
                kind: 'note' as const,
                content: text,
                title: `From ${fileName} (Page ${pageNumber})`,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                tagIds: [],
            };

            addMemory(newMemory);
            toast.success('Note created', {
                description: `From ${fileName} (Page ${pageNumber})`,
            });
            clearSelection();
        },
        [filePath, pageNumber, clearSelection, addMemory],
    );

    const handleHighlight = useCallback(
        (text: string, color: string) => {
            // TODO: Store highlight annotation with position data
            // For now, log the action
            // eslint-disable-next-line no-console
            console.log('Highlight:', text, 'with color:', color);
            clearSelection();
        },
        [clearSelection],
    );

    const handleSearch = useCallback(
        (text: string) => {
            // TODO: Implement search in document functionality
            // For now, log the action
            // eslint-disable-next-line no-console
            console.log('Search for:', text);
            clearSelection();
        },
        [clearSelection],
    );

    // Handle sending selected text to chat as a quote
    const handleSendToChat = useCallback(
        (data: PdfTextSelectionData) => {
            if (!data.text || !filePath) return;

            const fileName = filePath.split(/[\\/]/).pop() || 'PDF';

            const quote: Quote = {
                id: crypto.randomUUID(),
                text: data.text,
                source: {
                    filePath,
                    fileName,
                    position: {
                        pageNumber: data.pageNumber,
                        startOffset: data.startOffset,
                        endOffset: data.endOffset,
                        rect: data.rect,
                    },
                },
                createdAt: Date.now(),
            };

            // Add to pending quotes in chat
            addPendingQuote(quote);

            toast.success('Цитата добавлена в чат', {
                description: `${fileName}, стр. ${data.pageNumber}`,
            });

            clearSelection();
        },
        [filePath, addPendingQuote, clearSelection],
    );

    // Handle creating flashcard from selected text
    const handleCreateFlashcard = useCallback(
        (text: string) => {
            if (!text) return;

            setFlashcardText(text);
            setFlashcardDialogOpen(true);
            clearSelection();
        },
        [clearSelection],
    );

    // Функция для расчета масштаба page fit
    const calculatePageFit = useCallback(() => {
        if (!containerRef.current || !pageWidth) return;

        const padding = 32; // padding контейнера
        const containerWidth = containerRef.current.getBoundingClientRect().width;
        const availableWidth = containerWidth - padding;
        const calculatedScale = availableWidth / pageWidth;
        const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, calculatedScale));

        // Сохраняем вычисленный масштаб при первом расчете
        setSavedFitScale((prev) => prev ?? newScale);

        setScale((prev) => {
            const diff = Math.abs(prev - newScale);

            // Обновляем только если разница больше 0.01 (1%)
            return diff > 0.01 ? newScale : prev;
        });
    }, [pageWidth]);

    // Обработка загрузки страницы для получения её размеров
    const onPageLoadSuccess = useCallback((page: { width: number; height: number }) => {
        setPageWidth(page.width);
    }, []);

    // Привязка containerRef к viewport ScrollArea
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

        // Небольшая задержка для того, чтобы ScrollArea успел смонтироваться
        const timeoutId = setTimeout(updateViewportRef, 0);

        // Также обновляем при изменении содержимого
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
    }, [viewMode, numPages, fileUrl]);

    // Отслеживание размера контейнера
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

    // Автоматический расчет масштаба для page fit при изменении размеров окна
    // Но только если сохраненный масштаб еще не установлен
    useEffect(() => {
        if (!pageFit || !pageWidth || containerWidth <= 0 || savedFitScale !== null) return;

        // Небольшая задержка для корректного вычисления размеров
        const timeoutId = setTimeout(() => {
            calculatePageFit();
        }, 50);

        return () => clearTimeout(timeoutId);
    }, [pageFit, pageWidth, containerWidth, savedFitScale, calculatePageFit]);

    // Отслеживание видимой страницы при прокрутке в режиме "all pages"
    useEffect(() => {
        if (viewMode !== 'all' || !numPages || !containerRef.current) return;

        const container = containerRef.current;
        let rafId: number | null = null;
        const lastPageRef = { current: pageNumber };

        // При переключении в режим "all pages" скроллим к первой странице
        container.scrollTo({ top: 0, behavior: 'instant' });
        setPageNumber(1);
        lastPageRef.current = 1;

        const updateVisiblePage = () => {
            const pageElements = Array.from(
                container.querySelectorAll('[data-page-number]'),
            ) as HTMLElement[];

            if (pageElements.length === 0) return;

            const containerRect = container.getBoundingClientRect();
            const containerCenter = containerRect.top + containerRect.height / 2;

            let closestPage = 1;
            let minDistance = Infinity;

            pageElements.forEach((pageEl) => {
                const pageRect = pageEl.getBoundingClientRect();
                const pageCenter = pageRect.top + pageRect.height / 2;
                const distance = Math.abs(containerCenter - pageCenter);

                // Учитываем только страницы, которые хотя бы частично видны
                const isVisible =
                    pageRect.bottom >= containerRect.top && pageRect.top <= containerRect.bottom;

                if (isVisible && distance < minDistance) {
                    minDistance = distance;
                    const pageNum = parseInt(pageEl.dataset.pageNumber || '1', 10);

                    closestPage = pageNum;
                }
            });

            // Обновляем только если номер страницы действительно изменился
            if (
                closestPage !== lastPageRef.current &&
                closestPage >= 1 &&
                closestPage <= numPages
            ) {
                lastPageRef.current = closestPage;
                setPageNumber(closestPage);
            }
        };

        const handleScroll = () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }

            rafId = requestAnimationFrame(updateVisiblePage);
        };

        // Первоначальное обновление с задержкой, чтобы страницы успели загрузиться
        const timeoutId = setTimeout(() => {
            updateVisiblePage();
        }, 100);

        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScroll);
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            clearTimeout(timeoutId);
        };
    }, [viewMode, numPages, scale]);

    useEffect(() => {
        if (filePath) {
            setPageNumber(1);
            setNumPages(null);
            setError(null);
            setFileUrl(null);
            setScale(1.0);
            setPageFit(false);
            setPageWidth(null);
            setSavedFitScale(null);

            // Если есть PDF content - создаем Blob URL
            if (pdfContent) {
                try {
                    const uint8Array = new TextEncoder().encode(pdfContent);
                    const blob = new Blob([uint8Array], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);

                    setFileUrl(url);
                } catch (err) {
                    // eslint-disable-next-line no-console
                    console.error('Error creating PDF URL:', err);
                    setError('Failed to create PDF file');
                }
            }
        }
    }, [filePath, pdfContent]);

    // Handle navigation from quote clicks in chat
    useEffect(() => {
        if (!navigationTarget || !containerRef.current) return;

        // Check if this viewer has the target file
        if (navigationTarget.filePath !== filePath) {
            // File mismatch - clear target, different viewer should handle it
            return;
        }

        const { position } = navigationTarget;

        // Clean up previous highlight
        if (highlightCleanupRef.current) {
            highlightCleanupRef.current();
            highlightCleanupRef.current = null;
        }

        // Navigate to page
        if (viewMode === 'all') {
            scrollToPage(position.pageNumber);
        } else {
            setPageNumber(position.pageNumber);
        }

        // Highlight the text after scroll completes
        const timeoutId = setTimeout(() => {
            if (!containerRef.current) return;

            const pageElement = containerRef.current.querySelector(
                `[data-page-number="${position.pageNumber}"]`,
            ) as HTMLElement;

            if (pageElement && position.rect) {
                // Create highlight overlay
                const highlight = document.createElement('div');

                highlight.className = 'quote-highlight-overlay';
                highlight.style.cssText = `
                    position: absolute;
                    top: ${position.rect.top}px;
                    left: ${position.rect.left}px;
                    width: ${position.rect.width}px;
                    height: ${position.rect.height}px;
                    background-color: rgba(255, 213, 0, 0.4);
                    pointer-events: none;
                    border-radius: 2px;
                    animation: quote-highlight-fade 2s ease-out forwards;
                `;

                // Position relative to page
                const pageContent = pageElement.querySelector('.react-pdf__Page') as HTMLElement;

                if (pageContent) {
                    pageContent.style.position = 'relative';
                    pageContent.appendChild(highlight);

                    // Cleanup function
                    highlightCleanupRef.current = () => {
                        highlight.remove();
                    };

                    // Auto-remove after animation
                    setTimeout(() => {
                        highlight.remove();
                        highlightCleanupRef.current = null;
                    }, 2000);
                }
            }

            clearNavigationTarget();
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [navigationTarget, filePath, viewMode, clearNavigationTarget]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setError(null);
    };

    const onDocumentLoadError = (error: Error) => {
        // eslint-disable-next-line no-console
        console.error('Error loading PDF:', error);
        setError('Failed to load PDF file');
    };

    const scrollToPage = (targetPage: number) => {
        if (!containerRef.current || !numPages) return;

        const pageElement = containerRef.current.querySelector(
            `[data-page-number="${targetPage}"]`,
        ) as HTMLElement;

        if (pageElement && containerRef.current) {
            const container = containerRef.current;
            const containerRect = container.getBoundingClientRect();
            const pageRect = pageElement.getBoundingClientRect();

            // Вычисляем позицию для центрирования страницы в контейнере
            const scrollTop =
                container.scrollTop +
                pageRect.top -
                containerRect.top -
                containerRect.height / 2 +
                pageRect.height / 2;

            container.scrollTo({
                top: scrollTop,
                behavior: 'smooth',
            });
        }
    };

    const goToPrevPage = () => {
        const newPage = Math.max(1, pageNumber - 1);

        setPageNumber(newPage);

        if (viewMode === 'all') {
            scrollToPage(newPage);
        }
    };

    const goToNextPage = () => {
        const newPage = Math.min(numPages || 1, pageNumber + 1);

        setPageNumber(newPage);

        if (viewMode === 'all') {
            scrollToPage(newPage);
        }
    };

    const handleZoomIn = () => {
        setPageFit(false);
        setScale((prev) => {
            // Округляем вверх до ближайшего круглого значения (кратного 25%)
            const nextRound = Math.ceil(prev / ZOOM_STEP) * ZOOM_STEP;

            // Если уже на круглом значении, переходим к следующему
            const diff = Math.abs(prev - nextRound);

            if (diff < 0.001) {
                // Уже на круглом значении, добавляем шаг
                return Math.min(MAX_ZOOM, nextRound + ZOOM_STEP);
            }

            // Округляем до ближайшего круглого значения
            return Math.min(MAX_ZOOM, nextRound);
        });
    };

    const handleZoomOut = () => {
        setPageFit(false);
        setScale((prev) => {
            // Округляем вниз до ближайшего круглого значения (кратного 25%)
            const prevRound = Math.floor(prev / ZOOM_STEP) * ZOOM_STEP;

            // Если уже на круглом значении, переходим к предыдущему
            const diff = Math.abs(prev - prevRound);

            if (diff < 0.001) {
                // Уже на круглом значении, вычитаем шаг
                return Math.max(MIN_ZOOM, prevRound - ZOOM_STEP);
            }

            // Округляем до ближайшего круглого значения
            return Math.max(MIN_ZOOM, prevRound);
        });
    };

    const handleResetZoom = () => {
        setPageFit(false);
        setScale(1.0);
    };

    const handlePageFit = () => {
        const newPageFit = !pageFit;

        setPageFit(newPageFit);

        if (newPageFit) {
            // Если у нас уже есть сохраненный масштаб fit, используем его
            if (savedFitScale !== null) {
                setScale(savedFitScale);
            } else if (pageWidth && containerRef.current) {
                // Иначе вычисляем новый масштаб
                // Небольшая задержка для корректного вычисления размеров
                setTimeout(() => {
                    calculatePageFit();
                }, 50);
            }
        }
    };

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
                                    disabled={pageNumber <= 1}
                                    size="sm"
                                    variant="outline"
                                    onClick={goToPrevPage}
                                >
                                    Previous
                                </Button>
                                <span className="text-muted-foreground text-sm">
                                    Page {pageNumber} of {numPages}
                                </span>
                                <Button
                                    disabled={pageNumber >= numPages}
                                    size="sm"
                                    variant="outline"
                                    onClick={goToNextPage}
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
                                    disabled={scale <= MIN_ZOOM}
                                    size="sm"
                                    title="Zoom out"
                                    variant="outline"
                                    onClick={handleZoomOut}
                                >
                                    −
                                </Button>
                                <Button
                                    size="sm"
                                    title="Fit to page"
                                    variant={pageFit ? 'default' : 'outline'}
                                    onClick={handlePageFit}
                                >
                                    Fit
                                </Button>
                                <span className="text-muted-foreground min-w-[3rem] text-center text-xs">
                                    {Math.round(scale * 100)}%
                                </span>
                                <Button
                                    disabled={scale >= MAX_ZOOM}
                                    size="sm"
                                    title="Zoom in"
                                    variant="outline"
                                    onClick={handleZoomIn}
                                >
                                    +
                                </Button>
                                <Button
                                    disabled={scale === 1.0 && !pageFit}
                                    size="sm"
                                    title="Reset zoom"
                                    variant="outline"
                                    onClick={handleResetZoom}
                                >
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
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
                                    onAddNote={handleAddNote}
                                    onCopy={handleCopy}
                                    onCreateFlashcard={handleCreateFlashcard}
                                    onHighlight={handleHighlight}
                                    onSearch={handleSearch}
                                    onSendToChat={handleSendToChat}
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
                                                    data-page-number={pageNumber}
                                                >
                                                    <Page
                                                        className="max-w-full"
                                                        pageNumber={pageNumber}
                                                        renderAnnotationLayer={true}
                                                        renderTextLayer={true}
                                                        scale={scale}
                                                        onLoadSuccess={onPageLoadSuccess}
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
                                                                scale={scale}
                                                                onLoadSuccess={onPageLoadSuccess}
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
                open={flashcardDialogOpen}
                selectedText={flashcardText}
                sourceContext={
                    filePath ? `${filePath.split(/[\\/]/).pop()}, Page ${pageNumber}` : undefined
                }
                onOpenChange={setFlashcardDialogOpen}
            />
        </Card>
    );
}
