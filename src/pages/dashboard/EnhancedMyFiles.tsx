import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, FolderOpen, LayoutGrid, LayoutList, Trash2, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useFileOperations } from '@/hooks/useFileOperations';
import { useToast } from '@/hooks/use-toast';
import FileGridSkeleton from '@/components/FileGridSkeleton';
import PDFThumbnailPreview from '@/components/PDFThumbnailPreview';
import PDFViewer from '@/components/PDFViewer';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getSignedUrl, type UserStorageFile } from '@/utils/storageAPI';

export default function EnhancedMyFiles() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<UserStorageFile | null>(null);
  const [viewingFile, setViewingFile] = useState<{ file: UserStorageFile; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { 
    files, 
    loading, 
    downloading, 
    deleting, 
    uploading,
    loadFiles, 
    handleDownload, 
    handleDelete,
    handleUpload 
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

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          <Button 
            onClick={handleFileUpload} 
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload Files'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
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
              Upload your first PDF documents to get started
            </p>
            <Button onClick={handleFileUpload} className="mt-4">
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {files.map((file) => {
            const filePath = user ? `${user.id}/${file.name}` : '';
            
            return (
              <Card key={file.id} className="group relative overflow-hidden hover:shadow-md transition-all duration-200">
                <div className="p-4 space-y-3">
                  <PDFThumbnailPreview
                    filePath={filePath}
                    fileName={file.displayName}
                    onClick={() => handleViewFile(file)}
                  />
                  
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm truncate" title={file.displayName}>
                      {file.displayName.replace(/\.[^/.]+$/, "")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.fileSize || 0)} • {formatDate(file.created_at).split(',')[0]}
                    </p>
                  </div>
                </div>

                {/* Hover overlay with actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-background/80 hover:bg-background border-0 shadow-lg backdrop-blur-sm"
                    onClick={() => handleViewFile(file)}
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
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
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => {
            const filePath = user ? `${user.id}/${file.name}` : '';
            
            return (
              <Card key={file.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative group cursor-pointer w-20 h-26" onClick={() => handleViewFile(file)}>
                    <PDFThumbnailPreview
                      filePath={filePath}
                      fileName={file.displayName}
                      className="w-20 h-26"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate" title={file.displayName}>
                      {file.displayName.replace(/\.[^/.]+$/, "")}
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
            );
          })}
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