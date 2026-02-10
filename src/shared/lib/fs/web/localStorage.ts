const STORAGE_KEY = 'mentem_data';
const FILES_KEY = 'mentem_files';
const PERSISTENT_DIR_KEY = 'mentem_persistent_dir';

export type StorageFile = {
    name: string;
    content: string;
    size: number;
    mimeType?: string;
};

type StorageData = {
    files: Record<string, StorageFile>;
    lastModified: number;
};

let storageData: StorageData | null = null;

export function getStorageData(): StorageData | null {
    if (storageData) return storageData;

    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        storageData = raw
            ? JSON.parse(raw)
            : {
                  files: {},
                  lastModified: Date.now(),
              };
    } catch (error) {
        console.error('Failed to load storage data:', error);
        storageData = {
            files: {},
            lastModified: Date.now(),
        };
    }

    return storageData;
}

export function saveStorageData(data: StorageData): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        storageData = data;
    } catch (error) {
        console.error('Failed to save storage data:', error);
        throw new Error('Storage is full or disabled');
    }
}

export function getFilesIndex(): Record<string, StorageFile> {
    const data = getStorageData();

    return data?.files || {};
}

export function updateFileIndex(fileName: string, file: StorageFile): void {
    const data = getStorageData();

    if (!data) return;

    data.files[fileName] = file;
    data.lastModified = Date.now();
    saveStorageData(data);
}

export function removeFileIndex(fileName: string): void {
    const data = getStorageData();

    if (!data) return;

    delete data.files[fileName];
    data.lastModified = Date.now();
    saveStorageData(data);
}

export function clearAll(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
        storageData = null;
    } catch (error) {
        console.error('Failed to clear storage:', error);
    }
}

export function getStorageSize(): number {
    const data = getStorageData();

    if (!data) return 0;

    let totalSize = 0;

    for (const fileName in data.files) {
        totalSize += data.files[fileName].size;
    }

    return totalSize;
}

export const formatStorageSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const MAX_STORAGE_BYTES = 5 * 1024 * 1024 * 1024;
