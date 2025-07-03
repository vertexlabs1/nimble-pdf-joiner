import React from 'react';
import { Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserStorageFile } from '@/utils/storageAPI';
import { useAuth } from '@/contexts/AuthContext';
import PDFThumbnailCanvas from '@/components/PDFThumbnailCanvas';
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

interface FileGridViewProps {
  files: UserStorageFile[];
  downloading: string | null;
  deleting: string | null;
  onDownload: (file: UserStorageFile) => void;
  onDelete: (file: UserStorageFile) => void;
}

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

export default function FileGridView({ 
  files, 
  downloading, 
  deleting, 
  onDownload, 
  onDelete 
}: FileGridViewProps) {
  const { user } = useAuth();

  return (
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
                onClick={() => onDownload(file)}
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
                      onClick={() => onDelete(file)}
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
  );
}