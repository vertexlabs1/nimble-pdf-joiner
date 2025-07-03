import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      loadPDFInfo();
    }
    
    // Cleanup object URL when component unmounts or file changes
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
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

      // Create object URL for the PDF file
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading PDF info:', err);
      setError('Failed to load PDF. The file may be corrupted or encrypted.');
      setLoading(false);
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
                {pdfUrl ? (
                  <>
                    <iframe
                      src={`${pdfUrl}#page=${pageNumber}&view=FitH&toolbar=0&navpanes=0&statusbar=0&scrollbar=0`}
                      className="w-full h-full pointer-events-none border-0"
                      style={{
                        transform: 'scale(0.5)',
                        transformOrigin: 'top left',
                        width: '200%',
                        height: '200%'
                      }}
                      title={`Page ${pageNumber}`}
                    />
                    {/* Overlay to prevent interaction with iframe */}
                    <div className="absolute inset-0 bg-transparent pointer-events-none" />
                  </>
                ) : (
                  <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">{pageNumber}</span>
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