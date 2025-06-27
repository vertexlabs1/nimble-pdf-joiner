
import { PDFDocument } from 'pdf-lib';
import { PDFPageInfo, PDFFileWithPages } from '@/types/pdf';

export const generatePageThumbnails = async (file: File): Promise<PDFPageInfo[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pageCount = pdfDoc.getPageCount();
    const pages: PDFPageInfo[] = [];

    // For now, we'll create placeholder thumbnails
    // In a full implementation, you'd render each page to canvas
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      
      pages.push({
        pageNumber: i + 1,
        thumbnail: createPlaceholderThumbnail(i + 1),
        width,
        height,
      });
    }

    return pages;
  } catch (error) {
    console.error('Error generating thumbnails:', error);
    return [];
  }
};

const createPlaceholderThumbnail = (pageNumber: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 150;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Create a simple placeholder thumbnail
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 150, 200);
    ctx.strokeStyle = '#dee2e6';
    ctx.strokeRect(0, 0, 150, 200);
    
    ctx.fillStyle = '#6c757d';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Page ${pageNumber}`, 75, 100);
  }
  
  return canvas.toDataURL();
};

export const processFileWithPages = async (file: File): Promise<PDFFileWithPages> => {
  const pages = await generatePageThumbnails(file);
  
  return {
    originalFile: file,
    pageCount: pages.length,
    pages,
    isModified: false,
  };
};

export const replacePageInPDF = async (
  targetFile: PDFFileWithPages,
  targetPageIndex: number,
  sourceFile: PDFFileWithPages,
  sourcePageIndex: number
): Promise<PDFFileWithPages> => {
  try {
    // This is a simplified implementation
    // In practice, you'd use pdf-lib to actually replace the page
    const updatedPages = [...targetFile.pages];
    updatedPages[targetPageIndex] = {
      ...sourceFile.pages[sourcePageIndex],
      pageNumber: targetPageIndex + 1,
    };

    return {
      ...targetFile,
      pages: updatedPages,
      isModified: true,
    };
  } catch (error) {
    console.error('Error replacing page:', error);
    throw error;
  }
};

export const removePageFromPDF = async (
  targetFile: PDFFileWithPages,
  pageIndex: number
): Promise<PDFFileWithPages> => {
  const updatedPages = targetFile.pages.filter((_, index) => index !== pageIndex);
  
  // Renumber remaining pages
  const renumberedPages = updatedPages.map((page, index) => ({
    ...page,
    pageNumber: index + 1,
  }));

  return {
    ...targetFile,
    pages: renumberedPages,
    pageCount: renumberedPages.length,
    isModified: true,
  };
};
