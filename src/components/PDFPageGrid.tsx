import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { supabase } from '@/integrations/supabase/client';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [thumbnails, setThumbnails] = useState<{ [key: number]: string }>({});
  const [generatingThumbnails, setGeneratingThumbnails] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    if (file) {
      loadPDFInfo();
    }
  }, [file]);

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
      setLoading(false);
      
      // Start generating thumbnails for visible pages
      generateThumbnailsForPages(Math.min(pageCount, maxPages));
    } catch (err) {
      console.error('Error loading PDF info:', err);
      setError('Failed to load PDF. The file may be corrupted or encrypted.');
      setLoading(false);
    }
  };

  const generateThumbnailsForPages = async (pageCount: number) => {
    // Create object URL for the PDF file to send to edge function
    const pdfUrl = URL.createObjectURL(file);
    
    try {
      // Generate thumbnails for first few pages in parallel
      const thumbnailPromises = Array.from({ length: pageCount }, (_, index) => 
        generateThumbnail(pdfUrl, index + 1)
      );
      
      await Promise.all(thumbnailPromises);
    } finally {
      // Clean up object URL
      URL.revokeObjectURL(pdfUrl);
    }
  };

  const generateThumbnail = async (pdfUrl: string, pageNumber: number) => {
    if (thumbnails[pageNumber] || generatingThumbnails[pageNumber]) {
      return;
    }

    setGeneratingThumbnails(prev => ({ ...prev, [pageNumber]: true }));

    try {
      const { data, error } = await supabase.functions.invoke('generate-thumbnail', {
        body: {
          pdfUrl,
          pageNumber,
          width: 200,
          height: 260
        }
      });

      if (error) {
        console.error(`Error generating thumbnail for page ${pageNumber}:`, error);
        return;
      }

      if (data?.thumbnailData) {
        setThumbnails(prev => ({ ...prev, [pageNumber]: data.thumbnailData }));
      }
    } catch (err) {
      console.error(`Error generating thumbnail for page ${pageNumber}:`, err);
    } finally {
      setGeneratingThumbnails(prev => ({ ...prev, [pageNumber]: false }));
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

  const pagesToShow = Math.min(totalPages, maxPages);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalPages > maxPages ? 
            `Showing first ${maxPages} of ${totalPages} pages` : 
            `${totalPages} pages`
          }
        </div>
      </div>
      
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {Array.from({ length: pagesToShow }, (_, index) => {
          const pageNumber = index + 1;
          return (
            <div key={index} className="space-y-2">
              <div className="relative aspect-[3/4] bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {thumbnails[pageNumber] ? (
                  <img
                    src={thumbnails[pageNumber]}
                    alt={`Page ${pageNumber}`}
                    className="w-full h-full object-cover"
                  />
                ) : generatingThumbnails[pageNumber] ? (
                  <div className="w-full h-full bg-muted flex flex-col items-center justify-center animate-pulse">
                    <FileText className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Generating...</span>
                  </div>
                ) : (
                  <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Page {pageNumber}</span>
                  </div>
                )}
              </div>
              {showPageNumbers && (
                <div className="text-xs text-center text-muted-foreground">
                  Page {pageNumber}
                </div>
              )}
            </div>
          );
        })}
        
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