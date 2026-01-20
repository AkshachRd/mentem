import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AiModelPreference = 'auto' | 'thinking' | 'flesh';

export type SettingsState = {
    enableAnimations: boolean;
    compactTables: boolean;
    aiModel: AiModelPreference;
    destinationDir: string | null;
    selectedPdfPath: string | null;
    setEnableAnimations: (value: boolean) => void;
    setCompactTables: (value: boolean) => void;
    setAiModel: (value: AiModelPreference) => void;
    setDestinationDir: (path: string | null) => void;
    setSelectedPdfPath: (path: string | null) => void;
    reset: () => void;
};

const defaultState = {
    enableAnimations: true,
    compactTables: false,
    aiModel: 'auto' as AiModelPreference,
    destinationDir: null as string | null,
    selectedPdfPath: null as string | null,
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            ...defaultState,
            setEnableAnimations: (value) => set(() => ({ enableAnimations: value })),
            setCompactTables: (value) => set(() => ({ compactTables: value })),
            setAiModel: (value) => set(() => ({ aiModel: value })),
            setDestinationDir: (path) => set(() => ({ destinationDir: path })),
            setSelectedPdfPath: (path) => set(() => ({ selectedPdfPath: path })),
            reset: () => set(() => ({ ...defaultState })),
        }),
        {
            name: 'app-settings',
            version: 1,
        },
    ),
);
