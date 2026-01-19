'use client';

import { useState } from 'react';

import { FileSelector } from './file-selector';
import { PdfViewer } from './pdf-viewer';

export function ReadingPage() {
    const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

    const handleFileSelect = (filePath: string) => {
        setSelectedFilePath(filePath);
    };

    return (
        <div className="flex h-screen w-full gap-4 p-4">
            <div className="w-80 flex-shrink-0">
                <FileSelector onFileSelect={handleFileSelect} />
            </div>
            <div className="min-w-0 flex-1">
                <PdfViewer filePath={selectedFilePath} />
            </div>
        </div>
    );
}
