
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, FileText, Info, AlertTriangle } from 'lucide-react';
import { MergeResult } from '@/utils/pdfUtils';
import { FilenameInput } from '@/components/FilenameInput';

interface MergeSuccessProps {
  mergeResult: MergeResult;
  customFilename: string;
  onFilenameChange: (filename: string) => void;
  onDownload: () => void;
}

export const MergeSuccess = ({ 
  mergeResult, 
  customFilename, 
  onFilenameChange, 
  onDownload 
}: MergeSuccessProps) => {
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
        
        <FilenameInput
          defaultFilename={customFilename}
          onFilenameChange={onFilenameChange}
        />
        
        <Button
          onClick={onDownload}
          className="bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          <Download className="h-5 w-5 mr-2" />
          Download Merged PDF
        </Button>
      </div>
    </div>
  );
};
