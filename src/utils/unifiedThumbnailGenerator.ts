import { supabase } from '@/integrations/supabase/client';

// Unified thumbnail cache
const thumbnailCache = new Map<string, string>();
const generationPromises = new Map<string, Promise<string | null>>();

interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
}

export interface ThumbnailResult {
  success: boolean;
  data?: string;
  error?: string;
  fallback?: boolean;
}

/**
 * Generate thumbnail for any PDF source - File object or stored file path
 */
export async function generateThumbnail(
  source: File | string,
  options: ThumbnailOptions = {},
  fileId?: string
): Promise<ThumbnailResult> {
  const { width = 200, height = 260, quality = 0.8 } = options;
  
  let cacheKey: string;
  let isFileObject = false;
  
  if (source instanceof File) {
    isFileObject = true;
    cacheKey = `file_${source.name}_${source.size}_${source.lastModified}_${width}x${height}`;
  } else {
    cacheKey = `stored_${source}_${width}x${height}`;
  }

  // Check cache first
  if (thumbnailCache.has(cacheKey)) {
    return { success: true, data: thumbnailCache.get(cacheKey)! };
  }

  // Check if generation is in progress
  if (generationPromises.has(cacheKey)) {
    const result = await generationPromises.get(cacheKey)!;
    return result 
      ? { success: true, data: result }
      : { success: false, error: 'Generation failed' };
  }

  // Start new generation
  const generationPromise = isFileObject
    ? generateFromFile(source as File, { width, height, quality }, cacheKey)
    : generateFromStoredFile(source as string, { width, height, quality }, cacheKey, fileId);

  generationPromises.set(cacheKey, generationPromise);

  try {
    const result = await generationPromise;
    if (result) {
      thumbnailCache.set(cacheKey, result);
      return { success: true, data: result };
    } else {
      return { success: false, error: 'Failed to generate thumbnail', data: generatePlaceholder(width, height) };
    }
  } finally {
    generationPromises.delete(cacheKey);
  }
}

/**
 * Generate thumbnail from File object using server-side processing
 */
async function generateFromFile(
  file: File, 
  options: ThumbnailOptions, 
  cacheKey: string
): Promise<string | null> {
  try {
    console.log('Generating thumbnail from File object:', file.name);

    // Convert file to base64 for server processing
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Call server-side thumbnail generation
    const { data, error } = await supabase.functions.invoke('generate-thumbnail', {
      body: { 
        fileData: base64Data,
        filename: file.name,
        width: options.width,
        height: options.height,
        quality: options.quality
      }
    });

    if (error) {
      console.error('Server thumbnail generation failed:', error);
      return null;
    }

    if (data?.success && data?.thumbnailData) {
      console.log('Server thumbnail generated successfully');
      return data.thumbnailData;
    }

    return null;
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
  cacheKey: string,
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

    // Call server-side thumbnail generation
    const { data, error } = await supabase.functions.invoke('generate-thumbnail', {
      body: { 
        filePath,
        fileId,
        width: options.width,
        height: options.height,
        quality: options.quality
      }
    });

    if (error) {
      console.error('Server thumbnail generation failed:', error);
      return null;
    }

    if (data?.success && data?.thumbnailData) {
      console.log('Server thumbnail generated successfully');
      return data.thumbnailData;
    }

    return null;
  } catch (error) {
    console.error('Error generating thumbnail from stored file:', error);
    return null;
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