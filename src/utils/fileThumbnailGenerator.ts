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
      <rect width="160" height="208" fill="#ffffff" stroke="#e5e7eb" stroke-width="2"/>
      <rect x="16" y="32" width="128" height="16" fill="#f3f4f6" rx="2"/>
      <rect x="16" y="64" width="96" height="16" fill="#f3f4f6" rx="2"/>
      <rect x="16" y="96" width="112" height="16" fill="#f3f4f6" rx="2"/>
      <rect x="16" y="128" width="80" height="16" fill="#f3f4f6" rx="2"/>
      <text x="80" y="176" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="12">PDF</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(placeholderSvg)}`;
}

async function renderPageThumbnail(page: any, maxWidth: number, maxHeight: number): Promise<string> {
  try {
    const viewport = page.getViewport({ scale: 1 });
    console.log('Original viewport size:', viewport.width, 'x', viewport.height);
    
    // Calculate scale to fit within max dimensions
    const scaleX = maxWidth / viewport.width;
    const scaleY = maxHeight / viewport.height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
    
    const scaledViewport = page.getViewport({ scale });
    console.log('Scaled viewport size:', scaledViewport.width, 'x', scaledViewport.height, 'scale:', scale);
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { 
      alpha: false, // Optimize for PDF rendering
      willReadFrequently: false 
    });
    
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    
    canvas.width = Math.floor(scaledViewport.width);
    canvas.height = Math.floor(scaledViewport.height);
    console.log('Canvas size set to:', canvas.width, 'x', canvas.height);
    
    // Set white background for PDFs
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    const renderTask = page.render({
      canvasContext: context,
      viewport: scaledViewport,
      background: 'white'
    });
    
    await renderTask.promise;
    console.log('Page render completed successfully');
    
    // Verify canvas has content
    const imageData = context.getImageData(0, 0, Math.min(10, canvas.width), Math.min(10, canvas.height));
    const hasContent = imageData.data.some((value, index) => {
      // Check if any pixel is not white (skip alpha channel)
      if (index % 4 === 3) return false; // Skip alpha
      return value !== 255;
    });
    
    if (!hasContent) {
      console.warn('Canvas appears to be blank after rendering');
    }
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    console.log('Thumbnail generated, data URL length:', dataUrl.length);
    
    return dataUrl;
  } catch (error) {
    console.error('Error in renderPageThumbnail:', error);
    throw error;
  }
}