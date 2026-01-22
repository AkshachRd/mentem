'use client';

import { FileSelector } from './file-selector';
import { PdfViewer } from './pdf-viewer';

import { ChatPanel } from '@/entities/ai/ui/chatPanel';
import { useSettingsStore } from '@/entities/settings';

export function ReadingPage() {
    const selectedPdfPath = useSettingsStore((state) => state.selectedPdfPath);
    const selectedPdfPaths = useSettingsStore((state) => state.selectedPdfPaths);
    const setSelectedPdfPath = useSettingsStore((state) => state.setSelectedPdfPath);
    const addPdfPaths = useSettingsStore((state) => state.addPdfPaths);
    const removePdfPath = useSettingsStore((state) => state.removePdfPath);
    const clearPdfPaths = useSettingsStore((state) => state.clearPdfPaths);

    const handleFilesAdd = (filePaths: string[]) => {
        addPdfPaths(filePaths);
    };

    const handleFileSelect = (filePath: string) => {
        setSelectedPdfPath(filePath);
    };

    const handleFileRemove = (filePath: string) => {
        removePdfPath(filePath);
    };

    const handleClearAll = () => {
        clearPdfPaths();
    };

    return (
        <div className="flex h-screen w-full gap-4 p-4">
            <div className="w-60 flex-shrink-0">
                <FileSelector
                    currentFilePath={selectedPdfPath}
                    selectedFilePaths={selectedPdfPaths}
                    onClearAll={handleClearAll}
                    onFileRemove={handleFileRemove}
                    onFileSelect={handleFileSelect}
                    onFilesAdd={handleFilesAdd}
                />
            </div>
            <div className="min-w-0 flex-1">
                <PdfViewer filePath={selectedPdfPath} />
            </div>
            <div className="w-60 flex-shrink-0">
                <ChatPanel />
            </div>
        </div>
    );
}
