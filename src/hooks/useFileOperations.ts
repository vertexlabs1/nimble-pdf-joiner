import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { listUserFiles, downloadFile, deleteFile, uploadFiles, type UserStorageFile } from '@/utils/storageAPI';
import { useAuth } from '@/contexts/AuthContext';

export function useFileOperations() {
  const [files, setFiles] = useState<UserStorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadFiles = async () => {
    setLoading(true);
    try {
      const userFiles = await listUserFiles();
      setFiles(userFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: 'Error loading files',
        description: 'Could not load your files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: UserStorageFile) => {
    setDownloading(file.id);
    try {
      if (!user) return;
      
      const filePath = `${user.id}/${file.name}`;
      const result = await downloadFile(filePath, file.displayName);
      
      if (result.success) {
        toast({
          title: 'Download started',
          description: `Your file "${file.displayName}" is downloading`,
        });
      } else {
        toast({
          title: 'Download failed',
          description: result.error || 'Could not download the file',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Download failed',
        description: 'An unexpected error occurred while downloading the file',
        variant: 'destructive',
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (file: UserStorageFile) => {
    setDeleting(file.id);
    try {
      if (!user) return;
      
      const filePath = `${user.id}/${file.name}`;
      const result = await deleteFile(filePath);
      
      if (result.success) {
        setFiles(files.filter(f => f.id !== file.id));
        toast({
          title: 'File deleted',
          description: `"${file.displayName}" has been deleted successfully`,
        });
      } else {
        toast({
          title: 'Delete failed',
          description: result.error || 'Could not delete the file',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Delete failed',
        description: 'An unexpected error occurred while deleting the file',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleUpload = async (fileList: FileList) => {
    setUploading(true);
    try {
      const filesArray = Array.from(fileList);
      const result = await uploadFiles(filesArray);
      
      if (result.success && result.uploadedFiles) {
        setFiles([...result.uploadedFiles, ...files]);
        toast({
          title: 'Upload successful',
          description: `${result.uploadedFiles.length} file(s) uploaded successfully`,
        });
      } else {
        toast({
          title: 'Upload failed',
          description: result.error || 'Could not upload files',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Upload failed',
        description: 'An unexpected error occurred while uploading files',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return {
    files,
    loading,
    downloading,
    deleting,
    uploading,
    loadFiles,
    handleDownload,
    handleDelete,
    handleUpload,
  };
}