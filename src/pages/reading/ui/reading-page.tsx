'use client';

import { FileSelector } from './file-selector';
import { PdfViewer } from './pdf-viewer';

import { useSettingsStore } from '@/entities/settings';

export function ReadingPage() {
    const selectedPdfPath = useSettingsStore((state) => state.selectedPdfPath);
    const setSelectedPdfPath = useSettingsStore((state) => state.setSelectedPdfPath);

    const handleFileSelect = (filePath: string) => {
        setSelectedPdfPath(filePath);
    };

    return (
        <div className="flex h-screen w-full gap-4 p-4">
            <div className="w-80 flex-shrink-0">
                <FileSelector selectedFilePath={selectedPdfPath} onFileSelect={handleFileSelect} />
            </div>
            <div className="min-w-0 flex-1">
                <PdfViewer filePath={selectedPdfPath} />
            </div>
        </div>
    );
}
