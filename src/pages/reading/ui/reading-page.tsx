'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';

import { FileSelector } from './file-selector';

import { ChatPanel } from '@/entities/ai/ui/chatPanel';
import { useSettingsStore } from '@/entities/settings';
import { Card } from '@/shared/ui/shadcn/card';
import { Button } from '@/shared/ui/button';

const PdfViewer = dynamic(() => import('./pdf-viewer').then((mod) => mod.PdfViewer), {
    ssr: false,
    loading: () => (
        <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Loading PDF viewer...</p>
        </div>
    ),
});

export function ReadingPage() {
    const selectedPdfPath = useSettingsStore((state) => state.selectedPdfPath);
    const selectedPdfPaths = useSettingsStore((state) => state.selectedPdfPaths);
    const setSelectedPdfPath = useSettingsStore((state) => state.setSelectedPdfPath);
    const addPdfPaths = useSettingsStore((state) => state.addPdfPaths);
    const removePdfPath = useSettingsStore((state) => state.removePdfPath);
    const clearPdfPaths = useSettingsStore((state) => state.clearPdfPaths);

    const [isFileSelectorOpen, setIsFileSelectorOpen] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(true);

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
        <div className="flex h-[calc(100vh-7.5rem)] w-full gap-4 p-4">
            <div
                className="flex-shrink-0 overflow-hidden transition-[width] duration-300"
                style={{ width: isFileSelectorOpen ? '15rem' : '2.5rem' }}
            >
                {isFileSelectorOpen ? (
                    <FileSelector
                        currentFilePath={selectedPdfPath}
                        selectedFilePaths={selectedPdfPaths}
                        onClearAll={handleClearAll}
                        onCollapse={() => setIsFileSelectorOpen(false)}
                        onFileRemove={handleFileRemove}
                        onFileSelect={handleFileSelect}
                        onFilesAdd={handleFilesAdd}
                    />
                ) : (
                    <Card className="flex h-full w-10 flex-col items-center gap-2 py-2">
                        <Button
                            className="h-7 w-7 flex-shrink-0"
                            size="icon"
                            variant="ghost"
                            onClick={() => setIsFileSelectorOpen(true)}
                        >
                            <PanelLeftOpen className="h-4 w-4" />
                        </Button>
                        <span
                            className="text-muted-foreground text-xs font-medium whitespace-nowrap"
                            style={{ writingMode: 'vertical-rl' }}
                        >
                            PDF Files
                        </span>
                    </Card>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <PdfViewer
                    filePath={selectedPdfPath}
                    panelState={`${isFileSelectorOpen}-${isChatOpen}`}
                />
            </div>
            <div
                className="flex-shrink-0 overflow-hidden transition-[width] duration-300"
                style={{ width: isChatOpen ? '20rem' : '2.5rem' }}
            >
                {isChatOpen ? (
                    <ChatPanel onCollapse={() => setIsChatOpen(false)} />
                ) : (
                    <Card className="flex h-full w-10 flex-col items-center gap-2 py-2">
                        <Button
                            className="h-7 w-7 flex-shrink-0"
                            size="icon"
                            variant="ghost"
                            onClick={() => setIsChatOpen(true)}
                        >
                            <PanelRightOpen className="h-4 w-4" />
                        </Button>
                        <span
                            className="text-muted-foreground text-xs font-medium whitespace-nowrap"
                            style={{ writingMode: 'vertical-rl' }}
                        >
                            AI Ассистент
                        </span>
                    </Card>
                )}
            </div>
        </div>
    );
}
