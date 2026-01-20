'use client';

import { open } from '@tauri-apps/plugin-dialog';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';

type FileSelectorProps = {
    onFileSelect: (filePath: string) => void;
    selectedFilePath: string | null;
};

export function FileSelector({ onFileSelect, selectedFilePath }: FileSelectorProps) {
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
                <Button className="w-full" onClick={handleSelectFile}>
                    Choose PDF File
                </Button>
                {selectedFilePath && (
                    <div className="text-muted-foreground text-xs break-words">
                        <div className="mb-1 font-medium">Selected:</div>
                        <div className="truncate" title={selectedFilePath}>
                            {selectedFilePath.split(/[/\\]/).pop()}
                        </div>
                        <div className="mt-1 truncate text-xs opacity-70" title={selectedFilePath}>
                            {selectedFilePath}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
