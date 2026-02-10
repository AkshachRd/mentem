export type FileSystemClient = {
    getDataRoot(): Promise<string>;
    getMemoriesDir(): Promise<string>;
    getCollectionDir(collection: 'memories' | 'tags'): Promise<string>;
    writeMarkdownFile(dir: string, fileName: string, content: string): Promise<string>;
    readMarkdownFile(dir: string, fileName: string): Promise<string>;
    listFiles(dir: string): Promise<Array<{ name: string }>>;
    deleteFile(dir: string, fileName: string): Promise<void>;
    fileExists(dir: string, fileName: string): Promise<boolean>;
    getFileSize(fileName: string): Promise<number>;
};
