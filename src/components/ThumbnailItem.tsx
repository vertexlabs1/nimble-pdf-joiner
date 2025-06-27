
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

interface ThumbnailItemProps {
  thumbnail: string;
  pageNumber: number;
  fileName: string;
  index: number;
  onEdit: () => void;
}

export const ThumbnailItem = ({ thumbnail, pageNumber, fileName, index, onEdit }: ThumbnailItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onEdit}
    >
      <div className="relative bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors">
        {/* Show thumbnail - either real or placeholder */}
        <div className="w-full aspect-[3/4]">
          <img
            src={thumbnail}
            alt={`Page ${pageNumber}`}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
        
        {/* Hover overlay */}
        <div className={`
          absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center
          transition-opacity duration-200
          md:opacity-0 md:group-hover:opacity-100
          opacity-0
          ${isHovered ? 'opacity-100' : ''}
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
              onEdit();
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>

        {/* Page number */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          {pageNumber}
        </div>
      </div>
    </div>
  );
};
