import type { DirectoryHandle } from './fileSystemTypes';

let persistentDirHandle: DirectoryHandle | null = null;

export async function requestPersistentDirectory(): Promise<DirectoryHandle> {
    if (typeof window === 'undefined') {
        throw new Error('File System Access API is not available in this environment');
    }

    if (!('showDirectoryPicker' in window)) {
        throw new Error(
            'File System Access API is not supported in this browser. ' +
                'Please use Chrome 86+, Firefox 77+, or Safari 15.4+',
        );
    }

    try {
        const options: any = {
            persistent: true,
            mode: 'readwrite',
        };

        const handle = await (window as any).showDirectoryPicker(options);

        persistentDirHandle = handle;

        return handle;
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error('Directory selection was cancelled');
        }
        throw new Error(`Failed to access file system: ${error.message || 'Unknown error'}`);
    }
}

export async function getPersistentDirectory(): Promise<DirectoryHandle | null> {
    if (persistentDirHandle) {
        return persistentDirHandle;
    }

    if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
        return null;
    }

    try {
        const savedHandle = localStorage.getItem('mentem_persistent_dir');

        if (savedHandle) {
            const handle = JSON.parse(savedHandle);

            persistentDirHandle = handle;

            return handle;
        }
    } catch (error) {
        console.error('Failed to load saved directory handle:', error);
    }

    return null;
}

export async function saveDirectoryHandle(handle: DirectoryHandle): Promise<void> {
    try {
        localStorage.setItem('mentem_persistent_dir', JSON.stringify(handle));
    } catch (error) {
        console.error('Failed to save directory handle:', error);
        throw new Error('Unable to save directory handle. Storage might be full.');
    }
}

export async function clearDirectoryHandle(): Promise<void> {
    try {
        localStorage.removeItem('mentem_persistent_dir');
        persistentDirHandle = null;
    } catch (error) {
        console.error('Failed to clear directory handle:', error);
    }
}

export async function getFileFromHandle(handle: DirectoryHandle, fileName: string): Promise<File> {
    if (!handle.getFile) {
        throw new Error('File handle does not support getFile method');
    }

    return await handle.getFile(fileName, { create: false });
}

export async function writeFileToHandle(
    handle: DirectoryHandle,
    fileName: string,
    content: string,
    type: string = 'text/plain',
): Promise<File> {
    if (!handle.getFile || !handle.getDirectoryHandle) {
        throw new Error('File handle does not support write operations');
    }

    try {
        const fileHandle = await handle.getFile(fileName, { create: true });
        const writable = await (fileHandle as any).createWritable();

        await writable.write(content);
        await writable.close();

        return fileHandle;
    } catch (error: any) {
        throw new Error(`Failed to write file: ${error.message}`);
    }
}

export async function createDirectoryHandle(
    dirName: string,
    handle: DirectoryHandle,
): Promise<DirectoryHandle> {
    if (!handle.getDirectoryHandle) {
        throw new Error('Handle does not support create directory operations');
    }

    try {
        return await handle.getDirectoryHandle(dirName, { create: true });
    } catch (error: any) {
        throw new Error(`Failed to create directory: ${error.message}`);
    }
}

export function isFileSystemAccessSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export function hasPersistentAccess(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}
