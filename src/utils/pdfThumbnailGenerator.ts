import { supabase } from '@/integrations/supabase/client';
import { initializePDFWorker, getPDFLib } from './pdfConfig';

// In-memory cache for generated thumbnails
const thumbnailCache = new Map<string, string>();

// Cache for ongoing generation requests to prevent duplicates
const generationPromises = new Map<string, Promise<string | null>>();

export async function generateStoredFileThumbnail(filePath: string, fileId?: string): Promise<string | null> {
  // Check in-memory cache first
  if (thumbnailCache.has(filePath)) {
    return thumbnailCache.get(filePath)!;
  }

  // Check if generation is already in progress
  if (generationPromises.has(filePath)) {
    return generationPromises.get(filePath)!;
  }

  // Check if thumbnail already exists in database/storage
  if (fileId) {
    const cachedUrl = await getCachedThumbnailUrl(fileId);
    if (cachedUrl) {
      thumbnailCache.set(filePath, cachedUrl);
      return cachedUrl;
    }
  }

  // Start generation process
  const generationPromise = generateAndCacheThumbnail(filePath, fileId);
  generationPromises.set(filePath, generationPromise);

  try {
    const result = await generationPromise;
    return result;
  } finally {
    generationPromises.delete(filePath);
  }
}

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

async function generateAndCacheThumbnail(filePath: string, fileId?: string): Promise<string | null> {
  try {
    console.log('Starting thumbnail generation for:', filePath);
    
    // Try server-side thumbnail generation first
    if (fileId) {
      try {
        const { data, error } = await supabase.functions.invoke('generate-thumbnail', {
          body: { filePath, fileId }
        });

        if (!error && data?.success && data?.thumbnailData) {
          console.log('Server-side thumbnail generated successfully');
          thumbnailCache.set(filePath, data.thumbnailData);
          return data.thumbnailData;
        }
      } catch (serverError) {
        console.warn('Server-side thumbnail generation failed, falling back to client-side:', serverError);
      }
    }

    // Fallback to client-side generation
    console.log('Attempting client-side thumbnail generation');
    
    // Ensure PDF.js worker is initialized
    const workerReady = await initializePDFWorker();
    if (!workerReady) {
      console.error('PDF.js worker initialization failed, using placeholder');
      return generatePlaceholderThumbnail();
    }
    
    // Download PDF from Supabase storage
    const { data, error } = await supabase.storage
      .from('user_files')
      .download(filePath);

    if (error) {
      console.error('Error downloading PDF for thumbnail:', error, { filePath });
      return generatePlaceholderThumbnail();
    }

    if (!data) {
      console.error('No data received for PDF download:', filePath);
      return generatePlaceholderThumbnail();
    }

    console.log('PDF downloaded successfully, size:', data.size, 'bytes');

    // Convert blob to array buffer
    const arrayBuffer = await data.arrayBuffer();
    console.log('Array buffer created, size:', arrayBuffer.byteLength, 'bytes');
    
    const pdfjsLib = getPDFLib();
    
    // Load PDF document with timeout
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: 0 // Reduce console noise
    });
    
    const pdfDocument = await Promise.race([
      loadingTask.promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF loading timeout')), 10000)
      )
    ]) as any;
    
    console.log('PDF document loaded, pages:', pdfDocument.numPages);
    
    // Get first page
    const page = await pdfDocument.getPage(1);
    console.log('First page loaded');
    
    // Generate high-quality thumbnail
    const thumbnail = await renderPageThumbnail(page, 200, 260);
    console.log('Thumbnail generated successfully');
    
    // Cache in memory
    thumbnailCache.set(filePath, thumbnail);

    // Save to storage if fileId is provided
    if (fileId) {
      await saveThumbnailToStorage(thumbnail, filePath, fileId);
    }
    
    return thumbnail;
  } catch (error) {
    console.error('Error generating thumbnail for stored PDF:', error, { 
      filePath, 
      fileId
    });
    return generatePlaceholderThumbnail();
  }
}

function generatePlaceholderThumbnail(): string {
  const placeholderSvg = `
    <svg width="200" height="260" viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="260" fill="hsl(var(--card))" stroke="hsl(var(--border))" stroke-width="2"/>
      <rect x="20" y="40" width="160" height="20" fill="hsl(var(--muted))" rx="2"/>
      <rect x="20" y="80" width="120" height="20" fill="hsl(var(--muted))" rx="2"/>
      <rect x="20" y="120" width="140" height="20" fill="hsl(var(--muted))" rx="2"/>
      <rect x="20" y="160" width="100" height="20" fill="hsl(var(--muted))" rx="2"/>
      <text x="100" y="220" text-anchor="middle" fill="hsl(var(--muted-foreground))" font-family="Arial" font-size="14">PDF</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(placeholderSvg)}`;
}

async function saveThumbnailToStorage(thumbnail: string, filePath: string, fileId: string): Promise<void> {
  try {
    // Convert data URL to blob
    const response = await fetch(thumbnail);
    const blob = await response.blob();

    // Generate thumbnail file path
    const thumbnailPath = `${filePath.replace('.pdf', '_thumb.jpg')}`;

    // Upload thumbnail to storage
    const { error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(thumbnailPath, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading thumbnail:', uploadError);
      return;
    }

    // Update database with thumbnail URL
    const { error: updateError } = await supabase
      .from('user_files')
      .update({ thumbnail_url: thumbnailPath })
      .eq('id', fileId);

    if (updateError) {
      console.error('Error updating thumbnail URL in database:', updateError);
    }
  } catch (error) {
    console.error('Error saving thumbnail to storage:', error);
  }
}

export async function generateSmallThumbnail(filePath: string, fileId?: string): Promise<string | null> {
  // For small thumbnails, try to use the cached full-size version first
  const fullThumbnail = await generateStoredFileThumbnail(filePath, fileId);
  return fullThumbnail;
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