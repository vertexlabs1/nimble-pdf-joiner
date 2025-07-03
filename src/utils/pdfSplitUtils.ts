import { PDFDocument } from 'pdf-lib';

export interface SplitResult {
  success: boolean;
  splitFiles: SplitFileInfo[];
  errors: string[];
  originalFilename: string;
}

export interface SplitFileInfo {
  filename: string;
  pdfBytes: Uint8Array;
  pageCount: number;
  startPage: number;
  endPage: number;
}

export interface SplitConfig {
  method: 'page-range' | 'specific-pages' | 'file-size' | 'individual-pages';
  pageRanges?: string;
  specificPages?: number[];
  targetSizeKB?: number;
  filenameTemplate?: string;
}

// Parse page ranges like "1-5, 8-12, 15"
export function parsePageRanges(rangeString: string, totalPages: number): number[][] {
  const ranges: number[][] = [];
  const parts = rangeString.split(',').map(s => s.trim());
  
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(s => parseInt(s.trim()));
      if (start && end && start <= end && start >= 1 && end <= totalPages) {
        ranges.push([start, end]);
      }
    } else {
      const page = parseInt(part);
      if (page >= 1 && page <= totalPages) {
        ranges.push([page, page]);
      }
    }
  }
  
  return ranges;
}

// Validate page range string
export function validatePageRanges(rangeString: string, totalPages: number): { valid: boolean; error?: string } {
  if (!rangeString.trim()) {
    return { valid: false, error: 'Page ranges cannot be empty' };
  }
  
  try {
    const ranges = parsePageRanges(rangeString, totalPages);
    if (ranges.length === 0) {
      return { valid: false, error: 'No valid page ranges found' };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid page range format' };
  }
}

// Split PDF by page ranges
async function splitByPageRanges(
  pdf: PDFDocument, 
  ranges: number[][], 
  filenameTemplate: string
): Promise<SplitFileInfo[]> {
  const splitFiles: SplitFileInfo[] = [];
  
  for (let i = 0; i < ranges.length; i++) {
    const [startPage, endPage] = ranges[i];
    const newPdf = await PDFDocument.create();
    
    // Get page indices (PDF-lib uses 0-based indexing)
    const pageIndices = Array.from(
      { length: endPage - startPage + 1 }, 
      (_, idx) => startPage - 1 + idx
    );
    
    const copiedPages = await newPdf.copyPages(pdf, pageIndices);
    copiedPages.forEach(page => newPdf.addPage(page));
    
    const pdfBytes = await newPdf.save();
    const filename = filenameTemplate
      .replace('{index}', (i + 1).toString())
      .replace('{start}', startPage.toString())
      .replace('{end}', endPage.toString())
      .replace('{pages}', `${startPage}-${endPage}`);
    
    splitFiles.push({
      filename,
      pdfBytes,
      pageCount: pageIndices.length,
      startPage,
      endPage
    });
  }
  
  return splitFiles;
}

// Split PDF by specific pages
async function splitBySpecificPages(
  pdf: PDFDocument,
  pages: number[],
  filenameTemplate: string
): Promise<SplitFileInfo[]> {
  const splitFiles: SplitFileInfo[] = [];
  
  for (let i = 0; i < pages.length; i++) {
    const pageNumber = pages[i];
    const newPdf = await PDFDocument.create();
    
    const copiedPages = await newPdf.copyPages(pdf, [pageNumber - 1]);
    copiedPages.forEach(page => newPdf.addPage(page));
    
    const pdfBytes = await newPdf.save();
    const filename = filenameTemplate
      .replace('{index}', (i + 1).toString())
      .replace('{page}', pageNumber.toString());
    
    splitFiles.push({
      filename,
      pdfBytes,
      pageCount: 1,
      startPage: pageNumber,
      endPage: pageNumber
    });
  }
  
  return splitFiles;
}

// Split PDF into individual pages
async function splitIntoIndividualPages(
  pdf: PDFDocument,
  filenameTemplate: string
): Promise<SplitFileInfo[]> {
  const splitFiles: SplitFileInfo[] = [];
  const totalPages = pdf.getPageCount();
  
  for (let i = 0; i < totalPages; i++) {
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdf, [i]);
    copiedPages.forEach(page => newPdf.addPage(page));
    
    const pdfBytes = await newPdf.save();
    const filename = filenameTemplate
      .replace('{index}', (i + 1).toString())
      .replace('{page}', (i + 1).toString());
    
    splitFiles.push({
      filename,
      pdfBytes,
      pageCount: 1,
      startPage: i + 1,
      endPage: i + 1
    });
  }
  
  return splitFiles;
}

