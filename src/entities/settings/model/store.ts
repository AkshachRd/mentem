import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AiModelPreference = 'auto' | 'thinking' | 'flesh';

export type SettingsState = {
    enableAnimations: boolean;
    compactTables: boolean;
    aiModel: AiModelPreference;
    autoGenerateTags: boolean;
    destinationDir: string | null;
    selectedPdfPath: string | null;
    selectedPdfPaths: string[];
    newCardsPerDay: number;
    desiredRetention: number;
    fsrsParameters: number[] | null;
    lastOptimizedAt: number | null;
    setEnableAnimations: (value: boolean) => void;
    setCompactTables: (value: boolean) => void;
    setAiModel: (value: AiModelPreference) => void;
    setAutoGenerateTags: (value: boolean) => void;
    setDestinationDir: (path: string | null) => void;
    setSelectedPdfPath: (path: string | null) => void;
    addPdfPaths: (paths: string[]) => void;
    removePdfPath: (path: string) => void;
    clearPdfPaths: () => void;
    setNewCardsPerDay: (value: number) => void;
    setDesiredRetention: (value: number) => void;
    setFsrsParameters: (params: number[] | null) => void;
    setLastOptimizedAt: (ts: number | null) => void;
    reset: () => void;
};

const defaultState = {
    enableAnimations: true,
    compactTables: false,
    aiModel: 'auto' as AiModelPreference,
    autoGenerateTags: true,
    destinationDir: null as string | null,
    selectedPdfPath: null as string | null,
    selectedPdfPaths: [] as string[],
    newCardsPerDay: 20,
    desiredRetention: 0.9,
    fsrsParameters: null as number[] | null,
    lastOptimizedAt: null as number | null,
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            ...defaultState,
            setEnableAnimations: (value) => set(() => ({ enableAnimations: value })),
            setCompactTables: (value) => set(() => ({ compactTables: value })),
            setAiModel: (value) => set(() => ({ aiModel: value })),
            setAutoGenerateTags: (value) => set(() => ({ autoGenerateTags: value })),
            setDestinationDir: (path) => set(() => ({ destinationDir: path })),
            setSelectedPdfPath: (path) => set(() => ({ selectedPdfPath: path })),
            addPdfPaths: (paths) =>
                set((state) => {
                    const newPaths = paths.filter((path) => !state.selectedPdfPaths.includes(path));
                    const updatedPaths = [...state.selectedPdfPaths, ...newPaths];

                    return {
                        selectedPdfPaths: updatedPaths,
                        selectedPdfPath:
                            updatedPaths.length > 0 && !state.selectedPdfPath
                                ? updatedPaths[0]
                                : state.selectedPdfPath,
                    };
                }),
            removePdfPath: (path) =>
                set((state) => {
                    const updatedPaths = state.selectedPdfPaths.filter((p) => p !== path);

                    return {
                        selectedPdfPaths: updatedPaths,
                        selectedPdfPath:
                            state.selectedPdfPath === path
                                ? updatedPaths[0] || null
                                : state.selectedPdfPath,
                    };
                }),
            clearPdfPaths: () => set(() => ({ selectedPdfPaths: [], selectedPdfPath: null })),
            setNewCardsPerDay: (value) => set(() => ({ newCardsPerDay: value })),
            setDesiredRetention: (value) => set(() => ({ desiredRetention: value })),
            setFsrsParameters: (params) => set(() => ({ fsrsParameters: params })),
            setLastOptimizedAt: (ts) => set(() => ({ lastOptimizedAt: ts })),
            reset: () => set(() => ({ ...defaultState })),
        }),
        {
            name: 'app-settings',
            version: 1,
        },
    ),
);
