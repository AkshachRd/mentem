import type { SrsRating } from '../model/srs-types';

import { appendTextFile, getDataRoot } from '@/shared/lib/fs';

export type ReviewLogEntry = {
    cardId: string;
    rating: SrsRating;
    date: string;
    elapsed: number;
    state: string;
    timestamp: number;
};

async function getLogPath(): Promise<string> {
    const { join } = await import('@tauri-apps/api/path');
    const root = await getDataRoot();

    return await join(root, 'reviews.jsonl');
}

export async function appendReviewLog(entry: ReviewLogEntry): Promise<void> {
    const path = await getLogPath();
    const line = JSON.stringify(entry) + '\n';

    await appendTextFile(path, line);
}

export async function readReviewLogRaw(): Promise<string> {
    try {
        const { invoke } = await import('@tauri-apps/api/core');
        const path = await getLogPath();

        return await invoke<string>('fs_any_read_text_file', { path });
    } catch {
        return '';
    }
}

export async function readReviewLog(): Promise<ReviewLogEntry[]> {
    try {
        const { invoke } = await import('@tauri-apps/api/core');
        const path = await getLogPath();
        const content = await invoke<string>('fs_any_read_text_file', { path });

        return content
            .split('\n')
            .filter((line) => line.trim())
            .map((line) => JSON.parse(line) as ReviewLogEntry);
    } catch {
        return [];
    }
}
