'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { invoke } from '@tauri-apps/api/core';
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

export function PdfViewer({ filePath }: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);

    useEffect(() => {
        if (filePath) {
            setPageNumber(1);
            setNumPages(null);
            setError(null);
            setFileUrl(null);

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
                </div>
            </CardHeader>
            <CardContent className="flex flex-1 items-center justify-center overflow-auto p-4">
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
                                <Page
                                    className="max-w-full"
                                    pageNumber={pageNumber}
                                    renderAnnotationLayer={true}
                                    renderTextLayer={true}
                                />
                            </Document>
                        </div>
                    )
                )}
            </CardContent>
        </Card>
    );
}
