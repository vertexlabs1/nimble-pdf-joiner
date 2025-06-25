
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { MergeResult } from '@/utils/pdfUtils';

interface MergeErrorProps {
  mergeResult: MergeResult;
  onTryAgain: () => void;
}

export const MergeError = ({ mergeResult, onTryAgain }: MergeErrorProps) => {
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
        <Button onClick={onTryAgain} variant="outline">
          Try Again
        </Button>
      </div>
    </div>
  );
};
