
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ThumbnailLoadingProgressProps {
  loadingProgress: number;
  onCancel: () => void;
}

export const ThumbnailLoadingProgress = ({ loadingProgress, onCancel }: ThumbnailLoadingProgressProps) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-blue-800">
          Loading thumbnails... {Math.round(loadingProgress)}%
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${loadingProgress}%` }}
        />
      </div>
      <p className="text-xs text-blue-600 mt-1">
        Thumbnails appear as they load. You can edit pages immediately.
      </p>
    </div>
  );
};
