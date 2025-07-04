import React from 'react';
import { FileText, Eye, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getSignedUrl, type UserStorageFile } from '@/utils/storageAPI';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PDFFileCardProps {
  file: UserStorageFile;
  downloading: boolean;
  deleting: boolean;
  onDownload: (file: UserStorageFile) => void;
  onDelete: (file: UserStorageFile) => void;
}

export default function PDFFileCard({ 
  file, 
  downloading, 
  deleting, 
  onDownload, 
  onDelete 
}: PDFFileCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();

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
      day: 'numeric'
    });
  };

  const handleViewFile = async () => {
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

      // Open PDF in new tab
      window.open(signedUrl, '_blank');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load file for viewing',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="group relative overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="p-4 space-y-3">
        {/* PDF Icon Display */}
        <div className="w-full h-48 bg-muted/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleViewFile}>
          <FileText className="w-16 h-16 text-muted-foreground/60 mb-2" />
          <span className="text-sm text-muted-foreground/70 font-medium">PDF</span>
        </div>
        
        {/* File Info */}
        <div className="space-y-1">
          <h3 className="font-medium text-sm truncate" title={file.displayName}>
            {file.displayName.replace(/\.[^/.]+$/, "")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.fileSize || 0)} • {formatDate(file.created_at)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={handleViewFile}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => onDownload(file)}
            disabled={downloading}
          >
            <Download className="h-3 w-3 mr-1" />
            {downloading ? 'Downloading...' : 'Download'}
          </Button>
        </div>

        {/* Delete Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs text-destructive hover:text-destructive"
              disabled={deleting}
            >
              <Trash2 className="h-3 w-3 mr-1" />
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
                onClick={() => onDelete(file)}
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
}