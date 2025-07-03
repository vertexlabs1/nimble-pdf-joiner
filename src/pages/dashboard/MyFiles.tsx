import React, { useState, useEffect } from 'react';
import { FileText, Upload, FolderOpen, Download, Trash2, Calendar, HardDrive, LayoutGrid, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { listUserFiles, downloadFile, deleteFile, type UserStorageFile } from '@/utils/storageAPI';
import { supabase } from '@/integrations/supabase/client';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import PDFThumbnailCanvas from '@/components/PDFThumbnailCanvas';
import FileGridSkeleton from '@/components/FileGridSkeleton';
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
  const [files, setFiles] = useState<UserStorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      loadFiles();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

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

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
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
        <div className="flex items-center gap-4">
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <LayoutList className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button asChild className="flex items-center gap-2">
            <NavLink to="/dashboard/merge">
              <Upload className="h-4 w-4" />
              Create New File
            </NavLink>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <FileGridSkeleton viewMode={viewMode} count={8} />
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
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
          {files.map((file) => {
            const filePath = user ? `${user.id}/${file.name}` : '';
            
            return (
              <div key={file.id} className="group relative">
                <div className="space-y-2">
                  <PDFThumbnailCanvas
                    filePath={filePath}
                    fileName={file.displayName}
                    size="large"
                    lazy={true}
                  />
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-foreground truncate" title={file.displayName}>
                      {file.displayName.replace(/\.[^/.]+$/, "")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.fileSize)} • {formatDate(file.lastModified).split(',')[0]}
                    </p>
                  </div>
                </div>
              
              {/* Hover overlay with actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-background/80 hover:bg-background border-0 shadow-lg backdrop-blur-sm"
                  onClick={() => handleDownload(file)}
                  disabled={downloading === file.id}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-background/80 hover:bg-destructive/10 border-0 shadow-lg backdrop-blur-sm text-destructive hover:text-destructive"
                      disabled={deleting === file.id}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete File</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{file.displayName}"? This action cannot be undone.
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
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1">
          {files.map((file) => {
            const filePath = user ? `${user.id}/${file.name}` : '';
            
            return (
              <div key={file.id} className="group p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">
                <div className="flex items-center gap-4">
                  <PDFThumbnailCanvas
                    filePath={filePath}
                    fileName={file.displayName}
                    size="small"
                    lazy={true}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate" title={file.displayName}>
                      {file.displayName}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      PDF Document
                    </p>
                  </div>
                  
                  <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 min-w-0">
                      <HardDrive className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{formatFileSize(file.fileSize)}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{formatDate(file.lastModified)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 hover:bg-secondary"
                      onClick={() => handleDownload(file)}
                      disabled={downloading === file.id}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-destructive/10 text-destructive hover:text-destructive"
                          disabled={deleting === file.id}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete File</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{file.displayName}"? This action cannot be undone.
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}