import React, { useState, useEffect } from 'react';
import { FileText, Upload, FolderOpen, LayoutGrid, LayoutList, Trash2, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useFileOperations } from '@/hooks/useFileOperations';
import { useToast } from '@/hooks/use-toast';
import FileGridSkeleton from '@/components/FileGridSkeleton';
import PDFThumbnail from '@/components/PDFThumbnail';
import PDFViewer from '@/components/PDFViewer';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getSignedUrl, type UserStorageFile } from '@/utils/storageAPI';

export default function EnhancedMyFiles() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<UserStorageFile | null>(null);
  const [viewingFile, setViewingFile] = useState<{ file: UserStorageFile; url: string } | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { 
    files, 
    loading, 
    downloading, 
    deleting, 
    loadFiles, 
    handleDownload, 
    handleDelete 
  } = useFileOperations();

  useEffect(() => {
    if (!authLoading && user) {
      loadFiles();
    }
  }, [authLoading, user]);

  const handleViewFile = async (file: UserStorageFile) => {
    try {
      if (!user) return;
      
      const filePath = `${user.id}/${file.name}`;
      const signedUrl = await getSignedUrl(filePath);
      
      if (!signedUrl) {
        toast({
          title: 'Error',
          description: 'Failed to load file for viewing',
          variant: 'destructive'
        });
        return;
      }

      setViewingFile({ file, url: signedUrl });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load file for viewing',
        variant: 'destructive'
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Files</h1>
            <p className="text-muted-foreground">Manage your stored PDF documents</p>
          </div>
        </div>
        <FileGridSkeleton viewMode={viewMode} count={8} />
      </div>
    );
  }

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

      {files.length === 0 ? (
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {files.map((file) => (
            <Card key={file.id} className="p-4 space-y-3 hover:shadow-md transition-shadow">
              <PDFThumbnail
                file={file.signedUrl || ''}
                onClick={() => handleViewFile(file)}
                size="medium"
              />
              
              <div className="space-y-1">
                <h3 className="font-medium text-sm truncate" title={file.displayName}>
                  {file.displayName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.fileSize || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(file.created_at)}
                </p>
              </div>

              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewFile(file)}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  disabled={downloading === file.id}
                  className="flex-1"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deleting === file.id}
                      className="flex-1"
                    >
                      <Trash2 className="h-3 w-3" />
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
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.id} className="p-4">
              <div className="flex items-center gap-4">
                <PDFThumbnail
                  file={file.signedUrl || ''}
                  size="small"
                  onClick={() => handleViewFile(file)}
                />
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate" title={file.displayName}>
                    {file.displayName}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>{formatFileSize(file.fileSize || 0)}</span>
                    <span>{formatDate(file.created_at)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewFile(file)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(file)}
                    disabled={downloading === file.id}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloading === file.id ? 'Downloading...' : 'Download'}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deleting === file.id}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
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
            </Card>
          ))}
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewingFile && (
        <PDFViewer
          file={viewingFile.url}
          filename={viewingFile.file.displayName}
          onClose={() => setViewingFile(null)}
          onDownload={() => handleDownload(viewingFile.file)}
        />
      )}
    </div>
  );
}