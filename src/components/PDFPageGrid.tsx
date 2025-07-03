import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface PDFPageGridProps {
  file: File;
  onLoad?: (pageCount: number) => void;
  showPageNumbers?: boolean;
  maxPages?: number;
}

interface PageThumbnail {
  pageNumber: number;
  thumbnail: string | null;
  loading: boolean;
  error: boolean;
}

export default function PDFPageGrid({ 
  file, 
  onLoad, 
  showPageNumbers = false,
  maxPages = 20
}: PDFPageGridProps) {
  const [pages, setPages] = useState<PageThumbnail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (file) {
      loadPDFInfo();
    }
  }, [file, retryCount]);

  const loadPDFInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use pdf-lib for fast page counting
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pageCount = pdf.getPageCount();
      
      setTotalPages(pageCount);
      onLoad?.(pageCount);

      // Initialize page thumbnails array
      const pagesToShow = Math.min(pageCount, maxPages);
      const initialPages: PageThumbnail[] = Array.from({ length: pagesToShow }, (_, i) => ({
        pageNumber: i + 1,
        thumbnail: null,
        loading: true,
        error: false
      }));
      
      setPages(initialPages);
      setLoading(false);

      // Start generating thumbnails progressively
      generateThumbnailsProgressively(initialPages);

    } catch (err) {
      console.error('Error loading PDF info:', err);
      setError('Failed to load PDF. The file may be corrupted or encrypted.');
      setLoading(false);
    }
  };

  const generateThumbnailsProgressively = async (pageList: PageThumbnail[]) => {
    const batchSize = 4; // Generate 4 thumbnails at a time
    
    for (let i = 0; i < pageList.length; i += batchSize) {
      const batch = pageList.slice(i, i + batchSize);
      const batchPromises = batch.map(page => generateSingleThumbnail(page.pageNumber));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        setPages(prevPages => {
          const newPages = [...prevPages];
          batchResults.forEach((result, index) => {
            const pageIndex = i + index;
            if (pageIndex < newPages.length) {
              if (result.status === 'fulfilled' && result.value) {
                newPages[pageIndex] = {
                  ...newPages[pageIndex],
                  thumbnail: result.value,
                  loading: false,
                  error: false
                };
              } else {
                newPages[pageIndex] = {
                  ...newPages[pageIndex],
                  thumbnail: null,
                  loading: false,
                  error: true
                };
              }
            }
          });
          return newPages;
        });
      } catch (err) {
        console.error('Error in batch thumbnail generation:', err);
      }

      // Small delay between batches to prevent overwhelming the browser
      if (i + batchSize < pageList.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };

  const generateSingleThumbnail = async (pageNumber: number): Promise<string | null> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Use PDF.js for thumbnail generation with timeout
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker if not already set
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      }

      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0 
      });
      
      const pdf = await Promise.race([
        loadingTask.promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PDF loading timeout')), 5000)
        )
      ]) as any;
      
      const page = await pdf.getPage(pageNumber);
      const scale = 0.4; // Smaller scale for faster generation
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      return canvas.toDataURL('image/jpeg', 0.7); // Lower quality for faster generation
    } catch (err) {
      console.error(`Error generating thumbnail for page ${pageNumber}:`, err);
      return null;
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Loading PDF pages...</div>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="aspect-[3/4] bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-destructive">{error}</div>
        <div className="p-8 border-2 border-dashed border-border rounded-lg text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Could not generate page previews</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalPages > maxPages ? 
            `Showing first ${maxPages} of ${totalPages} pages` : 
            `${totalPages} pages`
          }
        </div>
        {pages.some(p => p.error) && (
          <button
            onClick={handleRetry}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Retry Thumbnails
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {pages.map((page, index) => (
          <div key={index} className="space-y-2">
            <div className="aspect-[3/4] bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {page.loading ? (
                <div className="w-full h-full bg-muted/50 flex items-center justify-center animate-pulse">
                  <FileText className="h-6 w-6 text-muted-foreground/50" />
                </div>
              ) : page.thumbnail ? (
                <img 
                  src={page.thumbnail} 
                  alt={`Page ${page.pageNumber}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
                  <FileText className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">{page.pageNumber}</span>
                </div>
              )}
            </div>
            {showPageNumbers && (
              <div className="text-xs text-center text-muted-foreground">
                Page {page.pageNumber}
              </div>
            )}
          </div>
        ))}
        
        {totalPages > maxPages && (
          <div className="aspect-[3/4] bg-muted/50 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center">
            <div className="text-xs text-muted-foreground text-center">
              <div>+{totalPages - maxPages}</div>
              <div>more pages</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}