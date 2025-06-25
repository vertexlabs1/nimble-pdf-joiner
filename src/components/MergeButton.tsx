
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mergePDFs, downloadBlob } from '@/utils/pdfUtils';

interface MergeButtonProps {
  files: File[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const MergeButton = ({ files, isLoading, setIsLoading }: MergeButtonProps) => {
  const [mergedData, setMergedData] = useState<Uint8Array | null>(null);
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
    setMergedData(null);

    try {
      console.log('Starting PDF merge process with', files.length, 'files');
      
      const mergedPdfBytes = await mergePDFs(files);
      setMergedData(mergedPdfBytes);
      
      toast({
        title: 'Success!',
        description: 'Your PDFs have been merged successfully',
      });
      
      console.log('PDF merge completed successfully');
    } catch (error) {
      console.error('Error merging PDFs:', error);
      toast({
        title: 'Merge failed',
        description: 'There was an error merging your PDF files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (mergedData) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `merged-pdf-${timestamp}.pdf`;
      downloadBlob(mergedData, filename);
      
      toast({
        title: 'Download started',
        description: `Your merged PDF "${filename}" is downloading`,
      });
    }
  };

  if (mergedData) {
    return (
      <div className="space-y-4">
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
            Your {files.length} PDF files have been combined into one document.
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
