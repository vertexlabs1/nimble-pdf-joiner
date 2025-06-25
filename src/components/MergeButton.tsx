import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, Loader2, AlertTriangle, Info, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mergePDFs, downloadBlob, MergeResult, detectEncryptedFiles, EncryptedFileInfo } from '@/utils/pdfUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EncryptedPDFDialog } from '@/components/EncryptedPDFDialog';

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

  const performMerge = async (includeEncrypted: boolean = true) => {
    setIsLoading(true);
    setMergeResult(null);

    try {
      console.log('Starting PDF merge process with', files.length, 'files');
      
      const result = await mergePDFs(files, includeEncrypted);
      setMergeResult(result);
      
      if (result.success) {
        // Set a default filename based on the first file or use generic name
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

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({
        title: 'Not enough files',
        description: 'Please upload at least 2 PDF files to merge',
        variant: 'destructive',
      });
      return;
    }

    // Check for encrypted files first
    try {
      const detectedEncryptedFiles = await detectEncryptedFiles(files);
      
      if (detectedEncryptedFiles.length > 0) {
        // Show confirmation dialog
        setEncryptedFiles(detectedEncryptedFiles);
        setShowEncryptedDialog(true);
      } else {
        // No encrypted files, proceed directly
        await performMerge(true);
      }
    } catch (error) {
      console.error('Error detecting encrypted files:', error);
      // If detection fails, try to merge anyway
      await performMerge(true);
    }
  };

  const handleConfirmEncrypted = () => {
    setShowEncryptedDialog(false);
    performMerge(true); // Include encrypted files
  };

  const handleCancelEncrypted = () => {
    setShowEncryptedDialog(false);
    performMerge(false); // Skip encrypted files
  };

  const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Simply set the value without automatically adding .pdf
    setCustomFilename(e.target.value);
  };

  const handleFilenameBlur = () => {
    // Add .pdf extension when user finishes typing (if not already present)
    if (customFilename && !customFilename.toLowerCase().endsWith('.pdf')) {
      setCustomFilename(customFilename + '.pdf');
    }
  };

  const getDisplayFilename = () => {
    // For preview purposes, show what the final filename will be
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

  if (mergeResult) {
    if (mergeResult.success) {
      return (
        <div className="space-y-4">
          {mergeResult.encryptedPagesWarning && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Encrypted Content Notice:</p>
                  <p className="text-sm">
                    Some pages in your merged PDF appear blank because they came from password-protected files. 
                    This is a technical limitation - the original content remains encrypted and cannot be displayed without the password.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

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
            <p className="text-green-700 mb-6">
              {mergeResult.processedFiles.length} PDF files combined into one document with {mergeResult.totalPages} total pages.
            </p>
            
            {/* Custom filename input */}
            <div className="mb-6 max-w-md mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <Edit3 className="h-4 w-4 text-gray-600" />
                <label htmlFor="filename" className="text-sm font-medium text-gray-700">
                  Filename:
                </label>
              </div>
              <Input
                id="filename"
                type="text"
                value={customFilename}
                onChange={handleFilenameChange}
                onBlur={handleFilenameBlur}
                placeholder="Enter filename..."
                className="text-center"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your file will be saved as: <span className="font-medium">{getDisplayFilename()}</span>
              </p>
            </div>
            
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
