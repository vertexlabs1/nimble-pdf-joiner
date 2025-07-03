import React, { useState, useEffect, useRef } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { generateThumbnail, ThumbnailResult } from '@/utils/unifiedThumbnailGenerator';

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
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(!lazy);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const [retryCount, setRetryCount] = useState(0);
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

  // Generate thumbnail when in view
  useEffect(() => {
    if (inView) {
      generateThumbnailAsync();
    }
  }, [source, size, inView, retryCount]);

  const generateThumbnailAsync = async () => {
    if (!inView) return;
    
    setLoading(true);
    setError(false);
    
    try {
      const result: ThumbnailResult = await generateThumbnail(
        source,
        { 
          width: dimensions.width, 
          height: dimensions.height,
          quality: 0.8 
        },
        fileId
      );
      
      if (result.success && result.data) {
        setThumbnail(result.data);
      } else {
        setError(true);
        // Still set placeholder if we got one
        if (result.data) {
          setThumbnail(result.data);
        }
      }
    } catch (err) {
      console.error('Error generating thumbnail:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
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

  if (error && !thumbnail) {
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
              {showRetry && size === 'large' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRetry();
                  }}
                  className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors flex items-center gap-1 mx-auto"
                  title="Retry thumbnail generation"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
              )}
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
      {thumbnail ? (
        <img 
          src={thumbnail} 
          alt={`Thumbnail of ${displayName}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-muted/50 flex items-center justify-center">
          <FileText className={`${
            size === 'small' ? 'h-4 w-4' : 
            size === 'medium' ? 'h-6 w-6' : 
            'h-8 w-8'
          } text-muted-foreground/50`} />
        </div>
      )}
      
      {error && size === 'large' && showRetry && (
        <div className="absolute top-2 right-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleRetry();
            }}
            className="p-1 bg-background/80 rounded-full shadow-sm hover:bg-background transition-colors"
            title="Retry thumbnail generation"
          >
            <RefreshCw className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}