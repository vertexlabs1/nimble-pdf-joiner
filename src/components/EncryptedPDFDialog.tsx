
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
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="font-medium text-yellow-800 mb-1">
                  ⚠️ Important Notice
                </p>
                <p className="text-yellow-700">
                  Pages from encrypted files will appear <strong>blank</strong> in the merged PDF. 
                  This is a technical limitation - the content cannot be decrypted without the password.
                </p>
              </div>
              <p>
                Do you want to continue? You can choose to:
              </p>
              <ul className="text-xs text-gray-600 ml-4 space-y-1">
                <li>• <strong>Yes</strong> - Include files (pages will be blank)</li>
                <li>• <strong>No</strong> - Skip encrypted files entirely</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            No, Skip Them
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Yes, Include (Blank Pages)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
