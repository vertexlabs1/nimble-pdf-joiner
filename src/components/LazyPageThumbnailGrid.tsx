
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PDFFileWithPages } from '@/types/pdf';
import { Edit } from 'lucide-react';
import { generatePageThumbnails } from '@/utils/pdfPageUtils';

interface LazyPageThumbnailGridProps {
  file: PDFFileWithPages;
  onPageEdit: (pageIndex: number) => void;
}

export const LazyPageThumbnailGrid = ({ file, onPageEdit }: LazyPageThumbnailGridProps) => {
  const [hoveredPage, setHoveredPage] = useState<number | null>(null);
  const [loadedFile, setLoadedFile] = useState<PDFFileWithPages>(file);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);

  // Lazy load thumbnails when component mounts
  useEffect(() => {
    const loadThumbnails = async () => {
      // Only load if we don't have thumbnails yet
      if (file.pages.length > 0 && !file.pages[0].thumbnail) {
        console.log('Loading thumbnails for:', file.originalFile.name);
        setIsLoadingThumbnails(true);
        
        try {
          const pages = await generatePageThumbnails(file.originalFile);
          setLoadedFile({
            ...file,
            pages: pages.length > 0 ? pages : file.pages,
          });
        } catch (error) {
          console.error('Failed to load thumbnails:', error);
        } finally {
          setIsLoadingThumbnails(false);
        }
      }
    };

    loadThumbnails();
  }, [file]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {loadedFile.pages.map((page, index) => (
        <div
          key={`${file.originalFile.name}-page-${index}`}
          className="relative group cursor-pointer"
          onMouseEnter={() => setHoveredPage(index)}
          onMouseLeave={() => setHoveredPage(null)}
          onClick={() => onPageEdit(index)}
        >
          <div className="relative bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors">
            {isLoadingThumbnails || !page.thumbnail ? (
              <div className="w-full aspect-[3/4]">
                <Skeleton className="w-full h-full flex items-center justify-center">
                  <span className="text-sm text-gray-500">{page.pageNumber}</span>
                </Skeleton>
              </div>
            ) : (
              <img
                src={page.thumbnail}
                alt={`Page ${page.pageNumber}`}
                className="w-full h-auto object-contain"
                loading="lazy"
              />
            )}
            
            {/* Hover overlay */}
            <div className={`
              absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center
              transition-opacity duration-200
              md:opacity-0 md:group-hover:opacity-100
              opacity-0
              ${hoveredPage === index ? 'opacity-100' : ''}
            `}>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white text-gray-800 hover:bg-gray-100"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>

            {/* Mobile edit button */}
            <div className="md:hidden absolute top-2 right-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-white shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onPageEdit(index);
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>

            {/* Page number */}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              {page.pageNumber}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
