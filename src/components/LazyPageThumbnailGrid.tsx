
import { PDFFileWithPages } from '@/types/pdf';
import { ThumbnailLoadingProgress } from '@/components/ThumbnailLoadingProgress';
import { ThumbnailItem } from '@/components/ThumbnailItem';
import { useThumbnailLoader } from '@/hooks/useThumbnailLoader';
import { createPlaceholderThumbnail } from '@/utils/thumbnailUtils';

interface LazyPageThumbnailGridProps {
  file: PDFFileWithPages;
  onPageEdit: (pageIndex: number) => void;
}

export const LazyPageThumbnailGrid = ({ file, onPageEdit }: LazyPageThumbnailGridProps) => {
  const {
    thumbnails,
    loadingProgress,
    isLoading,
    handleCancelLoading,
  } = useThumbnailLoader({ file });

  return (
    <div className="space-y-4">
      {/* Loading progress and cancel button */}
      {isLoading && (
        <ThumbnailLoadingProgress
          loadingProgress={loadingProgress}
          onCancel={handleCancelLoading}
        />
      )}

      {/* Thumbnail grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {file.pages.map((page, index) => (
          <ThumbnailItem
            key={`${file.originalFile.name}-page-${index}`}
            thumbnail={thumbnails[index] || createPlaceholderThumbnail(page.pageNumber)}
            pageNumber={page.pageNumber}
            fileName={file.originalFile.name}
            index={index}
            onEdit={() => onPageEdit(index)}
          />
        ))}
      </div>
    </div>
  );
};
