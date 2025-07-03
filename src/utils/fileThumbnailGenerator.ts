import { initializePDFWorker, getPDFLib } from './pdfConfig';

// In-memory cache for file-based thumbnails
const fileThumbnailCache = new Map<string, string>();

// Cache for ongoing generation requests to prevent duplicates
const fileGenerationPromises = new Map<string, Promise<string | null>>();

export async function generateFileThumbnail(file: File, pageNumber: number = 1): Promise<string | null> {
  const cacheKey = `${file.name}_${file.size}_${file.lastModified}_page_${pageNumber}`;
  
  // Check in-memory cache first
  if (fileThumbnailCache.has(cacheKey)) {
    console.log(`Using cached thumbnail for ${file.name} page ${pageNumber}`);
    return fileThumbnailCache.get(cacheKey)!;
  }

  // Check if generation is already in progress
  if (fileGenerationPromises.has(cacheKey)) {
    console.log(`Thumbnail generation in progress for ${file.name} page ${pageNumber}`);
    return fileGenerationPromises.get(cacheKey)!;
  }

  // Start generation process
  const generationPromise = generateFileThumbnailInternal(file, pageNumber, cacheKey);
  fileGenerationPromises.set(cacheKey, generationPromise);

  try {
    const result = await generationPromise;
    return result;
  } finally {
    fileGenerationPromises.delete(cacheKey);
  }
}

async function generateFileThumbnailInternal(file: File, pageNumber: number, cacheKey: string): Promise<string | null> {
  try {
    console.log(`Starting thumbnail generation for ${file.name} page ${pageNumber}`);
    
    // Ensure PDF.js worker is initialized
    const workerReady = await initializePDFWorker();
    if (!workerReady) {
      console.error('PDF.js worker initialization failed, using placeholder');
      return generatePlaceholderThumbnail();
    }
    
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    console.log(`File converted to array buffer, size: ${arrayBuffer.byteLength} bytes`);
    
    const pdfjsLib = getPDFLib();
    
    // Load PDF document with timeout
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: 0 // Reduce console noise
    });
    
    const pdfDocument = await Promise.race([
      loadingTask.promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF loading timeout')), 8000)
      )
    ]) as any;
    
    console.log(`PDF document loaded, total pages: ${pdfDocument.numPages}`);
    
    // Validate page number
    if (pageNumber > pdfDocument.numPages || pageNumber < 1) {
      console.error(`Invalid page number ${pageNumber} for PDF with ${pdfDocument.numPages} pages`);
      return generatePlaceholderThumbnail();
    }
    
    // Get the specified page
    const page = await pdfDocument.getPage(pageNumber);
    console.log(`Page ${pageNumber} loaded successfully`);
    
    // Generate thumbnail
    const thumbnail = await renderPageThumbnail(page, 160, 208); // Smaller size for grid
    console.log(`Thumbnail generated successfully for page ${pageNumber}`);
    
    // Cache the result
    fileThumbnailCache.set(cacheKey, thumbnail);
    
    return thumbnail;
  } catch (error) {
    console.error(`Error generating thumbnail for ${file.name} page ${pageNumber}:`, error);
    return generatePlaceholderThumbnail();
  }
}

function generatePlaceholderThumbnail(): string {
  const placeholderSvg = `
    <svg width="160" height="208" viewBox="0 0 160 208" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="208" fill="hsl(var(--card))" stroke="hsl(var(--border))" stroke-width="2"/>
      <rect x="16" y="32" width="128" height="16" fill="hsl(var(--muted))" rx="2"/>
      <rect x="16" y="64" width="96" height="16" fill="hsl(var(--muted))" rx="2"/>
      <rect x="16" y="96" width="112" height="16" fill="hsl(var(--muted))" rx="2"/>
      <rect x="16" y="128" width="80" height="16" fill="hsl(var(--muted))" rx="2"/>
      <text x="80" y="176" text-anchor="middle" fill="hsl(var(--muted-foreground))" font-family="Arial" font-size="12">PDF</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(placeholderSvg)}`;
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