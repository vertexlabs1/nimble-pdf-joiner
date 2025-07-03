import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFPageGridProps {
  file: File;
  onLoad?: (pageCount: number) => void;
  showPageNumbers?: boolean;
  maxPages?: number;
}

export default function PDFPageGrid({ 
  file, 
  onLoad, 
  showPageNumbers = false,
  maxPages = 20
}: PDFPageGridProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (file) {
      generatePageThumbnails();
    }
  }, [file]);

  const generatePageThumbnails = async () => {
    setLoading(true);
    setError(null);
    setPages([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pageCount = pdf.numPages;
      
      setTotalPages(pageCount);
      onLoad?.(pageCount);

      // Generate thumbnails for first maxPages
      const pagesToGenerate = Math.min(pageCount, maxPages);
      const pagePromises: Promise<string>[] = [];

      for (let i = 1; i <= pagesToGenerate; i++) {
        pagePromises.push(generatePageThumbnail(pdf, i));
      }

      const generatedPages = await Promise.all(pagePromises);
      setPages(generatedPages);

    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load PDF pages');
    } finally {
      setLoading(false);
    }
  };

  const generatePageThumbnail = async (pdf: any, pageNumber: number): Promise<string> => {
    try {
      const page = await pdf.getPage(pageNumber);
      const scale = 0.5; // Small scale for thumbnails
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (err) {
      console.error(`Error generating thumbnail for page ${pageNumber}:`, err);
      return '';
    }
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
      <div className="text-sm text-muted-foreground">
        {totalPages > maxPages ? 
          `Showing first ${maxPages} of ${totalPages} pages` : 
          `${totalPages} pages`
        }
      </div>
      
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {pages.map((pageUrl, index) => (
          <div key={index} className="space-y-2">
            <div className="aspect-[3/4] bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {pageUrl ? (
                <img 
                  src={pageUrl} 
                  alt={`Page ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            {showPageNumbers && (
              <div className="text-xs text-center text-muted-foreground">
                Page {index + 1}
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