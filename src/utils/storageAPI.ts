import { supabase } from '@/integrations/supabase/client';

export interface StorageFile {
  id: string;
  name: string;
  metadata: {
    eTag: string;
    size: number;
    mimetype: string;
    cacheControl: string;
    lastModified: string;
    contentLength: number;
    httpStatusCode: number;
  };
  created_at: string;
  updated_at: string;
}

export interface UserStorageFile extends StorageFile {
  signedUrl?: string;
  displayName: string;
  fileSize: number;
  lastModified: Date;
}

// Cache for signed URLs to avoid regenerating them frequently
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const SIGNED_URL_DURATION = 3600; // 1 hour in seconds

/**
 * List all files in the user's storage folder
 */
export async function listUserFiles(): Promise<UserStorageFile[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated when listing files');
      return [];
    }

    const { data: files, error } = await supabase.storage
      .from('user_files')
      .list(user.id, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Error listing user files:', error);
      return [];
    }

    if (!files) return [];

    // Transform storage files to our format
    const userFiles: UserStorageFile[] = files
      .filter(file => file.name.endsWith('.pdf'))
      .map(file => ({
        id: file.id || `${user.id}/${file.name}`,
        name: file.name,
        metadata: file.metadata as UserStorageFile['metadata'],
        created_at: file.created_at || '',
        updated_at: file.updated_at || '',
        displayName: file.name.replace(/^\d{4}-\d{2}-\d{2}T[\d-]+_/, ''), // Remove timestamp prefix
        fileSize: file.metadata?.size || 0,
        lastModified: new Date(file.updated_at || file.created_at || Date.now())
      }));

    return userFiles;
  } catch (error) {
    console.error('Error listing user files:', error);
    return [];
  }
}

/**
 * Get a signed URL for a file with caching
 */
export async function getSignedUrl(filePath: string): Promise<string | null> {
  try {
    // Check cache first
    const cached = signedUrlCache.get(filePath);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

    const { data, error } = await supabase.storage
      .from('user_files')
      .createSignedUrl(filePath, SIGNED_URL_DURATION);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    if (data?.signedUrl) {
      // Cache the URL
      signedUrlCache.set(filePath, {
        url: data.signedUrl,
        expiresAt: Date.now() + (SIGNED_URL_DURATION - 300) * 1000 // Expire 5 minutes early
      });
      return data.signedUrl;
    }

    return null;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
}

/**
 * Download a file using signed URL
 */
export async function downloadFile(filePath: string, filename: string): Promise<{ success: boolean; error?: string }> {
  try {
    const signedUrl = await getSignedUrl(filePath);
    if (!signedUrl) {
      return { success: false, error: 'Could not generate download URL' };
    }

    // Use the signed URL to download
    const response = await fetch(signedUrl);
    if (!response.ok) {
      return { success: false, error: 'Failed to download file' };
    }

    const blob = await response.blob();
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error downloading file:', error);
    return { success: false, error: 'Download failed' };
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from('user_files')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }

    // Clear from cache
    signedUrlCache.delete(filePath);

    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: 'Delete failed' };
  }
}

/**
 * Clear the signed URL cache
 */
export function clearSignedUrlCache(): void {
  signedUrlCache.clear();
}