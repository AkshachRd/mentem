import type { FileSystemClient } from './types';

export const fsClient: FileSystemClient = {
    getDataRoot: async () => {
        throw new Error(
            'File system not available in web environment. Use @/shared/lib/fs instead.',
        );
    },
    getMemoriesDir: async () => {
        throw new Error(
            'File system not available in web environment. Use @/shared/lib/fs instead.',
        );
    },
    getCollectionDir: async () => {
        throw new Error(
            'File system not available in web environment. Use @/shared/lib/fs instead.',
        );
    },
    writeMarkdownFile: async () => {
        throw new Error(
            'File system not available in web environment. Use @/shared/lib/fs instead.',
        );
    },
    readMarkdownFile: async () => {
        throw new Error(
            'File system not available in web environment. Use @/shared/lib/fs instead.',
        );
    },
    listFiles: async () => {
        throw new Error(
            'File system not available in web environment. Use @/shared/lib/fs instead.',
        );
    },
    deleteFile: async () => {
        throw new Error(
            'File system not available in web environment. Use @/shared/lib/fs instead.',
        );
    },
    fileExists: async () => {
        throw new Error(
            'File system not available in web environment. Use @/shared/lib/fs instead.',
        );
    },
    getFileSize: async () => {
        throw new Error(
            'File system not available in web environment. Use @/shared/lib/fs instead.',
        );
    },
};

export default fsClient;
