import React, { useState, useEffect } from 'react';
import { FileText, Upload, FolderOpen, Download, Trash2, Calendar, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getUserFiles, downloadUserFile, deleteUserFile, type UserFile } from '@/utils/fileStorage';
import { NavLink } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function MyFiles() {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const userFiles = await getUserFiles();
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

  const handleDownload = async (file: UserFile) => {
    setDownloading(file.id);
    try {
      const result = await downloadUserFile(file.file_path);
      if (result.success && result.blob) {
        // Create download link
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Download started',
          description: `Your file "${file.filename}" is downloading`,
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

  const handleDelete = async (file: UserFile) => {
    setDeleting(file.id);
    try {
      const result = await deleteUserFile(file.id, file.file_path);
      if (result.success) {
        setFiles(files.filter(f => f.id !== file.id));
        toast({
          title: 'File deleted',
          description: `"${file.filename}" has been deleted successfully`,
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

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Files</h1>
          <p className="text-muted-foreground">Manage your stored PDF documents</p>
        </div>
        <Button asChild className="flex items-center gap-2">
          <NavLink to="/dashboard/merge">
            <Upload className="h-4 w-4" />
            Create New File
          </NavLink>
        </Button>
      </div>

      {loading ? (
        <div className="bg-card rounded-xl p-12 border shadow-sm text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="animate-spin p-4 bg-muted/50 rounded-full w-fit mx-auto">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground">Loading files...</h3>
          </div>
        </div>
      ) : files.length === 0 ? (
        <div className="bg-card rounded-xl p-12 border shadow-sm text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground">No files yet</h3>
            <p className="text-muted-foreground">
              Use the Merge tool to create and save your first PDF document
            </p>
            <Button asChild className="mt-4">
              <NavLink to="/dashboard/merge">
                <Upload className="h-4 w-4 mr-2" />
                Go to Merge Tool
              </NavLink>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <Card key={file.id} className="p-6 space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-card-foreground truncate" title={file.filename}>
                      {file.filename}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate" title={file.original_filename}>
                      From: {file.original_filename}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  <span>{formatFileSize(file.file_size)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(file.created_at)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleDownload(file)}
                  disabled={downloading === file.id}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloading === file.id ? 'Downloading...' : 'Download'}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={deleting === file.id}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete File</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{file.filename}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(file)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}