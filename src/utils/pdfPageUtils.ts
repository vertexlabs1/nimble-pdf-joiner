import { PDFDocument } from 'pdf-lib';
import { PDFPageInfo, PDFFileWithPages } from '@/types/pdf';
import { pdfjsLib, ensureWorkerReady } from './pdfConfig';

// Cache for loaded PDFs to avoid reloading
const pdfCache = new Map<string, any>();

// Fast basic info extraction - only page count
export const getBasicFileInfo = async (file: File): Promise<PDFFileWithPages> => {
  console.log('Getting basic info for:', file.name);
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pageCount = pdfDoc.getPageCount();
    
    console.log(`File ${file.name} has ${pageCount} pages`);
    
    // Create placeholder pages for now
    const pages: PDFPageInfo[] = [];
    for (let i = 1; i <= pageCount; i++) {
      pages.push({
        pageNumber: i,
        thumbnail: '', // Empty - will be loaded on demand
        width: 595, // Standard A4
        height: 842,
      });
    }
    
    return {
      originalFile: file,
      pageCount,
      pages,
      isModified: false,
    };
    
  } catch (error) {
    console.error('Error getting basic info for:', file.name, error);
    return {
      originalFile: file,
      pageCount: 1,
      pages: [{
        pageNumber: 1,
        thumbnail: '',
        width: 595,
        height: 842,
      }],
      isModified: false,
    };
  }
};

// Lazy thumbnail generation - only when needed
export const generatePageThumbnails = async (file: File): Promise<PDFPageInfo[]> => {
  console.log('Generating thumbnails for:', file.name);
  
  const cacheKey = `${file.name}-${file.size}-${file.lastModified}`;
  
  // Check cache first
  if (pdfCache.has(cacheKey)) {
    console.log('Using cached PDF for:', file.name);
  }
  
  try {
    // Ensure worker is ready before processing
    const workerReady = await ensureWorkerReady();
    if (!workerReady) {
      console.error('PDF.js worker failed to initialize for:', file.name);
      return [];
    }

    const arrayBuffer = await file.arrayBuffer();
    let pdfDocument = pdfCache.get(cacheKey);
    
    if (!pdfDocument) {
      pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pdfCache.set(cacheKey, pdfDocument);
      console.log('Cached PDF document for:', file.name);
    }
    
    const pageCount = pdfDocument.numPages;
    const pages: PDFPageInfo[] = [];

    // Generate thumbnails in parallel for better performance
    const thumbnailPromises = [];
    
    for (let i = 1; i <= pageCount; i++) {
      thumbnailPromises.push(
        renderPageThumbnail(pdfDocument, i).catch(error => {
          console.warn(`Failed to render page ${i} for ${file.name}:`, error);
          return createPlaceholderThumbnail(i);
        })
      );
    }
    
    const thumbnails = await Promise.all(thumbnailPromises);
    
    for (let i = 0; i < pageCount; i++) {
      pages.push({
        pageNumber: i + 1,
        thumbnail: thumbnails[i],
        width: 595,
        height: 842,
      });
    }

    console.log(`Generated ${pages.length} thumbnails for ${file.name}`);
    return pages;
    
  } catch (error) {
    console.error('Error generating thumbnails:', error);
    // Return placeholder pages
    return [];
  }
};

const renderPageThumbnail = async (pdfDocument: any, pageNumber: number): Promise<string> => {
  const page = await pdfDocument.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 0.5 }); // Reduced scale for faster rendering
  
  // Limit thumbnail size for performance
  const maxWidth = 120;
  const maxHeight = 160;
  const scaleX = maxWidth / viewport.width;
  const scaleY = maxHeight / viewport.height;
  const scale = Math.min(scaleX, scaleY, 0.5); // Cap at 0.5 scale
  
  const scaledViewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Failed to get canvas context');
  }
  
  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;
  
  await page.render({
    canvasContext: context,
    viewport: scaledViewport,
  }).promise;
  
  return canvas.toDataURL('image/jpeg', 0.7); // JPEG with compression for smaller size
};

const createPlaceholderThumbnail = (pageNumber: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Simple, fast placeholder
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 120, 160);
    
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 120, 160);
    
    ctx.fillStyle = '#6c757d';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${pageNumber}`, 60, 80);
  }
  
  return canvas.toDataURL('image/png');
};

// Updated to use lazy thumbnail generation
export const processFileWithPages = async (file: File): Promise<PDFFileWithPages> => {
  console.log('Processing file with pages (lazy loading):', file.name);
  
  try {
    // First get basic info quickly
    const basicInfo = await getBasicFileInfo(file);
    
    // Then generate thumbnails asynchronously
    const pages = await generatePageThumbnails(file);
    
    return {
      ...basicInfo,
      pages: pages.length > 0 ? pages : basicInfo.pages,
    };
    
  } catch (error) {
    console.error('Error in processFileWithPages:', error);
    return getBasicFileInfo(file); // Fallback to basic info
  }
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
