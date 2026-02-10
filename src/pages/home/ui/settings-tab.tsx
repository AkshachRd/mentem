'use client';

import { useSettingsStore } from '@/entities/settings/model/store';
import { Switch } from '@/shared/ui/switch';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

export function SettingsTab() {
    const enableAnimations = useSettingsStore((s) => s.enableAnimations);
    const compactTables = useSettingsStore((s) => s.compactTables);
    const aiModel = useSettingsStore((s) => s.aiModel);
    const destinationDir = useSettingsStore((s) => s.destinationDir);
    const setEnableAnimations = useSettingsStore((s) => s.setEnableAnimations);
    const setCompactTables = useSettingsStore((s) => s.setCompactTables);
    const setAiModel = useSettingsStore((s) => s.setAiModel);
    const setDestinationDir = useSettingsStore((s) => s.setDestinationDir);
    const reset = useSettingsStore((s) => s.reset);

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
            <Card>
                <CardContent className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Enable animations</span>
                            <span className="text-muted-foreground text-xs">
                                Toggle UI animations and motion effects
                            </span>
                        </div>
                        <Switch
                            aria-label="Enable animations"
                            checked={enableAnimations}
                            onCheckedChange={setEnableAnimations}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Compact tables</span>
                            <span className="text-muted-foreground text-xs">
                                Reduce padding and row height in tables
                            </span>
                        </div>
                        <Switch
                            aria-label="Compact tables"
                            checked={compactTables}
                            onCheckedChange={setCompactTables}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">AI model preference</span>
                            <span className="text-muted-foreground text-xs">
                                Choose the default model behavior for AI tasks
                            </span>
                        </div>
                        <Select
                            value={aiModel}
                            onValueChange={(value) => {
                                setAiModel(value as 'auto' | 'thinking' | 'flesh');
                            }}
                        >
                            <SelectTrigger aria-label="AI model preference" className="max-w-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="auto">Auto</SelectItem>
                                <SelectItem value="thinking">Thinking</SelectItem>
                                <SelectItem value="flesh">Flesh</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex max-w-md flex-col">
                            <span className="text-sm font-medium">Destination folder</span>
                            <span className="text-muted-foreground text-xs">
                                Choose where Mentem will store exported or generated files
                            </span>
                            <span className="text-muted-foreground truncate text-xs">
                                {destinationDir ?? 'Not set'}
                            </span>
                        </div>
                        <Button
                            aria-label="Choose destination folder"
                            className="size-8"
                            variant="outline"
                            onClick={async () => {
                                try {
                                    if (
                                        typeof window !== 'undefined' &&
                                        'showDirectoryPicker' in window
                                    ) {
                                        const handle = await (window as any).showDirectoryPicker({
                                            persistent: true,
                                            mode: 'readwrite',
                                        });

                                        if (handle.name) {
                                            setDestinationDir(handle.name);
                                        }
                                    } else {
                                        alert(
                                            'File System Access API is not supported in this browser. Please use Chrome 86+, Firefox 77+, or Safari 15.4+',
                                        );
                                    }
                                } catch (error) {
                                    console.error('Failed to open destination folder', error);
                                }
                            }}
                        >
                            Choose folder
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <button
                    className="rounded-medium bg-danger text-danger-foreground px-3 py-2 text-sm font-medium"
                    type="button"
                    onClick={reset}
                >
                    Reset to defaults
                </button>
            </div>
        </div>
    );
}
