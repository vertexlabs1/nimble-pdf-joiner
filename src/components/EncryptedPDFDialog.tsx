
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface EncryptedPDFDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  encryptedFiles: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export const EncryptedPDFDialog = ({
  open,
  onOpenChange,
  encryptedFiles,
  onConfirm,
  onCancel,
}: EncryptedPDFDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-100 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <AlertDialogTitle className="text-lg">
              Password Protected Files Detected
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              The following PDF files are password protected:
            </p>
            <div className="bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
              <ul className="text-sm space-y-1">
                {encryptedFiles.map((filename, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></span>
                    <span className="break-all">{filename}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Note:</strong> The combined PDF file will not be password protected.
              </p>
              <p>
                Do you want to continue with the merge?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            No
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Yes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
