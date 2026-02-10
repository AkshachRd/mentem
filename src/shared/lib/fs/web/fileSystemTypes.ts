export interface DirectoryHandle {
    name: string;
    kind: 'file' | 'directory';
    isDirectory: boolean;
    getFile?(fileName: string, options?: { create?: boolean }): Promise<File>;
    getDirectoryHandle?(
        subDirectoryName: string,
        options?: { create?: boolean },
    ): Promise<DirectoryHandle>;
    values?(): AsyncIterableIterator<DirectoryEntry>;
}

export interface DirectoryEntry {
    name: string;
    kind: 'file' | 'directory';
    isDirectory: boolean;
}

export interface FileSystemOptions {
    persistent: boolean;
    mode?: 'readwrite' | 'read';
}

export interface FileSystemAccessError extends Error {
    name: 'NotAllowedError' | 'SecurityError' | 'NotFoundError' | 'AbortError';
    message: string;
    showError: (message: string) => void;
}
