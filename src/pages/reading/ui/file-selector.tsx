'use client';

import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';

type FileSelectorProps = {
    onFileSelect: (filePath: string) => void;
};

export function FileSelector({ onFileSelect }: FileSelectorProps) {
    const [selectedFile, setSelectedFile] = useState<string | null>(null);

    const handleSelectFile = async () => {
        try {
            const selected = await open({
                filters: [
                    {
                        name: 'PDF',
                        extensions: ['pdf'],
                    },
                ],
                multiple: false,
            });

            if (typeof selected === 'string') {
                setSelectedFile(selected);
                onFileSelect(selected);
            }
        } catch (error) {
            console.error('Failed to open file dialog', error);
        }
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Select PDF File</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Button onClick={handleSelectFile} className="w-full">
                    Choose PDF File
                </Button>
                {selectedFile && (
                    <div className="text-xs text-muted-foreground break-words">
                        <div className="font-medium mb-1">Selected:</div>
                        <div className="truncate" title={selectedFile}>
                            {selectedFile.split(/[/\\]/).pop()}
                        </div>
                        <div className="text-xs opacity-70 mt-1 truncate" title={selectedFile}>
                            {selectedFile}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
