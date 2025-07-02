import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';

// Set up PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
} catch (error) {
  console.warn('Failed to set PDF.js worker source:', error);
}

// Cache for generated thumbnails
const thumbnailCache = new Map<string, string>();

export async function generateStoredFileThumbnail(filePath: string): Promise<string | null> {
  // Check cache first
  if (thumbnailCache.has(filePath)) {
    return thumbnailCache.get(filePath)!;
  }

  try {
    // Download PDF from Supabase storage
    const { data, error } = await supabase.storage
      .from('user_files')
      .download(filePath);

    if (error) {
      console.error('Error downloading PDF for thumbnail:', error);
      return null;
    }

    // Convert blob to array buffer
    const arrayBuffer = await data.arrayBuffer();
    
    // Load PDF document
    const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Get first page
    const page = await pdfDocument.getPage(1);
    
    // Generate thumbnail
    const thumbnail = await renderPageThumbnail(page, 150, 200);
    
    // Cache the thumbnail
    thumbnailCache.set(filePath, thumbnail);
    
    return thumbnail;
  } catch (error) {
    console.error('Error generating thumbnail for stored PDF:', error);
    return null;
  }
}

export async function generateSmallThumbnail(filePath: string): Promise<string | null> {
  try {
    // Check if we have a cached full thumbnail first
    if (thumbnailCache.has(filePath)) {
      return thumbnailCache.get(filePath)!;
    }

    // Download PDF from Supabase storage
    const { data, error } = await supabase.storage
      .from('user_files')
      .download(filePath);

    if (error) {
      console.error('Error downloading PDF for small thumbnail:', error);
      return null;
    }

    // Convert blob to array buffer
    const arrayBuffer = await data.arrayBuffer();
    
    // Load PDF document
    const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Get first page
    const page = await pdfDocument.getPage(1);
    
    // Generate small thumbnail
    const thumbnail = await renderPageThumbnail(page, 40, 50);
    
    return thumbnail;
  } catch (error) {
    console.error('Error generating small thumbnail for stored PDF:', error);
    return null;
  }
}

async function renderPageThumbnail(page: any, maxWidth: number, maxHeight: number): Promise<string> {
  const viewport = page.getViewport({ scale: 1 });
  
  // Calculate scale to fit within max dimensions
  const scaleX = maxWidth / viewport.width;
  const scaleY = maxHeight / viewport.height;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
  
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
  
  return canvas.toDataURL('image/jpeg', 0.8);
}