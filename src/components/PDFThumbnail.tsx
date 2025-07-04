import React, { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { FileText } from 'lucide-react';
import { PDF_CONFIG } from '@/lib/pdfConfig';
import '@/lib/pdfConfig';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

interface PDFThumbnailProps {
  file: File | string;
  className?: string;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function PDFThumbnail({ 
  file, 
  className = '', 
  onClick, 
  size = 'medium' 
}: PDFThumbnailProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const sizeConfig = {
    small: { width: 80, height: 104, scale: 0.4 },
    medium: { width: 150, height: 200, scale: 0.6 },
    large: { width: 200, height: 260, scale: 0.8 }
  }[size];

  const onDocumentLoadSuccess = () => {
    setLoading(false);
    setError(false);
  };

  const onDocumentLoadError = () => {
    setLoading(false);
    setError(true);
  };

  const containerClasses = `
    relative
    bg-card
    border
    border-border
    rounded-lg
    overflow-hidden
    transition-all
    duration-200
    hover:shadow-md
    hover:border-primary/30
    ${onClick ? 'cursor-pointer hover:scale-105' : ''}
    ${className}
  `.trim();

  if (loading) {
    return (
      <div 
        className={containerClasses}
        style={{ width: sizeConfig.width, height: sizeConfig.height }}
        onClick={onClick}
      >
        <div className="w-full h-full bg-muted/50 flex items-center justify-center animate-pulse">
          <FileText className="h-8 w-8 text-muted-foreground/50" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={containerClasses}
        style={{ width: sizeConfig.width, height: sizeConfig.height }}
        onClick={onClick}
      >
        <div className="w-full h-full bg-muted/30 border-2 border-dashed border-border/30 flex flex-col items-center justify-center">
          <FileText className="h-8 w-8 text-muted-foreground/60 mb-2" />
          <span className="text-xs text-muted-foreground/70">PDF</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={containerClasses}
      style={{ width: sizeConfig.width, height: sizeConfig.height }}
      onClick={onClick}
    >
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading=""
      >
        <Page
          pageNumber={1}
          scale={sizeConfig.scale}
          loading=""
          className="pdf-thumbnail"
        />
      </Document>
    </div>
  );
}