import React, { useState, useEffect, useRef } from 'react';
import { FileText } from 'lucide-react';
import { generateStoredFileThumbnail, generateSmallThumbnail } from '@/utils/pdfThumbnailGenerator';

interface PDFThumbnailProps {
  filePath: string;
  filename: string;
  fileId?: string;
  size: 'small' | 'large';
  className?: string;
  lazy?: boolean;
}

export default function PDFThumbnail({ 
  filePath, 
  filename, 
  fileId,
  size, 
  className = "",
  lazy = false 
}: PDFThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(!lazy);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lazy && elementRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setInView(true);
            setLoading(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(elementRef.current);
      return () => observer.disconnect();
    }
  }, [lazy]);

  useEffect(() => {
    if (inView) {
      generateThumbnail();
    }
  }, [filePath, size, inView, fileId]);

  const generateThumbnail = async () => {
    if (!inView) return;
    
    setLoading(true);
    setError(false);
    
    try {
      const thumbnailData = size === 'small' 
        ? await generateSmallThumbnail(filePath, fileId)
        : await generateStoredFileThumbnail(filePath, fileId);
      
      if (thumbnailData) {
        setThumbnail(thumbnailData);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error generating thumbnail:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Google Drive-style dimensions and styling
  const dimensions = size === 'small' 
    ? 'w-10 h-12' 
    : 'w-40 h-52';

  const containerClasses = size === 'large'
    ? `${dimensions} ${className} bg-card rounded-lg overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-border`
    : `${dimensions} ${className} bg-card rounded-md overflow-hidden border border-border/50`;

  if (loading) {
    return (
      <div ref={elementRef} className={containerClasses}>
        <div className="w-full h-full bg-muted/50 flex items-center justify-center animate-pulse">
          <FileText className={`${size === 'small' ? 'h-4 w-4' : 'h-8 w-8'} text-muted-foreground/50`} />
          {size === 'large' && (
            <span className="absolute bottom-1 text-xs text-muted-foreground/70 font-medium">Loading...</span>
          )}
        </div>
      </div>
    );
  }

  if (error || !thumbnail) {
    return (
      <div ref={elementRef} className={containerClasses}>
        <div className="w-full h-full bg-card/50 flex flex-col items-center justify-center relative border-2 border-dashed border-border/30 rounded-lg">
          <FileText className={`${size === 'small' ? 'h-5 w-5' : 'h-12 w-12'} text-muted-foreground/60`} />
          {size === 'large' && (
            <div className="absolute bottom-2 text-center px-2">
              <span className="text-xs text-muted-foreground/70 font-medium block mb-1">PDF Document</span>
              {error && (
                <button 
                  onClick={generateThumbnail}
                  className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                  title="Generate preview"
                >
                  Generate Preview
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={elementRef} className={containerClasses}>
      <img 
        src={thumbnail} 
        alt={`Thumbnail of ${filename}`}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}