
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PDFFileWithPages } from '@/types/pdf';
import { Edit, Trash2 } from 'lucide-react';

interface PageThumbnailGridProps {
  file: PDFFileWithPages;
  onPageEdit: (pageIndex: number) => void;
}

export const PageThumbnailGrid = ({ file, onPageEdit }: PageThumbnailGridProps) => {
  const [hoveredPage, setHoveredPage] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {file.pages.map((page, index) => (
        <div
          key={`${file.originalFile.name}-page-${index}`}
          className="relative group cursor-pointer"
          onMouseEnter={() => setHoveredPage(index)}
          onMouseLeave={() => setHoveredPage(null)}
          onClick={() => onPageEdit(index)}
        >
          <div className="relative bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors">
            <img
              src={page.thumbnail}
              alt={`Page ${page.pageNumber}`}
              className="w-full h-auto object-contain"
            />
            
            {/* Mobile: Always show edit button, Desktop: Show on hover */}
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

            {/* Touch-friendly edit button for mobile */}
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

            {/* Page number indicator */}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              {page.pageNumber}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
