import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';

// Initialize PDF.js worker
import { initializePDFWorker } from './pdfConfig';

// Initialize worker on module load
let workerInitPromise: Promise<boolean> | null = null;

function ensureWorkerInit(): Promise<boolean> {
  if (!workerInitPromise) {
    workerInitPromise = initializePDFWorker();
  }
  return workerInitPromise;
}

// Unified thumbnail cache
const thumbnailCache = new Map<string, string>();
const generationPromises = new Map<string, Promise<string | null>>();
const failedAttempts = new Map<string, number>();
const MAX_RETRIES = 2;

interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  pageNumber?: number;
}

export interface ThumbnailResult {
  success: boolean;
  data?: string;
  error?: string;
  fallback?: boolean;
}

/**
 * Generate thumbnail for any PDF source using client-side PDF.js
 */
export async function generateThumbnail(
  source: File | string,
  options: ThumbnailOptions = {},
  fileId?: string
): Promise<ThumbnailResult> {
  const { width = 200, height = 260, quality = 0.8, pageNumber = 1 } = options;
  
  let cacheKey: string;
  
  if (source instanceof File) {
    cacheKey = `file_${source.name}_${source.size}_${source.lastModified}_p${pageNumber}_${width}x${height}`;
  } else {
    cacheKey = `stored_${source}_p${pageNumber}_${width}x${height}`;
  }

  // Check cache first
  if (thumbnailCache.has(cacheKey)) {
    return { success: true, data: thumbnailCache.get(cacheKey)! };
  }

  // Check if we've exceeded retry attempts
  const attempts = failedAttempts.get(cacheKey) || 0;
  if (attempts >= MAX_RETRIES) {
    return { 
      success: false, 
      error: 'Max retries exceeded', 
      data: generatePlaceholder(width, height),
      fallback: true 
    };
  }

  // Check if generation is in progress
  if (generationPromises.has(cacheKey)) {
    try {
      const result = await generationPromises.get(cacheKey)!;
      return result 
        ? { success: true, data: result }
        : { success: false, error: 'Generation failed', data: generatePlaceholder(width, height) };
    } catch (error) {
      failedAttempts.set(cacheKey, attempts + 1);
      return { success: false, error: 'Generation failed', data: generatePlaceholder(width, height) };
    }
  }

  // Start new generation
  const generationPromise = source instanceof File
    ? generateFromFile(source, { width, height, quality, pageNumber })
    : generateFromStoredFile(source, { width, height, quality, pageNumber }, fileId);

  generationPromises.set(cacheKey, generationPromise);

  try {
    const result = await generationPromise;
    if (result) {
      thumbnailCache.set(cacheKey, result);
      failedAttempts.delete(cacheKey);
      return { success: true, data: result };
    } else {
      failedAttempts.set(cacheKey, attempts + 1);
      return { success: false, error: 'Failed to generate thumbnail', data: generatePlaceholder(width, height) };
    }
  } catch (error) {
    failedAttempts.set(cacheKey, attempts + 1);
    return { success: false, error: 'Failed to generate thumbnail', data: generatePlaceholder(width, height) };
  } finally {
    generationPromises.delete(cacheKey);
  }
}

/**
 * Generate thumbnail from File object using client-side PDF.js
 */
async function generateFromFile(
  file: File, 
  options: ThumbnailOptions
): Promise<string | null> {
  try {
    console.log('Generating thumbnail from File object using PDF.js:', file.name);

    const arrayBuffer = await file.arrayBuffer();
    return await renderPDFPage(arrayBuffer, options);
  } catch (error) {
    console.error('Error generating thumbnail from file:', error);
    return null;
  }
}

/**
 * Generate thumbnail from stored file path
 */
