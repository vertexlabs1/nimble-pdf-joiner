
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PDFFileWithPages } from '@/types/pdf';
import { Edit, X } from 'lucide-react';
import { generatePageThumbnails } from '@/utils/pdfPageUtils';

interface LazyPageThumbnailGridProps {
  file: PDFFileWithPages;
  onPageEdit: (pageIndex: number) => void;
}

export const LazyPageThumbnailGrid = ({ file, onPageEdit }: LazyPageThumbnailGridProps) => {
  const [hoveredPage, setHoveredPage] = useState<number | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCancelled, setCancelled] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Progressive thumbnail loading
  useEffect(() => {
    const loadThumbnailsProgressively = async () => {
      if (file.pages.length === 0) return;
      
      // Check if we already have thumbnails
      if (file.pages[0].thumbnail) {
        setThumbnails(file.pages.map(page => page.thumbnail));
        return;
      }

      console.log('Starting progressive thumbnail loading for:', file.originalFile.name);
      setIsLoading(true);
      setCancelled(false);
      setLoadingProgress(0);
      
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();
      
      // Initialize empty thumbnails array
      const newThumbnails: string[] = new Array(file.pages.length).fill('');
      setThumbnails(newThumbnails);

      try {
        // Load thumbnails one by one with progress updates
        for (let i = 0; i < file.pages.length; i++) {
          if (abortControllerRef.current?.signal.aborted || loadingCancelled) {
            console.log('Thumbnail loading cancelled');
            break;
          }

          try {
            console.log(`Loading thumbnail ${i + 1}/${file.pages.length}`);
            
            // Generate single thumbnail with timeout
            const thumbnailPromise = generateSingleThumbnail(file.originalFile, i + 1);
            const timeoutPromise = new Promise<string>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 10000) // 10 second timeout per thumbnail
            );
            
            const thumbnail = await Promise.race([thumbnailPromise, timeoutPromise]);
            
            // Update thumbnails array progressively
            setThumbnails(prev => {
              const updated = [...prev];
              updated[i] = thumbnail;
              return updated;
            });
            
            setLoadingProgress(((i + 1) / file.pages.length) * 100);
            
            // Small delay between thumbnails to prevent blocking
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            console.warn(`Failed to load thumbnail ${i + 1}:`, error);
            // Continue with next thumbnail on error
          }
        }
        
      } catch (error) {
        console.error('Error in progressive thumbnail loading:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThumbnailsProgressively();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [file, loadingCancelled]);

  const handleCancelLoading = () => {
    console.log('Cancelling thumbnail loading');
    setCancelled(true);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Loading progress and cancel button */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">
              Loading thumbnails... {Math.round(loadingProgress)}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelLoading}
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
            Thumbnails will appear as they load. You can edit pages even while loading.
          </p>
        </div>
      )}

      {/* Thumbnail grid */}
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
              {/* Show thumbnail if available, otherwise skeleton */}
              {thumbnails[index] ? (
                <img
                  src={thumbnails[index]}
                  alt={`Page ${page.pageNumber}`}
                  className="w-full h-auto object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-[3/4]">
                  <Skeleton className="w-full h-full flex items-center justify-center">
                    <span className="text-sm text-gray-500">{page.pageNumber}</span>
                  </Skeleton>
                </div>
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
    </div>
  );
};

// Helper function to generate a single thumbnail
const generateSingleThumbnail = async (file: File, pageNumber: number): Promise<string> => {
  const pdfjsLib = await import('pdfjs-dist');
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdfDocument.getPage(pageNumber);
    
    // Use smaller scale for faster rendering
    const viewport = page.getViewport({ scale: 0.3 });
    
    // Limit canvas size for performance
    const maxSize = 100;
    const scale = Math.min(maxSize / viewport.width, maxSize / viewport.height, 0.3);
    const scaledViewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    
    await page.render({
      canvasContext: context,
      viewport: scaledViewport,
    }).promise;
    
    return canvas.toDataURL('image/jpeg', 0.6); // Lower quality for speed
    
  } catch (error) {
    console.warn(`Failed to generate thumbnail for page ${pageNumber}:`, error);
    // Return simple placeholder on error
    return createPlaceholderThumbnail(pageNumber);
  }
};

const createPlaceholderThumbnail = (pageNumber: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 133;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 100, 133);
    
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 100, 133);
    
    ctx.fillStyle = '#6c757d';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${pageNumber}`, 50, 66);
  }
  
  return canvas.toDataURL('image/png');
};
