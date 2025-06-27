
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PDFFileWithPages } from '@/types/pdf';
import { replacePageInPDF, processFileWithPages } from '@/utils/pdfPageUtils';
import { Upload, Files, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PageReplacementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetFile: PDFFileWithPages;
  targetPageIndex: number;
  allFiles: PDFFileWithPages[];
  onReplace: (updatedFile: PDFFileWithPages) => void;
}

export const PageReplacementModal = ({
  open,
  onOpenChange,
  targetFile,
  targetPageIndex,
  allFiles,
  onReplace,
}: PageReplacementModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleReplaceFromUploads = async (sourceFile: PDFFileWithPages, sourcePageIndex: number) => {
    setIsLoading(true);
    try {
      const updatedFile = await replacePageInPDF(targetFile, targetPageIndex, sourceFile, sourcePageIndex);
      onReplace(updatedFile);
      toast({
        title: 'Page replaced',
        description: `Page ${targetPageIndex + 1} has been replaced successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to replace page. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplaceFromComputer = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsLoading(true);
      try {
        const newFileWithPages = await processFileWithPages(file);
        if (newFileWithPages.pages.length > 0) {
          // Use the first page of the new file
          const updatedFile = await replacePageInPDF(targetFile, targetPageIndex, newFileWithPages, 0);
          onReplace(updatedFile);
          toast({
            title: 'Page replaced',
            description: `Page ${targetPageIndex + 1} has been replaced with a page from ${file.name}.`,
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to process the uploaded file. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    input.click();
  };

  const otherFiles = allFiles.filter(f => f.originalFile.name !== targetFile.originalFile.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Replace Page {targetPageIndex + 1} from {targetFile.originalFile.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current page preview */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Current page:</p>
            <img
              src={targetFile.pages[targetPageIndex]?.thumbnail}
              alt={`Current page ${targetPageIndex + 1}`}
              className="mx-auto border rounded-lg max-w-32"
            />
          </div>

          {/* Replacement options */}
          <div className="space-y-4">
            <h3 className="font-medium">Choose replacement source:</h3>
            
            {/* From computer */}
            <Button
              onClick={handleReplaceFromComputer}
              disabled={isLoading}
              className="w-full justify-start h-auto p-4"
              variant="outline"
            >
              <Upload className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Upload from computer</div>
                <div className="text-sm text-gray-500">Select a PDF file from your device</div>
              </div>
            </Button>

            {/* From uploaded files */}
            {otherFiles.length > 0 && (
              <div>
                <Button
                  disabled={isLoading}
                  className="w-full justify-start h-auto p-4 mb-3"
                  variant="outline"
                >
                  <Files className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Choose from uploaded files</div>
                    <div className="text-sm text-gray-500">Select a page from your other PDFs</div>
                  </div>
                </Button>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {otherFiles.map((file, fileIndex) => (
                    <div key={file.originalFile.name} className="border rounded-lg p-3">
                      <p className="font-medium text-sm mb-2">{file.originalFile.name}</p>
                      <div className="grid grid-cols-4 gap-2">
                        {file.pages.map((page, pageIndex) => (
                          <button
                            key={pageIndex}
                            onClick={() => handleReplaceFromUploads(file, pageIndex)}
                            disabled={isLoading}
                            className="relative group"
                          >
                            <img
                              src={page.thumbnail}
                              alt={`Page ${page.pageNumber}`}
                              className="w-full border rounded hover:border-blue-300 transition-colors"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs py-1 text-center rounded-b">
                              Page {page.pageNumber}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
