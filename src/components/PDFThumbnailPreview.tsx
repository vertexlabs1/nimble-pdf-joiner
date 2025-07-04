import React, { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { FileText, Eye } from 'lucide-react';
import { fetchPDFAsBlob } from '@/utils/storageAPI';
import '../pdf-styles.css';

interface PDFThumbnailPreviewProps {
  filePath: string;
  fileName: string;
  onClick?: () => void;
  className?: string;
}

export default function PDFThumbnailPreview({ 
  filePath, 
  fileName, 
  onClick, 
  className = '' 
}: PDFThumbnailPreviewProps) {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadPDFBlob = async () => {
      setLoading(true);
      try {
        const blob = await fetchPDFAsBlob(filePath);
        if (blob) {
          setPdfBlob(blob);
          setError(false);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error loading PDF blob:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (filePath) {
      loadPDFBlob();
    }
  }, [filePath]);

  const onDocumentLoadSuccess = () => {
    setError(false);
  };

  const onDocumentLoadError = (error: any) => {
    console.error('PDF load error:', error);
    setError(true);
  };

  const containerClasses = `
    relative group
    w-full h-[260px]
    bg-card 
    border 
    border-border/50 
    rounded-lg 
    overflow-hidden 
    transition-all 
    duration-200 
    hover:shadow-md 
    hover:border-border
    ${onClick ? 'cursor-pointer hover:scale-105' : ''}
    ${className}
  `.trim();

  if (loading) {
    return (
      <div className={containerClasses} onClick={onClick}>
        <div className="w-full h-full bg-muted/50 flex items-center justify-center animate-pulse">
          <FileText className="h-8 w-8 text-muted-foreground/50" />
        </div>
      </div>
    );
  }

  if (error || !pdfBlob) {
    return (
      <div className={containerClasses} onClick={onClick}>
        <div className="w-full h-full bg-card/50 border-2 border-dashed border-border/30 flex flex-col items-center justify-center">
          <FileText className="h-8 w-8 text-muted-foreground/60 mb-2" />
          <span className="text-xs text-muted-foreground/70">PDF</span>
        </div>
        {onClick && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Eye className="h-6 w-6 text-white" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={containerClasses} onClick={onClick}>
      <Document
        file={pdfBlob}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading=""
        className="w-full h-full"
      >
        <Page
          pageNumber={1}
          width={200}
          height={260}
          loading=""
          className="pdf-thumbnail w-full h-full"
          scale={1}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
      {onClick && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Eye className="h-6 w-6 text-white" />
        </div>
      )}
    </div>
  );
}