import { useCallback } from 'react';
import { Upload, FileText, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PDFUploaderProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}

export const PDFUploader = ({ onFilesAdded, disabled }: PDFUploaderProps) => {
  const { toast } = useToast();

  const validateFiles = (files: FileList | File[]): File[] => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    
    for (const file of fileArray) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a PDF file`,
          variant: 'destructive',
        });
        continue;
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: 'File too large',
          description: `${file.name} is larger than 50MB`,
          variant: 'destructive',
        });
        continue;
      }
      
      validFiles.push(file);
    }
    
    return validFiles;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    const files = validateFiles(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesAdded(files);
      toast({
        title: 'Files added',
        description: `${files.length} PDF file(s) ready to merge`,
      });
    }
  }, [onFilesAdded, disabled, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || disabled) return;
    
    const files = validateFiles(e.target.files);
    if (files.length > 0) {
      onFilesAdded(files);
      toast({
        title: 'Files added',
        description: `${files.length} PDF file(s) ready to merge`,
      });
    }
    
    // Reset input
    e.target.value = '';
  };

  return (
    <TooltipProvider>
      <div
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200
          ${disabled 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
            : 'border-blue-300 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !disabled && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className={`p-4 rounded-full ${disabled ? 'bg-gray-200' : 'bg-blue-100'}`}>
            <Upload className={`h-8 w-8 ${disabled ? 'text-gray-400' : 'text-blue-600'}`} />
          </div>
          
          <div>
            <h3 className={`text-lg font-semibold mb-2 ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
              {disabled ? 'Processing...' : 'Drop PDF files here'}
            </h3>
            <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
              {disabled ? 'Please wait while we process your files' : 'or click to browse and select files'}
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs text-gray-500 mt-2 cursor-help inline-flex items-center gap-1">
                  Maximum file size: 50MB per file
                  <Info className="h-3 w-3" />
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  File size limits exist due to browser memory constraints. 
                  Total processing capacity depends on your device's available 
                  memory, not our tool's limitations.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          {!disabled && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <FileText className="h-4 w-4" />
              <span>PDF files only</span>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
