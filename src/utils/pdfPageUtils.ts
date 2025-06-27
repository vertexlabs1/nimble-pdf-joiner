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
    // Create a better-looking placeholder thumbnail
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 150, 200);
    
    // Add border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 148, 198);
    
    // Add subtle shadow effect
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(5, 5, 140, 190);
    
    // Add main content area
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 10, 130, 180);
    
    // Add page number in center
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Page ${pageNumber}`, 75, 100);
    
    // Add some decorative lines to make it look more like a document
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const y = 120 + (i * 8);
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(130, y);
      ctx.stroke();
    }
  }
  
  return canvas.toDataURL('image/png');
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
