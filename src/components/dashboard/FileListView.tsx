import React from 'react';
import { Download, Trash2, Calendar, HardDrive } from 'lucide-react';
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

interface FileListViewProps {
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

export default function FileListView({ 
  files, 
  downloading, 
  deleting, 
  onDownload, 
  onDelete 
}: FileListViewProps) {
  const { user } = useAuth();

  return (
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
          </div>
        );
      })}
    </div>
  );
}