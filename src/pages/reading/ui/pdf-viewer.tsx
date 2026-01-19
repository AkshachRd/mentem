'use client';

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { invoke } from '@tauri-apps/api/core';
import { Switch } from '@heroui/react';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';

// Настройка worker для pdfjs
// Используем версию из react-pdf (5.4.296)
if (typeof window !== 'undefined') {
    // Используем CDN с правильной версией
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

type PdfViewerProps = {
    filePath: string | null;
};

type ViewMode = 'single' | 'all';

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;

export function PdfViewer({ filePath }: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [viewMode, setViewMode] = useState<ViewMode>('single');
    const [scale, setScale] = useState(1.0);
    const [pageFit, setPageFit] = useState(false);
    const [pageWidth, setPageWidth] = useState<number | null>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [savedFitScale, setSavedFitScale] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);

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

            // Конвертируем локальный файл в Blob URL для react-pdf
            const loadFile = async () => {
                try {
                    // Используем команду invoke для чтения бинарного файла
                    const fileData = await invoke<number[]>('fs_any_read_binary_file', {
                        path: filePath,
                    });
                    // Конвертируем массив чисел в Uint8Array
                    const uint8Array = Uint8Array.from(fileData);
                    const blob = new Blob([uint8Array], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);

                    setFileUrl(url);
                } catch (err) {
                    // eslint-disable-next-line no-console
                    console.error('Error reading file:', err);
                    setError('Failed to read PDF file');
                }
            };

            loadFile();

            // Cleanup: revoke object URL when component unmounts or file changes
            return () => {
                if (fileUrl) {
                    URL.revokeObjectURL(fileUrl);
                }
            };
        }
    }, [filePath]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setError(null);
    };

    const onDocumentLoadError = (error: Error) => {
        // eslint-disable-next-line no-console
        console.error('Error loading PDF:', error);
        setError('Failed to load PDF file');
    };

    const goToPrevPage = () => {
        setPageNumber((prev) => Math.max(1, prev - 1));
    };

    const goToNextPage = () => {
        setPageNumber((prev) => Math.min(numPages || 1, prev + 1));
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
                        {numPages && viewMode === 'single' && (
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
                        {numPages && viewMode === 'all' && (
                            <span className="text-muted-foreground text-sm">
                                {numPages} {numPages === 1 ? 'page' : 'pages'}
                            </span>
                        )}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-xs">Single page</span>
                                <Switch
                                    aria-label="Toggle view mode"
                                    isSelected={viewMode === 'all'}
                                    size="sm"
                                    onValueChange={(isSelected) => {
                                        setViewMode(isSelected ? 'all' : 'single');
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
            <CardContent ref={containerRef} className="flex flex-1 flex-col overflow-auto p-4">
                {error ? (
                    <div className="text-destructive text-center">
                        <p>{error}</p>
                    </div>
                ) : (
                    fileUrl && (
                        <div className="flex flex-col items-center gap-4">
                            <Document
                                file={fileUrl}
                                loading={
                                    <div className="text-muted-foreground">Loading PDF...</div>
                                }
                                onLoadError={onDocumentLoadError}
                                onLoadSuccess={onDocumentLoadSuccess}
                            >
                                {viewMode === 'single' ? (
                                    <Page
                                        className="max-w-full"
                                        pageNumber={pageNumber}
                                        renderAnnotationLayer={true}
                                        renderTextLayer={true}
                                        scale={scale}
                                        onLoadSuccess={onPageLoadSuccess}
                                    />
                                ) : (
                                    numPages &&
                                    Array.from(new Array(numPages), (el, index) => (
                                        <Page
                                            key={`page_${index + 1}`}
                                            className="max-w-full"
                                            pageNumber={index + 1}
                                            renderAnnotationLayer={true}
                                            renderTextLayer={true}
                                            scale={scale}
                                            onLoadSuccess={onPageLoadSuccess}
                                        />
                                    ))
                                )}
                            </Document>
                        </div>
                    )
                )}
            </CardContent>
        </Card>
    );
}
