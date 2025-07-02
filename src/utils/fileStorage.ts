import { supabase } from '@/integrations/supabase/client';

export interface UserFile {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
  updated_at: string;
}

export async function uploadMergedPDF(
  pdfBytes: Uint8Array,
  filename: string,
  originalFiles: File[]
): Promise<{ success: boolean; fileRecord?: UserFile; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Generate unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${timestamp}_${cleanFilename}`;
    const filePath = `${user.id}/${uniqueFilename}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user_files')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Save metadata to database
    const fileSize = pdfBytes.length;
    const originalFilename = originalFiles.map(f => f.name).join(', ');

    const { data: fileRecord, error: dbError } = await supabase
      .from('user_files')
      .insert({
        user_id: user.id,
        filename: uniqueFilename,
        original_filename: originalFilename,
        file_path: filePath,
        file_size: fileSize
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('user_files').remove([filePath]);
      return { success: false, error: dbError.message };
    }

    return { success: true, fileRecord };
  } catch (error) {
    console.error('Upload failed:', error);
    return { success: false, error: 'Upload failed' };
  }
}

export async function getUserFiles(): Promise<UserFile[]> {
  try {
    const { data, error } = await supabase
      .from('user_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user files:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user files:', error);
    return [];
  }
}

export async function downloadUserFile(filePath: string): Promise<{ success: boolean; blob?: Blob; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from('user_files')
      .download(filePath);

    if (error) {
      console.error('Download error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, blob: data };
  } catch (error) {
    console.error('Download failed:', error);
    return { success: false, error: 'Download failed' };
  }
}

export async function deleteUserFile(fileId: string, filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from('user_files')
      .remove([filePath]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      return { success: false, error: storageError.message };
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('user_files')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      console.error('Database deletion error:', dbError);
      return { success: false, error: dbError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete failed:', error);
    return { success: false, error: 'Delete failed' };
  }
}