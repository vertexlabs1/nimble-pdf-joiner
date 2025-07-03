import React, { useState, useEffect, useRef } from 'react';
import { FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import * as pdfjsLib from 'pdfjs-dist';
import { getSignedUrl } from '@/utils/storageAPI';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFThumbnailCanvasProps {
  filePath: string;
  fileName: string;
  size: 'small' | 'medium' | 'large';
  lazy?: boolean;
  className?: string;
  onClick?: () => void;
}

// Thumbnail cache to avoid re-rendering
const thumbnailCache = new Map<string, string>();
const failedFiles = new Set<string>();

export default function PDFThumbnailCanvas({
  filePath,
  fileName,
  size,
  lazy = false,
  className = '',
  onClick
}: PDFThumbnailCanvasProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(!lazy);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const [retryCount, setRetryCount] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Size configurations
  const sizeConfig = {
    small: { width: 40, height: 52, scale: 0.3 },
    medium: { width: 120, height: 156, scale: 0.8 },
    large: { width: 200, height: 260, scale: 1.0 }
  }[size];

  // Cache key for this thumbnail
  const cacheKey = `${filePath}_${size}`;

  // Intersection observer for lazy loading
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
        { threshold: 0.1, rootMargin: '50px' }
      );
      observer.observe(elementRef.current);
      return () => observer.disconnect();
    }
  }, [lazy]);

  // Generate thumbnail when in view
  useEffect(() => {
    if (inView && !thumbnail && !error) {
      generateThumbnail();
    }
  }, [inView, filePath, size, retryCount]);

  // Check cache first
  useEffect(() => {
    const cached = thumbnailCache.get(cacheKey);
    if (cached) {
      setThumbnail(cached);
      setLoading(false);
    } else if (failedFiles.has(filePath)) {
      setError(true);
      setLoading(false);
    }
  }, [cacheKey, filePath]);

  const generateThumbnail = async () => {
    if (failedFiles.has(filePath) && retryCount === 0) {
      setError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      // Get signed URL for the PDF
      const signedUrl = await getSignedUrl(filePath);
      if (!signedUrl) {
        throw new Error('Could not get signed URL');
      }

      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({
        url: signedUrl,
        cMapUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      });

      const pdf = await loadingTask.promise;
      
      // Get first page
      const page = await pdf.getPage(1);
      
      // Set up canvas
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');
      
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas context not available');

      // Calculate viewport
      const viewport = page.getViewport({ scale: sizeConfig.scale });
      canvas.width = sizeConfig.width;
      canvas.height = sizeConfig.height;

      // Scale to fit canvas while maintaining aspect ratio
      const scaleX = sizeConfig.width / viewport.width;
      const scaleY = sizeConfig.height / viewport.height;
      const scale = Math.min(scaleX, scaleY);
      
      const scaledViewport = page.getViewport({ scale: sizeConfig.scale * scale });
      
      // Center the content
      const xOffset = (sizeConfig.width - scaledViewport.width) / 2;
      const yOffset = (sizeConfig.height - scaledViewport.height) / 2;
      
      // Clear canvas and set background
      context.fillStyle = 'hsl(var(--card))';
      context.fillRect(0, 0, sizeConfig.width, sizeConfig.height);
      
      // Save context and translate for centering
      context.save();
      context.translate(xOffset, yOffset);

      // Render page
      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
      }).promise;

      context.restore();

      // Convert to data URL and cache
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      thumbnailCache.set(cacheKey, dataUrl);
      setThumbnail(dataUrl);
      
      // Remove from failed set if it was there
      failedFiles.delete(filePath);
      
    } catch (err) {
      console.error('Error generating PDF thumbnail:', err);
      setError(true);
      failedFiles.add(filePath);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    failedFiles.delete(filePath);
    setRetryCount(prev => prev + 1);
    setError(false);
  };

  const containerClasses = `
    relative overflow-hidden rounded-lg border border-border/50 bg-card transition-all duration-200
    ${size === 'large' ? 'shadow-sm hover:shadow-md hover:border-border' : ''}
    ${onClick ? 'cursor-pointer hover:scale-105' : ''}
    ${className}
  `.trim();

  if (loading) {
    return (
      <div ref={elementRef} className={containerClasses} style={{ width: sizeConfig.width, height: sizeConfig.height }}>
        <Skeleton className="w-full h-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <FileText className={`${
            size === 'small' ? 'h-4 w-4' : 
            size === 'medium' ? 'h-6 w-6' : 
            'h-8 w-8'
          } text-muted-foreground/50`} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        ref={elementRef} 
        className={containerClasses}
        style={{ width: sizeConfig.width, height: sizeConfig.height }}
        onClick={onClick}
      >
        <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center border-2 border-dashed border-border/30">
          <AlertCircle className={`${
            size === 'small' ? 'h-4 w-4' : 
            size === 'medium' ? 'h-5 w-5' : 
            'h-6 w-6'
          } text-destructive/60 mb-1`} />
          
          {size !== 'small' && (
            <>
              <span className="text-xs text-muted-foreground font-medium mb-1">
                Load Error
              </span>
              {size === 'large' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRetry();
                  }}
                  className="h-6 px-2 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={elementRef} 
      className={containerClasses}
      style={{ width: sizeConfig.width, height: sizeConfig.height }}
      onClick={onClick}
      title={fileName}
    >
      {thumbnail ? (
        <img 
          src={thumbnail} 
          alt={`Thumbnail of ${fileName}`}
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
      
      {/* Hidden canvas for rendering */}
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }}
        width={sizeConfig.width}
        height={sizeConfig.height}
      />
    </div>
  );
}