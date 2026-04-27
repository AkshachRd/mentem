'use client';

import { open } from '@tauri-apps/plugin-dialog';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { FolderOpen, PanelLeftClose, Trash2 } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from '@/shared/ui/shadcn/context-menu';
import { ScrollArea } from '@/shared/ui/scroll-area';

type FileSelectorProps = {
    onFilesAdd: (filePaths: string[]) => void;
    onFileSelect: (filePath: string) => void;
    onFileRemove: (filePath: string) => void;
    onClearAll: () => void;
    onCollapse?: () => void;
    selectedFilePaths: string[];
    currentFilePath: string | null;
};

export function FileSelector({
    onFilesAdd,
    onFileSelect,
    onFileRemove,
    onClearAll,
    onCollapse,
    selectedFilePaths,
    currentFilePath,
}: FileSelectorProps) {
    const handleSelectFiles = async () => {
        try {
            const selected = await open({
                filters: [
                    {
                        name: 'PDF',
                        extensions: ['pdf'],
                    },
                ],
                multiple: true,
            });

            if (selected) {
                const paths = Array.isArray(selected) ? selected : [selected];

                onFilesAdd(paths);
            }
        } catch (error) {
            console.error('Failed to open file dialog', error);
        }
    };

    const getFileName = (path: string) => {
        const name = path.split(/[/\\]/).pop() || path;
        return name.replace(/\.[^.]+$/, '');
    };

    return (
        <Card className="flex h-full flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Files</CardTitle>
                {onCollapse && (
                    <Button className="h-7 w-7" size="icon" variant="ghost" onClick={onCollapse}>
                        <PanelLeftClose className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
                <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleSelectFiles}>
                        Add PDF Files
                    </Button>
                    {selectedFilePaths.length > 0 && (
                        <Button variant="outline" onClick={onClearAll}>
                            Clear All
                        </Button>
                    )}
                </div>

                {selectedFilePaths.length > 0 ? (
                    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
                        <ScrollArea className="flex-1">
                            <div className="flex flex-col gap-2 pr-4">
                                {selectedFilePaths.map((path) => (
                                    <ContextMenu key={path}>
                                        <ContextMenuTrigger
                                            className={`flex items-center rounded-md border p-3 transition-colors ${
                                                currentFilePath === path
                                                    ? 'border-primary bg-primary/10'
                                                    : 'hover:bg-muted border-border cursor-pointer'
                                            }`}
                                            onClick={() => onFileSelect(path)}
                                        >
                                            <div
                                                className="min-w-0 flex-1 truncate text-sm font-medium"
                                                title={getFileName(path)}
                                            >
                                                {getFileName(path)}
                                            </div>
                                        </ContextMenuTrigger>
                                        <ContextMenuContent>
                                            <ContextMenuItem
                                                onClick={() => revealItemInDir(path)}
                                            >
                                                <FolderOpen className="mr-2 h-4 w-4" />
                                                Show in Explorer
                                            </ContextMenuItem>
                                            <ContextMenuItem
                                                onClick={() => onFileRemove(path)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Remove
                                            </ContextMenuItem>
                                        </ContextMenuContent>
                                    </ContextMenu>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                ) : (
                    <div className="text-muted-foreground flex flex-1 items-center justify-center text-center text-sm">
                        No files selected. Click "Add PDF Files" to get started.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
