
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mergePDFs, downloadBlob, MergeResult, detectEncryptedFiles, EncryptedFileInfo } from '@/utils/pdfUtils';
import { logMergeActivity, calculateTotalSizeMB } from '@/utils/analytics';
import { EncryptedPDFDialog } from '@/components/EncryptedPDFDialog';
import { MergeSuccess } from '@/components/MergeSuccess';
import { MergeError } from '@/components/MergeError';

interface MergeButtonProps {
  files: File[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const MergeButton = ({ files, isLoading, setIsLoading }: MergeButtonProps) => {
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [showEncryptedDialog, setShowEncryptedDialog] = useState(false);
  const [encryptedFiles, setEncryptedFiles] = useState<EncryptedFileInfo[]>([]);
  const [customFilename, setCustomFilename] = useState('merged-document.pdf');
  const { toast } = useToast();

  // Ensure fallback endpoint is passed into env for safety
  const LOG_ENDPOINT = import.meta.env.PUBLIC_LOG_URL || "https://script.google.com/macros/s/AKfycbzuzU_D36YDFN4_6X0xU7drV7GcQW8l6fhQW6vF5jxekTXjJ4hrmVYMr1GPh6mKonW6mA/exec";

  const performMerge = async (includeEncrypted: boolean = true) => {
    setIsLoading(true);
    setMergeResult(null);

    try {
      console.log('Starting PDF merge process with', files.length, 'files');
      
      const result = await mergePDFs(files, includeEncrypted);
      setMergeResult(result);
      
      const totalSizeMB = calculateTotalSizeMB(files);

      if (result.success) {
        await logMergeActivity(files.length, totalSizeMB, false); // ✅ Await here

        const defaultName = files.length > 0 
          ? `merged-${files[0].name.replace('.pdf', '')}.pdf`
          : 'merged-document.pdf';
        setCustomFilename(defaultName);

        if (result.encryptedPagesWarning) {
          toast({
            title: 'Success with blank pages',
            description: `PDF merged successfully. Note: Some pages from encrypted files appear blank.`,
          });
        } else if (result.skippedFiles.length > 0) {
          toast({
            title: 'Partial success',
            description: `Merged ${result.processedFiles.length} files. ${result.skippedFiles.length} files were skipped.`,
          });
        } else {
          toast({
            title: 'Success!',
            description: 'Your PDFs have been merged successfully',
          });
        }
      } else {
        await logMergeActivity(files.length, totalSizeMB, true); // ✅ Await here
        toast({
          title: 'Merge failed',
          description: 'No files could be processed. Please check the error details below.',
          variant: 'destructive',
        });
      }
      
      console.log('PDF merge completed');
    } catch (error) {
      console.error('Error merging PDFs:', error);
      const totalSizeMB = calculateTotalSizeMB(files);
      await logMergeActivity(files.length, totalSizeMB, true); // ✅ Await here
      toast({
        title: 'Merge failed',
        description: 'There was an unexpected error merging your PDF files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({
        title: 'Not enough files',
        description: 'Please upload at least 2 PDF files to merge',
        variant: 'destructive',
      });
      return;
    }

    try {
      const detectedEncryptedFiles = await detectEncryptedFiles(files);

      if (detectedEncryptedFiles.length > 0) {
        setEncryptedFiles(detectedEncryptedFiles);
        setShowEncryptedDialog(true);
      } else {
        await performMerge(true);
      }
    } catch (error) {
      console.error('Error detecting encrypted files:', error);
      const totalSizeMB = calculateTotalSizeMB(files);
      await logMergeActivity(files.length, totalSizeMB, true); // ✅ Await here too
      await performMerge(true);
    }
  };

  const handleConfirmEncrypted = () => {
    setShowEncryptedDialog(false);
    performMerge(true);
  };

  const handleCancelEncrypted = () => {
    setShowEncryptedDialog(false);
    performMerge(false);
  };

  const handleFilenameChange = (newFilename: string) => {
    setCustomFilename(newFilename);
  };

  const getDisplayFilename = () => {
    if (!customFilename) return 'merged-document.pdf';
    if (customFilename.toLowerCase().endsWith('.pdf')) return customFilename;
    return customFilename + '.pdf';
  };

  const handleDownload = () => {
    if (mergeResult?.mergedPdfBytes) {
      const finalFilename = getDisplayFilename();
      downloadBlob(mergeResult.mergedPdfBytes, finalFilename);
      toast({
        title: 'Download started',
        description: `Your merged PDF "${finalFilename}" is downloading`,
      });
    }
  };

  const handleTryAgain = () => {
    setMergeResult(null);
  };

  if (mergeResult) {
    return mergeResult.success ? (
      <MergeSuccess
        mergeResult={mergeResult}
        customFilename={customFilename}
        onFilenameChange={handleFilenameChange}
        onDownload={handleDownload}
      />
    ) : (
      <MergeError
        mergeResult={mergeResult}
        onTryAgain={handleTryAgain}
      />
    );
  }

  return (
    <>
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

      <EncryptedPDFDialog
        open={showEncryptedDialog}
        onOpenChange={setShowEncryptedDialog}
        encryptedFiles={encryptedFiles.map(f => f.name)}
        onConfirm={handleConfirmEncrypted}
        onCancel={handleCancelEncrypted}
      />
    </>
  );
};