async function generateFromStoredFile(
  filePath: string,
  options: ThumbnailOptions,
  fileId?: string
): Promise<string | null> {
  try {
    console.log('Generating thumbnail from stored file:', filePath);

    // Check if we already have a cached thumbnail URL in database
    if (fileId) {
      const cachedUrl = await getCachedThumbnailUrl(fileId);
      if (cachedUrl) {
        console.log('Using cached thumbnail from storage');
        return cachedUrl;
      }
    }

    // Download file and generate thumbnail client-side
    const { data, error } = await supabase.storage
      .from('user-files')
      .download(filePath);

    if (error || !data) {
      console.error('Error downloading file:', error);
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    return await renderPDFPage(arrayBuffer, options);
  } catch (error) {
    console.error('Error generating thumbnail from stored file:', error);
    return null;
  }
}

/**
 * Render PDF page to canvas using PDF.js with robust error handling
 */
async function renderPDFPage(
  arrayBuffer: ArrayBuffer,
  options: ThumbnailOptions
): Promise<string | null> {
  let pdf = null;
  let page = null;
  
  try {
    const { width = 200, height = 260, quality = 0.8, pageNumber = 1 } = options;
    console.log(`Starting PDF rendering for page ${pageNumber}, dimensions: ${width}x${height}`);

    // Ensure worker is initialized
    const workerReady = await ensureWorkerInit();
    if (!workerReady) {
      console.warn('PDF.js worker not available, falling back to placeholder');
      throw new Error('PDF.js worker not available');
    }

    // Validate inputs
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Invalid ArrayBuffer provided');
    }

    // Load PDF document with timeout
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
      cMapPacked: true
    });
    
    pdf = await Promise.race([
      loadingTask.promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('PDF loading timeout')), 10000))
    ]);
    
    console.log(`PDF loaded successfully, ${pdf.numPages} pages`);
    
    if (pdf.numPages < pageNumber) {
      console.warn(`Page ${pageNumber} not found, using page 1`);
    }

    const actualPageNumber = Math.min(pageNumber, pdf.numPages);
    page = await pdf.getPage(actualPageNumber);
    console.log(`Page ${actualPageNumber} loaded`);
    
    // Calculate scale to fit desired dimensions
    const viewport = page.getViewport({ scale: 1 });
    const scaleX = width / viewport.width;
    const scaleY = height / viewport.height;
    const scale = Math.min(scaleX, scaleY, 2); // Cap scale at 2x
    
    if (scale <= 0 || !isFinite(scale)) {
      throw new Error(`Invalid scale calculated: ${scale}`);
    }
    
    const scaledViewport = page.getViewport({ scale });
    console.log(`Calculated scale: ${scale}, viewport: ${scaledViewport.width}x${scaledViewport.height}`);

    // Create canvas with validation
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not create canvas context');
    }

    // Validate canvas dimensions
    const canvasWidth = Math.floor(scaledViewport.width);
    const canvasHeight = Math.floor(scaledViewport.height);
    
    if (canvasWidth <= 0 || canvasHeight <= 0 || canvasWidth > 4096 || canvasHeight > 4096) {
      throw new Error(`Invalid canvas dimensions: ${canvasWidth}x${canvasHeight}`);
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    console.log(`Canvas created: ${canvasWidth}x${canvasHeight}`);

    // Render page to canvas with timeout
    const renderPromise = page.render({
      canvasContext: context,
      viewport: scaledViewport
    }).promise;
    
    await Promise.race([
      renderPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Rendering timeout')), 15000))
    ]);
    
    console.log('Page rendered successfully');

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    console.log(`Thumbnail generated successfully, size: ${dataUrl.length} bytes`);
    
    return dataUrl;
  } catch (error) {
    console.error('Error rendering PDF page:', error);
    console.error('Error stack:', error.stack);
    return null;
  } finally {
    // Cleanup resources
    try {
      if (page) {
        page.cleanup();
        console.log('Page cleanup completed');
      }
      if (pdf) {
        pdf.destroy();
        console.log('PDF cleanup completed');
      }
    } catch (cleanupError) {
      console.warn('Error during cleanup:', cleanupError);
    }
  }
}

/**
 * Get cached thumbnail URL from database
 */
async function getCachedThumbnailUrl(fileId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_files')
      .select('thumbnail_url')
      .eq('id', fileId)
      .single();

    if (error || !data?.thumbnail_url) {
      return null;
    }

    // Get public URL for the thumbnail
    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(data.thumbnail_url);

    return publicUrl;
  } catch (error) {
    console.error('Error getting cached thumbnail URL:', error);
    return null;
  }
}

/**
 * Generate SVG placeholder thumbnail
 */
function generatePlaceholder(width: number = 200, height: number = 260): string {
  const placeholderSvg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg-${width}-${height}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(var(--card))"/>
          <stop offset="100%" style="stop-color:hsl(var(--muted))"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg-${width}-${height})" stroke="hsl(var(--border))" stroke-width="2" rx="8"/>
      <rect x="${width * 0.1}" y="${height * 0.15}" width="${width * 0.8}" height="${height * 0.08}" fill="hsl(var(--muted-foreground))" opacity="0.3" rx="2"/>
      <rect x="${width * 0.1}" y="${height * 0.28}" width="${width * 0.6}" height="${height * 0.06}" fill="hsl(var(--muted-foreground))" opacity="0.2" rx="1"/>
      <rect x="${width * 0.1}" y="${height * 0.4}" width="${width * 0.7}" height="${height * 0.06}" fill="hsl(var(--muted-foreground))" opacity="0.2" rx="1"/>
      <rect x="${width * 0.1}" y="${height * 0.52}" width="${width * 0.5}" height="${height * 0.06}" fill="hsl(var(--muted-foreground))" opacity="0.2" rx="1"/>
      <circle cx="${width / 2}" cy="${height * 0.75}" r="${width * 0.08}" fill="hsl(var(--primary))" opacity="0.2"/>
      <text x="${width / 2}" y="${height * 0.78}" text-anchor="middle" fill="hsl(var(--primary))" font-family="system-ui" font-size="${width * 0.06}" font-weight="600">PDF</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(placeholderSvg)}`;
}

/**
 * Preload thumbnails for multiple sources
 */
export async function preloadThumbnails(
  sources: (File | string)[],
  options: ThumbnailOptions = {}
): Promise<void> {
  const promises = sources.map(source => generateThumbnail(source, options));
  await Promise.allSettled(promises);
}

/**
 * Clear thumbnail cache
 */
export function clearThumbnailCache(): void {
  thumbnailCache.clear();
  generationPromises.clear();
}