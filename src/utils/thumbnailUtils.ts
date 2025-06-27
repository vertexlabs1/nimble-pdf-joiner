
import * as pdfjsLib from 'pdfjs-dist';

export const renderSingleThumbnail = async (pdfDocument: any, pageNumber: number): Promise<string> => {
  try {
    const page = await pdfDocument.getPage(pageNumber);
    
    // Use very small scale for fast rendering
    const viewport = page.getViewport({ scale: 0.25 });
    
    // Limit canvas size even more for speed
    const maxSize = 80;
    const scale = Math.min(maxSize / viewport.width, maxSize / viewport.height, 0.25);
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
    
    const result = canvas.toDataURL('image/jpeg', 0.5); // Lower quality for speed
    
    // Clean up canvas
    canvas.width = 0;
    canvas.height = 0;
    
    return result;
    
  } catch (error) {
    console.warn(`Failed to render thumbnail for page ${pageNumber}:`, error);
    throw error;
  }
};

export const createPlaceholderThumbnail = (pageNumber: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 80;
  canvas.height = 106;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 80, 106);
    
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 80, 106);
    
    ctx.fillStyle = '#6c757d';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${pageNumber}`, 40, 53);
  }
  
  const result = canvas.toDataURL('image/png');
  
  // Clean up canvas
  canvas.width = 0;
  canvas.height = 0;
  
  return result;
};

export const loadPDFDocument = async (file: File): Promise<any> => {
  const arrayBuffer = await file.arrayBuffer();
  return await pdfjsLib.getDocument({ 
    data: arrayBuffer,
    useSystemFonts: true, // Faster rendering
    disableFontFace: true // Skip font loading for speed
  }).promise;
};
