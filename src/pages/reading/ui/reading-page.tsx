'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { FileText, MessageSquare, PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import { toast } from 'sonner';

import { FileSelector } from './file-selector';

import { ChatPanel } from '@/entities/ai/ui/chatPanel';
import { useSettingsStore } from '@/entities/settings';
import { Card } from '@/shared/ui/shadcn/card';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

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
    const [mobilePanel, setMobilePanel] = useState<'files' | 'chat' | null>(null);

    const handleFilesAdd = (filePaths: string[]) => {
        addPdfPaths(filePaths);
    };

    const handleFileSelect = (filePath: string) => {
        setSelectedPdfPath(filePath);
    };

    const handleFileRemove = (filePath: string) => {
        removePdfPath(filePath);

        const fileName =
            filePath
                .split(/[/\\]/)
                .pop()
                ?.replace(/\.[^.]+$/, '') || filePath;

        toast(`«${fileName}» удалён`, {
            action: {
                label: 'Отменить',
                onClick: () => addPdfPaths([filePath]),
            },
        });
    };

    const handleClearAll = () => {
        clearPdfPaths();
    };

    return (
        <div className="relative flex h-[calc(100vh-7.5rem)] w-full flex-col gap-2 p-2 md:flex-row md:gap-4 md:p-4">
            <div className="bg-card flex min-h-10 items-center gap-2 border px-2 md:hidden">
                <Button
                    className="h-8 gap-1"
                    size="sm"
                    variant="outline"
                    onClick={() => setMobilePanel('files')}
                >
                    <FileText className="h-4 w-4" />
                    Files
                </Button>
                <div className="min-w-0 flex-1 text-center">
                    <p className="truncate text-xs font-medium">
                        {selectedPdfPath ? selectedPdfPath.split(/[/\\]/).pop() : 'No PDF selected'}
                    </p>
                </div>
                <Button
                    className="h-8 gap-1"
                    size="sm"
                    variant="outline"
                    onClick={() => setMobilePanel('chat')}
                >
                    <MessageSquare className="h-4 w-4" />
                    AI
                </Button>
            </div>

            <div
                className="hidden flex-shrink-0 overflow-hidden transition-[width] duration-300 md:block"
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
                            Files
                        </span>
                    </Card>
                )}
            </div>
            <div className="min-h-0 flex-1 md:min-w-0">
                <PdfViewer
                    filePath={selectedPdfPath}
                    panelState={`${isFileSelectorOpen}-${isChatOpen}`}
                />
            </div>
            <div
                className="hidden flex-shrink-0 overflow-hidden transition-[width] duration-300 md:block"
                style={{ width: isChatOpen ? '20rem' : '2.5rem' }}
            >
                {isChatOpen ? (
                    <ChatPanel
                        bookFileName={selectedPdfPath?.split(/[/\\]/).pop() ?? undefined}
                        onCollapse={() => setIsChatOpen(false)}
                    />
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
                            AI Assistant
                        </span>
                    </Card>
                )}
            </div>

            <div
                className={cn(
                    'bg-background/80 absolute inset-0 z-[60] p-2 backdrop-blur-sm md:hidden',
                    mobilePanel ? 'block' : 'hidden',
                )}
            >
                <div aria-modal="true" className="h-full" role="dialog">
                    {mobilePanel === 'files' && (
                        <FileSelector
                            currentFilePath={selectedPdfPath}
                            selectedFilePaths={selectedPdfPaths}
                            onClearAll={handleClearAll}
                            onCollapse={() => setMobilePanel(null)}
                            onFileRemove={handleFileRemove}
                            onFileSelect={(filePath) => {
                                handleFileSelect(filePath);
                                setMobilePanel(null);
                            }}
                            onFilesAdd={handleFilesAdd}
                        />
                    )}
                    {mobilePanel === 'chat' && (
                        <ChatPanel
                            bookFileName={selectedPdfPath?.split(/[/\\]/).pop() ?? undefined}
                            onCollapse={() => setMobilePanel(null)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
