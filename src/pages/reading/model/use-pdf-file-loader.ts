'use client';

import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function usePdfFileLoader(filePath: string | null) {
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null);
    const fileUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (!filePath) return;

        setNumPages(null);
        setError(null);
        setFileUrl(null);

        const loadFile = async () => {
            try {
                const fileData = await invoke<number[]>('fs_any_read_binary_file', {
                    path: filePath,
                });
                const uint8Array = Uint8Array.from(fileData);
                const blob = new Blob([uint8Array], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                if (fileUrlRef.current) {
                    URL.revokeObjectURL(fileUrlRef.current);
                }

                fileUrlRef.current = url;
                setFileUrl(url);
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error('Error reading file:', err);
                setError('Failed to read PDF file');
            }
        };

        loadFile();

        return () => {
            if (fileUrlRef.current) {
                URL.revokeObjectURL(fileUrlRef.current);
                fileUrlRef.current = null;
            }
        };
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

    return { fileUrl, error, numPages, onDocumentLoadSuccess, onDocumentLoadError };
}
