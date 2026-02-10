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

export type PdfFile = {
    fileName: string;
    content: string;
    title: string;
    totalPages: number;
    textPages: Array<{
        pageNumber: number;
        text: string;
        lines: Array<{
            text: string;
            y: number;
        }>;
    }>;
};

export type PdfTextSelection = {
    text: string;
    pageNumber: number;
    startOffset: number;
    endOffset: number;
    rect: {
        top: number;
        left: number;
        width: number;
        height: number;
    };
};
