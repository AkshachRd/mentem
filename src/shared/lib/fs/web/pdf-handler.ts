import type { PdfFile } from './types';

import * as pdfjsLib from 'pdfjs-dist';

type TextItem = {
    str: string;
    transform: number[];
    height?: number;
};

export async function parsePdfFile(file: File): Promise<PdfFile> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const textPages: PdfFile['textPages'] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        const text = textContent.items
            .filter((item: any) => item.str)
            .map((item: TextItem) => item.str)
            .join(' ')
            .trim();

        textPages.push({
            pageNumber,
            text,
            lines: textContent.items
                .filter((item: any) => item.str)
                .map((item: TextItem) => ({
                    text: item.str,
                    y: (item.transform[5] || 0) / 72,
                })),
        });
    }

    return {
        fileName: file.name,
        content: file.name,
        title: file.name.replace(/\.(pdf|PDF)$/i, ''),
        totalPages,
        textPages,
    };
}

export async function extractTextFromPdf(file: File): Promise<string> {
    const pdf = await parsePdfFile(file);

    return pdf.textPages.map((page) => page.text).join('\n\n');
}

export async function getPdfFromData(data: Uint8Array): Promise<PdfFile> {
    const loadingTask = pdfjsLib.getDocument({ data });

    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const textPages: PdfFile['textPages'] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        const text = textContent.items
            .filter((item: any) => item.str)
            .map((item: TextItem) => item.str)
            .join(' ')
            .trim();

        textPages.push({
            pageNumber,
            text,
            lines: textContent.items
                .filter((item: any) => item.str)
                .map((item: TextItem) => ({
                    text: item.str,
                    y: (item.transform[5] || 0) / 72,
                })),
        });
    }

    return {
        fileName: 'document.pdf',
        content: '',
        title: 'document',
        totalPages,
        textPages,
    };
}

export async function getDocumentTitle(fileName: string): Promise<string> {
    return fileName.replace(/\.(pdf|PDF)$/i, '');
}

export function formatPdfStats(pageCount: number, linesCount: number): string {
    return `${pageCount} pages, ${linesCount} lines`;
}

export const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024;

export function isPdfFileSupported(fileName: string): boolean {
    return /\.(pdf|PDF)$/i.test(fileName);
}
