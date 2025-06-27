
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PDFFileWithPages } from '@/types/pdf';
import { LazyPageThumbnailGrid } from '@/components/LazyPageThumbnailGrid';
import { PageReplacementModal } from '@/components/PageReplacementModal';

interface PageEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: PDFFileWithPages;
  allFiles: PDFFileWithPages[];
  onFileUpdate: (updatedFile: PDFFileWithPages) => void;
}

export const PageEditModal = ({
  open,
  onOpenChange,
  file,
  allFiles,
  onFileUpdate,
}: PageEditModalProps) => {
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);

  const handlePageEdit = (pageIndex: number) => {
    setSelectedPageIndex(pageIndex);
    setShowReplacementModal(true);
  };

  const handlePageReplace = (updatedFile: PDFFileWithPages) => {
    onFileUpdate(updatedFile);
    setShowReplacementModal(false);
    setSelectedPageIndex(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Pages - {file.originalFile.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Click on any page thumbnail to replace or remove it. Thumbnails load automatically.
            </p>
            
            <LazyPageThumbnailGrid
              file={file}
              onPageEdit={handlePageEdit}
            />
          </div>
        </DialogContent>
      </Dialog>

      {selectedPageIndex !== null && (
        <PageReplacementModal
          open={showReplacementModal}
          onOpenChange={setShowReplacementModal}
          targetFile={file}
          targetPageIndex={selectedPageIndex}
          allFiles={allFiles}
          onReplace={handlePageReplace}
        />
      )}
    </>
  );
};
