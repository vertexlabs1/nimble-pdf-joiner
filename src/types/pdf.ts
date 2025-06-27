
export interface PDFPageInfo {
  pageNumber: number;
  thumbnail: string; // data URL
  width: number;
  height: number;
}

export interface PDFFileWithPages {
  originalFile: File;
  pageCount: number;
  pages: PDFPageInfo[];
  isModified: boolean;
  pdfDocument?: any; // PDFDocument from pdf-lib
}

export interface PageEditAction {
  type: 'replace' | 'remove';
  targetFileIndex: number;
  targetPageIndex: number;
  sourceFileIndex?: number;
  sourcePageIndex?: number;
}
