import type { FileSystemClient } from './types';

import * as fs from './localStorage';
import { getPersistentDirectory, requestPersistentDirectory } from './fileSystem';

let dataRoot: string | null = null;
let memoriesDir: string | null = null;

async function ensurePersistentDirectory(): Promise<string> {
    if (dataRoot) {
        return dataRoot;
    }

    const dirHandle = await getPersistentDirectory();

    if (!dirHandle) {
        try {
            dataRoot = await requestPersistentDirectory();
        } catch (error: any) {
            if (error.message.includes('File System Access API is not supported')) {
                throw new Error(
                    'File System Access API is required but not supported. ' +
                        'Please use Chrome 86+, Firefox 77+, or Safari 15.4+',
                );
            }
            throw error;
        }
    } else {
        dataRoot = dirHandle.name;
    }

    return dataRoot;
}

async function ensureCollectionDir(collection: 'memories' | 'tags'): Promise<string> {
    if (memoriesDir && collection === 'memories') {
        return memoriesDir;
    }

    const root = await ensurePersistentDirectory();

    if (collection === 'memories') {
        memoriesDir = `${root}/memories`;
    }

    return memoriesDir || root;
}

export async function getDataRoot(): Promise<string> {
    return ensurePersistentDirectory();
}

export async function getMemoriesDir(): Promise<string> {
    return ensureCollectionDir('memories');
}

export async function getCollectionDir(collection: 'memories' | 'tags'): Promise<string> {
    return ensureCollectionDir(collection);
}

export async function writeMarkdownFile(
    dir: string,
    fileName: string,
    content: string,
): Promise<string> {
    const fullDir = await ensureCollectionDir(dir === 'memories' ? 'memories' : 'tags');
    const filePath = `${fullDir}/${fileName}`;

    try {
        const handle = await getPersistentDirectory();

        if (!handle || !handle.getFile || !handle.getDirectoryHandle) {
            throw new Error('File system not properly initialized');
        }

        const fileHandle = await handle.getFile(filePath, { create: true });
        const writable = await (fileHandle as any).createWritable();

        await writable.write(content);
        await writable.close();

        return filePath;
    } catch (error: any) {
        throw new Error(`Failed to write file: ${error.message}`);
    }
}

export async function readMarkdownFile(dir: string, fileName: string): Promise<string> {
    const fullDir = await ensureCollectionDir(dir === 'memories' ? 'memories' : 'tags');
    const filePath = `${fullDir}/${fileName}`;

    try {
        const handle = await getPersistentDirectory();

        if (!handle || !handle.getFile) {
            throw new Error('File system not properly initialized');
        }

        const file = await handle.getFile(filePath, { create: false });

        return await file.text();
    } catch (error: any) {
        if (error.name === 'NotFoundError') {
            return '';
        }
        throw new Error(`Failed to read file: ${error.message}`);
    }
}

export async function listFiles(dir: string): Promise<Array<{ name: string }>> {
    const fullDir = await ensureCollectionDir(dir === 'memories' ? 'memories' : 'tags');
    const filePath = `${fullDir}/*.md`;

    try {
        const handle = await getPersistentDirectory();

        if (!handle || !handle.values) {
            throw new Error('File system not properly initialized');
        }

        const files: Array<{ name: string }> = [];
        const values = handle.values();

        for await (const entry of values) {
            if (entry.name.endsWith('.md')) {
                files.push({ name: entry.name });
            }
        }

        return files;
    } catch (error: any) {
        throw new Error(`Failed to list files: ${error.message}`);
    }
}

export async function deleteFile(dir: string, fileName: string): Promise<void> {
    const fullDir = await ensureCollectionDir(dir === 'memories' ? 'memories' : 'tags');
    const filePath = `${fullDir}/${fileName}`;

    try {
        const handle = await getPersistentDirectory();

        if (!handle || !handle.getFile) {
            throw new Error('File system not properly initialized');
        }

        const fileHandle = await handle.getFile(filePath, { create: false });

        if ((fileHandle as any).remove) {
            await (fileHandle as any).remove();
        }
    } catch (error: any) {
        if (error.name === 'NotFoundError') {
            return;
        }
        throw new Error(`Failed to delete file: ${error.message}`);
    }
}

export async function fileExists(dir: string, fileName: string): Promise<boolean> {
    const fullDir = await ensureCollectionDir(dir === 'memories' ? 'memories' : 'tags');
    const filePath = `${fullDir}/${fileName}`;

    try {
        const handle = await getPersistentDirectory();

        if (!handle || !handle.getFile) {
            return false;
        }

        await handle.getFile(filePath, { create: false });

        return true;
    } catch (error: any) {
        if (error.name === 'NotFoundError') {
            return false;
        }
        throw new Error(`Failed to check file existence: ${error.message}`);
    }
}

export async function getFileSize(fileName: string): Promise<number> {
    const storageData = fs.getStorageData();

    if (!storageData) return 0;

    const file = storageData.files[fileName];

    if (!file) {
        return 0;
    }

    return file.size;
}

export const fsClient: FileSystemClient = {
    getDataRoot,
    getMemoriesDir,
    getCollectionDir,
    writeMarkdownFile,
    readMarkdownFile,
    listFiles,
    deleteFile,
    fileExists,
    getFileSize,
};

export default fsClient;
