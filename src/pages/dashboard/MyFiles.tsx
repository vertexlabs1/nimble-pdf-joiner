import React, { useState, useEffect } from 'react';
import { FileText, Upload, FolderOpen, LayoutGrid, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useFileOperations } from '@/hooks/useFileOperations';
import FileGridSkeleton from '@/components/FileGridSkeleton';
import FileGridView from '@/components/dashboard/FileGridView';
import FileListView from '@/components/dashboard/FileListView';

export default function MyFiles() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { user, loading: authLoading } = useAuth();
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
        <FileGridView
          files={files}
          downloading={downloading}
          deleting={deleting}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      ) : (
        <FileListView
          files={files}
          downloading={downloading}
          deleting={deleting}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}