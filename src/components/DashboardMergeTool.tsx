import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PDFUploader } from '@/components/PDFUploader';
import { FileList } from '@/components/FileList';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, FileText, Loader2 } from 'lucide-react';
import { uploadMergedPDF } from '@/utils/fileStorage';
import { mergePDFs, downloadBlob, MergeResult, detectEncryptedFiles, EncryptedFileInfo } from '@/utils/pdfUtils';
import { logMergeActivity, calculateTotalSizeMB } from '@/utils/analytics';
import { EncryptedPDFDialog } from '@/components/EncryptedPDFDialog';
import { MergeSuccess } from '@/components/MergeSuccess';
import { MergeError } from '@/components/MergeError';

export const DashboardMergeTool = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [storeInAccount, setStoreInAccount] = useState(false);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [showEncryptedDialog, setShowEncryptedDialog] = useState(false);
  const [encryptedFiles, setEncryptedFiles] = useState<EncryptedFileInfo[]>([]);
  const [customFilename, setCustomFilename] = useState('merged-document.pdf');

  const handleFilesAdded = (newFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    setMergeResult(null);
  };

  const handleReorderFiles = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  const performMerge = async (includeEncrypted: boolean = true) => {
    setIsLoading(true);
    setMergeResult(null);

    try {
      const result = await mergePDFs(files, includeEncrypted);
      setMergeResult(result);
      
      const totalSizeMB = calculateTotalSizeMB(files);

      if (result.success) {
        // Log successful merges
        logMergeActivity(files.length, totalSizeMB, false).catch(err => {
          console.warn('Analytics logging failed silently:', err);
        });

        const defaultName = files.length > 0 
          ? `merged-${files[0].name.replace('.pdf', '')}.pdf`
          : 'merged-document.pdf';
        setCustomFilename(defaultName);

        // Handle storage if enabled
        if (storeInAccount && result.mergedPdfBytes && user) {
          try {
            const uploadResult = await uploadMergedPDF(
              result.mergedPdfBytes,
              defaultName,
              files
            );

            if (uploadResult.success) {
              toast({
                title: 'File saved successfully!',
                description: `Your merged PDF has been saved to your account and can be accessed from "My Files".`,
              });
            } else {
              toast({
                title: 'File merge succeeded, but storage failed',
                description: uploadResult.error || 'Could not save file to your account',
                variant: 'destructive',
              });
            }
          } catch (error) {
            console.error('Error uploading file:', error);
            toast({
              title: 'Storage error',
              description: 'The PDF was merged successfully but could not be saved to your account',
              variant: 'destructive',
            });
          }
        }

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
        logMergeActivity(files.length, totalSizeMB, true).catch(err => {
          console.warn('Analytics logging failed silently:', err);
        });
        
        toast({
          title: 'Merge failed',
          description: 'No files could be processed. Please check the error details below.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error merging PDFs:', error);
      const totalSizeMB = calculateTotalSizeMB(files);
      
      logMergeActivity(files.length, totalSizeMB, true).catch(err => {
        console.warn('Analytics logging failed silently:', err);
      });
      
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

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Merge PDFs</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Combine multiple PDF files into a single document
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-card-foreground">
            Upload PDF Files
          </h3>
          <PDFUploader onFilesAdded={handleFilesAdded} />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground">
              Files to Merge ({files.length})
            </h3>
            <FileList 
              files={files} 
              onReorder={handleReorderFiles}
              onRemove={handleRemoveFile}
            />
          </div>
        )}

        {/* Storage Toggle */}
        {files.length > 0 && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="store-in-account"
                checked={storeInAccount}
                onCheckedChange={(checked) => setStoreInAccount(checked as boolean)}
              />
              <label
                htmlFor="store-in-account"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Store this file in my account
              </label>
            </div>
            
            {storeInAccount && (
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Your merged file will be securely stored in your account for later access. 
                  You can download it anytime from the "My Files" section.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Merge Button */}
        {files.length > 0 && !mergeResult && (
          <div className="border-t pt-6">
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
          </div>
        )}

        {/* Merge Results */}
        {mergeResult && (
          <div className="border-t pt-6">
            {mergeResult.success ? (
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
            )}
          </div>
        )}

        {/* Encrypted PDF Dialog */}
        <EncryptedPDFDialog
          open={showEncryptedDialog}
          onOpenChange={setShowEncryptedDialog}
          encryptedFiles={encryptedFiles.map(f => f.name)}
          onConfirm={handleConfirmEncrypted}
          onCancel={handleCancelEncrypted}
        />
      </Card>
    </div>
  );
};