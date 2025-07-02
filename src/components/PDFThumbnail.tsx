import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { generateStoredFileThumbnail, generateSmallThumbnail } from '@/utils/pdfThumbnailGenerator';

interface PDFThumbnailProps {
  filePath: string;
  filename: string;
  size: 'small' | 'large';
  className?: string;
}

export default function PDFThumbnail({ filePath, filename, size, className = "" }: PDFThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    generateThumbnail();
  }, [filePath, size]);

  const generateThumbnail = async () => {
    setLoading(true);
    setError(false);
    
    try {
      const thumbnailData = size === 'small' 
        ? await generateSmallThumbnail(filePath)
        : await generateStoredFileThumbnail(filePath);
      
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

  const dimensions = size === 'small' 
    ? 'w-10 h-12' 
    : 'w-32 h-40';

  if (loading) {
    return (
      <div className={`${dimensions} ${className} bg-muted rounded-md flex items-center justify-center animate-pulse`}>
        <FileText className={`${size === 'small' ? 'h-4 w-4' : 'h-8 w-8'} text-muted-foreground`} />
      </div>
    );
  }

  if (error || !thumbnail) {
    return (
      <div className={`${dimensions} ${className} bg-muted rounded-md flex flex-col items-center justify-center border border-border`}>
        <FileText className={`${size === 'small' ? 'h-4 w-4' : 'h-8 w-8'} text-muted-foreground`} />
        {size === 'large' && (
          <span className="text-xs text-muted-foreground mt-1 text-center px-1">PDF</span>
        )}
      </div>
    );
  }

  return (
    <div className={`${dimensions} ${className} overflow-hidden rounded-md border border-border bg-background`}>
      <img 
        src={thumbnail} 
        alt={`Thumbnail of ${filename}`}
        className="w-full h-full object-cover"
      />
    </div>
  );
}