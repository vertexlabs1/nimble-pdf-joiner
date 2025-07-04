import React, { useState, useEffect, useRef } from 'react';
import { Upload, FolderOpen, LayoutGrid, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useFileOperations } from '@/hooks/useFileOperations';
import FileGridSkeleton from '@/components/FileGridSkeleton';
import PDFFileCard from '@/components/PDFFileCard';

export default function EnhancedMyFiles() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading: authLoading } = useAuth();
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
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {files.map((file) => (
            <PDFFileCard
              key={file.id}
              file={file}
              downloading={downloading === file.id}
              deleting={deleting === file.id}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}