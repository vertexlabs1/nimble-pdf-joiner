import { PDFDocument } from 'pdf-lib';
import { PDFPageInfo, PDFFileWithPages } from '@/types/pdf';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker with better error handling
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
} catch (error) {
  console.warn('Failed to set PDF.js worker source:', error);
}

export const generatePageThumbnails = async (file: File): Promise<PDFPageInfo[]> => {
  console.log('Starting thumbnail generation for:', file.name);
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pageCount = pdfDoc.getPageCount();
    const pages: PDFPageInfo[] = [];

    console.log(`PDF loaded successfully, ${pageCount} pages found`);

    // Try to load PDF with PDF.js for rendering thumbnails
    let pdfDocument = null;
    try {
      pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log('PDF.js document loaded successfully');
    } catch (pdfJsError) {
      console.warn('PDF.js failed to load document, using placeholders only:', pdfJsError);
    }

    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      
      let thumbnail: string;
      
      if (pdfDocument) {
        try {
          // Try to render actual page thumbnail using PDF.js
          thumbnail = await renderActualPageThumbnail(pdfDocument, i + 1);
          console.log(`Successfully rendered thumbnail for page ${i + 1}`);
        } catch (error) {
          console.warn(`Failed to render page ${i + 1}, using placeholder:`, error);
          thumbnail = createPlaceholderThumbnail(i + 1);
        }
      } else {
        // Use placeholder if PDF.js didn't load
        thumbnail = createPlaceholderThumbnail(i + 1);
      }
      
      pages.push({
        pageNumber: i + 1,
        thumbnail,
        width,
        height,
      });
    }

    console.log(`Generated ${pages.length} page thumbnails`);
    return pages;
  } catch (error) {
    console.error('Error generating thumbnails:', error);
    // Return empty array but don't throw - let the parent function handle it
    return [];
  }
};

const renderActualPageThumbnail = async (pdfDocument: any, pageNumber: number): Promise<string> => {
  const page = await pdfDocument.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  
  // Calculate scale to fit within thumbnail dimensions (150x200)
  const scaleX = 150 / viewport.width;
  const scaleY = 200 / viewport.height;
  const scale = Math.min(scaleX, scaleY);
  
  const scaledViewport = page.getViewport({ scale });
  
  // Create canvas for rendering
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Failed to get canvas context');
  }
  
  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;
  
  // Render PDF page to canvas
  const renderContext = {
    canvasContext: context,
    viewport: scaledViewport,
  };
  
  await page.render(renderContext).promise;
  
  // If the rendered size is smaller than thumbnail size, center it on a white background
  if (canvas.width < 150 || canvas.height < 200) {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = 150;
    finalCanvas.height = 200;
    const finalContext = finalCanvas.getContext('2d');
    
    if (finalContext) {
      // Fill with white background
      finalContext.fillStyle = '#ffffff';
      finalContext.fillRect(0, 0, 150, 200);
      
      // Center the rendered page
      const x = (150 - canvas.width) / 2;
      const y = (200 - canvas.height) / 2;
      finalContext.drawImage(canvas, x, y);
      
      return finalCanvas.toDataURL('image/png');
    }
  }
  
  return canvas.toDataURL('image/png');
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
  console.log('Processing file with pages:', file.name);
  
  try {
    // First, try to get basic page count using pdf-lib
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pageCount = pdfDoc.getPageCount();
    
    console.log(`File ${file.name} has ${pageCount} pages`);
    
    // Try to generate thumbnails
    const pages = await generatePageThumbnails(file);
    
    // Always return a valid object, even if thumbnail generation failed
    const result: PDFFileWithPages = {
      originalFile: file,
      pageCount,
      pages: pages.length > 0 ? pages : createFallbackPages(pageCount),
      isModified: false,
    };
    
    console.log('Successfully processed file:', file.name, 'with', result.pages.length, 'page thumbnails');
    return result;
    
  } catch (error) {
    console.error('Error processing file:', file.name, error);
    
    // Even if everything fails, return a basic object with minimal info
    // This ensures the file still shows up with an edit button
    return {
      originalFile: file,
      pageCount: 1, // Assume at least 1 page
      pages: [createFallbackPageInfo(1)],
      isModified: false,
    };
  }
};

// Helper function to create fallback pages when thumbnail generation fails
const createFallbackPages = (pageCount: number): PDFPageInfo[] => {
  const pages: PDFPageInfo[] = [];
  for (let i = 1; i <= pageCount; i++) {
    pages.push(createFallbackPageInfo(i));
  }
  return pages;
};

// Helper function to create a single fallback page info
const createFallbackPageInfo = (pageNumber: number): PDFPageInfo => {
  return {
    pageNumber,
    thumbnail: createPlaceholderThumbnail(pageNumber),
    width: 595, // Standard A4 width in points
    height: 842, // Standard A4 height in points
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
