import React, { useState, useEffect, useRef } from 'react';
import { FileText } from 'lucide-react';

interface UnifiedPDFThumbnailProps {
  source: File | string; // File object or stored file path
  filename?: string; // Display name (optional for stored files)
  fileId?: string; // Required for stored files
  size: 'small' | 'medium' | 'large';
  className?: string;
  lazy?: boolean;
  showRetry?: boolean;
  onClick?: () => void;
}

export default function UnifiedPDFThumbnail({ 
  source,
  filename,
  fileId,
  size, 
  className = "",
  lazy = false,
  showRetry = true,
  onClick
}: UnifiedPDFThumbnailProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!lazy);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const elementRef = useRef<HTMLDivElement>(null);

  // Get display filename
  const displayName = filename || (typeof source === 'string' ? source.split('/').pop() || 'PDF' : source.name);

  // Determine dimensions based on size
  const dimensions = {
    small: { width: 40, height: 52, className: 'w-10 h-13' },
    medium: { width: 120, height: 156, className: 'w-30 h-39' },
    large: { width: 200, height: 260, className: 'w-50 h-65' }
  }[size];

  // Set up intersection observer for lazy loading
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

  // Create PDF URL when in view
  useEffect(() => {
    if (inView && !pdfUrl) {
      createPdfUrl();
    }
    
    // Cleanup object URL when component unmounts
    return () => {
      if (pdfUrl && source instanceof File) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [source, inView]);

  const createPdfUrl = async () => {
    if (!inView) return;
    
    setLoading(true);
    setError(false);
    
    try {
      if (source instanceof File) {
        // Create object URL for File objects
        const url = URL.createObjectURL(source);
        setPdfUrl(url);
      } else {
        // For stored files, we need to get the public URL from Supabase
        // This assumes the source is already a public URL or file path
        setPdfUrl(source);
      }
    } catch (err) {
      console.error('Error creating PDF URL:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const containerClasses = `
    ${dimensions.className} 
    ${className} 
    bg-card 
    rounded-lg 
    overflow-hidden 
    border 
    border-border/50 
    transition-all 
    duration-200 
    ${size === 'large' ? 'shadow-sm hover:shadow-md hover:border-border' : ''}
    ${onClick ? 'cursor-pointer hover:scale-105' : ''}
  `.trim();

  if (loading) {
    return (
      <div 
        ref={elementRef} 
        className={containerClasses}
        onClick={onClick}
      >
        <div className="w-full h-full bg-muted/50 flex items-center justify-center animate-pulse">
          <FileText className={`${
            size === 'small' ? 'h-4 w-4' : 
            size === 'medium' ? 'h-6 w-6' : 
            'h-8 w-8'
          } text-muted-foreground/50`} />
          {size === 'large' && (
            <span className="absolute bottom-2 text-xs text-muted-foreground/70 font-medium">
              Loading...
            </span>
          )}
        </div>
      </div>
    );
  }

  if (error || !pdfUrl) {
    return (
      <div 
        ref={elementRef} 
        className={containerClasses}
        onClick={onClick}
      >
        <div className="w-full h-full bg-card/50 flex flex-col items-center justify-center relative border-2 border-dashed border-border/30 rounded-lg">
          <FileText className={`${
            size === 'small' ? 'h-4 w-4' : 
            size === 'medium' ? 'h-6 w-6' : 
            'h-8 w-8'
          } text-muted-foreground/60`} />
          
          {size !== 'small' && (
            <div className="absolute bottom-2 text-center px-2 w-full">
              <span className="text-xs text-muted-foreground/70 font-medium block mb-1">
                {size === 'medium' ? 'PDF' : 'PDF Document'}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={elementRef} 
      className={containerClasses}
      onClick={onClick}
      title={displayName}
    >
      <div className="relative w-full h-full">
        <iframe
          src={`${pdfUrl}#page=1&view=FitH&toolbar=0&navpanes=0&statusbar=0&scrollbar=0`}
          className="w-full h-full pointer-events-none border-0"
          style={{
            transform: 'scale(0.5)',
            transformOrigin: 'top left',
            width: '200%',
            height: '200%'
          }}
          title={`Thumbnail of ${displayName}`}
        />
        {/* Overlay to prevent interaction with iframe */}
        <div className="absolute inset-0 bg-transparent pointer-events-none" />
      </div>
    </div>
  );
}