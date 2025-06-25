
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mergePDFs, downloadBlob, MergeResult } from '@/utils/pdfUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MergeButtonProps {
  files: File[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const MergeButton = ({ files, isLoading, setIsLoading }: MergeButtonProps) => {
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const { toast } = useToast();

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({
        title: 'Not enough files',
        description: 'Please upload at least 2 PDF files to merge',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setMergeResult(null);

    try {
      console.log('Starting PDF merge process with', files.length, 'files');
      
      const result = await mergePDFs(files);
      setMergeResult(result);
      
      if (result.success) {
        if (result.skippedFiles.length > 0) {
          const encryptedFiles = result.skippedFiles.filter(f => 
            f.reason.includes('encrypted') || f.reason.includes('blank pages')
          );
          
          if (encryptedFiles.length > 0) {
            toast({
              title: 'Partial success with encrypted files',
              description: `Merged ${result.processedFiles.length} files. ${encryptedFiles.length} encrypted files were skipped to prevent blank pages.`,
            });
          } else {
            toast({
              title: 'Partial success',
              description: `Merged ${result.processedFiles.length} files. ${result.skippedFiles.length} files were skipped.`,
            });
          }
        } else {
          toast({
            title: 'Success!',
            description: 'Your PDFs have been merged successfully',
          });
        }
      } else {
        toast({
          title: 'Merge failed',
          description: 'No files could be processed. Please check the error details below.',
          variant: 'destructive',
        });
      }
      
      console.log('PDF merge completed');
    } catch (error) {
      console.error('Error merging PDFs:', error);
      toast({
        title: 'Merge failed',
        description: 'There was an unexpected error merging your PDF files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (mergeResult?.mergedPdfBytes) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `merged-pdf-${timestamp}.pdf`;
      downloadBlob(mergeResult.mergedPdfBytes, filename);
      
      toast({
        title: 'Download started',
        description: `Your merged PDF "${filename}" is downloading`,
      });
    }
  };

  if (mergeResult) {
    if (mergeResult.success) {
      return (
        <div className="space-y-4">
          {mergeResult.skippedFiles.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Some files were skipped:</p>
                  <ul className="text-sm space-y-1">
                    {mergeResult.skippedFiles.map((file, index) => (
                      <li key={index} className="flex flex-col">
                        <span className="font-medium">{file.name}</span>
                        <span className="text-muted-foreground">{file.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              PDF Successfully Merged!
            </h3>
            <p className="text-green-700 mb-4">
              {mergeResult.processedFiles.length} PDF files combined into one document with {mergeResult.totalPages} total pages.
            </p>
            <Button
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              Download Merged PDF
            </Button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">No files could be processed:</p>
                <ul className="text-sm space-y-1">
                  {mergeResult.skippedFiles.map((file, index) => (
                    <li key={index} className="flex flex-col">
                      <span className="font-medium">{file.name}</span>
                      <span className="text-muted-foreground">{file.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="text-center">
            <Button
              onClick={() => setMergeResult(null)}
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }
  }

  return (
    <Button
      onClick={handleMerge}
      disabled={isLoading || files.length < 2}
      size="lg"
      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Merging PDFs...
        </>
      ) : (
        <>
          <FileText className="h-5 w-5 mr-2" />
          Merge {files.length} PDFs
        </>
      )}
    </Button>
  );
};
