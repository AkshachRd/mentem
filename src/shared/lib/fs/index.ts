import type { FileSystemClient } from './types';

export * from './tauri';

let fsClient: FileSystemClient | null = null;

export function getFileSystemClient(): FileSystemClient {
    if (fsClient) return fsClient;

    const isWeb = typeof window !== 'undefined' && !('TAURI' in window);

    if (isWeb) {
        const webFs = require('./web');

        fsClient = webFs.fsClient;
    } else {
        const tauriFs = require('./tauri');

        fsClient = tauriFs.fsClient;
    }

    return fsClient;
}