// Split PDF by file size
async function splitByFileSize(
  pdf: PDFDocument,
  targetSizeKB: number,
  filenameTemplate: string
): Promise<SplitFileInfo[]> {
  const splitFiles: SplitFileInfo[] = [];
  const totalPages = pdf.getPageCount();
  let currentStartPage = 1;
  let splitIndex = 1;
  
  while (currentStartPage <= totalPages) {
    const newPdf = await PDFDocument.create();
    let currentEndPage = currentStartPage;
    let currentSizeKB = 0;
    
    // Add pages until we reach target size or run out of pages
    for (let pageIndex = currentStartPage - 1; pageIndex < totalPages; pageIndex++) {
      const testPdf = await PDFDocument.create();
      const copiedPages = await testPdf.copyPages(pdf, Array.from({ length: pageIndex - (currentStartPage - 1) + 1 }, (_, i) => currentStartPage - 1 + i));
      copiedPages.forEach(page => testPdf.addPage(page));
      
      const testBytes = await testPdf.save();
      const testSizeKB = testBytes.length / 1024;
      
      if (testSizeKB > targetSizeKB && currentEndPage > currentStartPage) {
        break;
      }
      
      currentEndPage = pageIndex + 1;
      currentSizeKB = testSizeKB;
      
      if (testSizeKB > targetSizeKB) {
        break;
      }
    }
    
    // Create the actual split PDF
    const pageIndices = Array.from(
      { length: currentEndPage - currentStartPage + 1 },
      (_, i) => currentStartPage - 1 + i
    );
    
    const copiedPages = await newPdf.copyPages(pdf, pageIndices);
    copiedPages.forEach(page => newPdf.addPage(page));
    
    const pdfBytes = await newPdf.save();
    const filename = filenameTemplate
      .replace('{index}', splitIndex.toString())
      .replace('{start}', currentStartPage.toString())
      .replace('{end}', currentEndPage.toString())
      .replace('{pages}', `${currentStartPage}-${currentEndPage}`);
    
    splitFiles.push({
      filename,
      pdfBytes,
      pageCount: pageIndices.length,
      startPage: currentStartPage,
      endPage: currentEndPage
    });
    
    currentStartPage = currentEndPage + 1;
    splitIndex++;
  }
  
  return splitFiles;
}

export async function splitPDF(file: File, config: SplitConfig): Promise<SplitResult> {
  console.log('Starting PDF split with config:', config);
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const totalPages = pdf.getPageCount();
    
    if (totalPages === 0) {
      return {
        success: false,
        splitFiles: [],
        errors: ['PDF file contains no pages'],
        originalFilename: file.name
      };
    }
    
    const baseFilename = file.name.replace('.pdf', '');
    const defaultTemplate = `${baseFilename}_part_{index}.pdf`;
    const filenameTemplate = config.filenameTemplate || defaultTemplate;
    
    let splitFiles: SplitFileInfo[] = [];
    
    switch (config.method) {
      case 'page-range':
        if (!config.pageRanges) {
          throw new Error('Page ranges are required for page-range split method');
        }
        const ranges = parsePageRanges(config.pageRanges, totalPages);
        if (ranges.length === 0) {
          throw new Error('No valid page ranges found');
        }
        splitFiles = await splitByPageRanges(pdf, ranges, filenameTemplate);
        break;
        
      case 'specific-pages':
        if (!config.specificPages || config.specificPages.length === 0) {
          throw new Error('Specific pages are required for specific-pages split method');
        }
        splitFiles = await splitBySpecificPages(pdf, config.specificPages, filenameTemplate);
        break;
        
      case 'file-size':
        if (!config.targetSizeKB || config.targetSizeKB <= 0) {
          throw new Error('Target file size is required for file-size split method');
        }
        splitFiles = await splitByFileSize(pdf, config.targetSizeKB, filenameTemplate);
        break;
        
      case 'individual-pages':
        splitFiles = await splitIntoIndividualPages(pdf, filenameTemplate);
        break;
        
      default:
        throw new Error('Invalid split method');
    }
    
    console.log(`PDF split completed. Created ${splitFiles.length} files`);
    
    return {
      success: true,
      splitFiles,
      errors: [],
      originalFilename: file.name
    };
    
  } catch (error) {
    console.error('Error splitting PDF:', error);
    return {
      success: false,
      splitFiles: [],
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      originalFilename: file.name
    };
  }
}