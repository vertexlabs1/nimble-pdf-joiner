import { useState, useEffect, useRef } from 'react';
import { PDFFileWithPages } from '@/types/pdf';
import { loadPDFDocument, renderSingleThumbnail, createPlaceholderThumbnail } from '@/utils/thumbnailUtils';

interface UseThumbnailLoaderProps {
  file: PDFFileWithPages;
}

export const useThumbnailLoader = ({ file }: UseThumbnailLoaderProps) => {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCancelled, setCancelled] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pdfDocumentRef = useRef<any>(null);

  useEffect(() => {
    const loadThumbnailsProgressively = async () => {
      if (file.pages.length === 0) return;
      
      // Check if we already have thumbnails
      if (file.pages[0].thumbnail) {
        setThumbnails(file.pages.map(page => page.thumbnail));
        return;
      }

      console.log('Starting optimized progressive thumbnail loading for:', file.originalFile.name);
      setIsLoading(true);
      setCancelled(false);
      setLoadingProgress(0);
      
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();
      
      // Initialize placeholder thumbnails immediately
      const placeholderThumbnails = file.pages.map((_, index) => 
        createPlaceholderThumbnail(index + 1)
      );
      setThumbnails(placeholderThumbnails);

      try {
        // Load PDF document ONCE at the start
        console.log('Loading PDF document...');
        
        if (abortControllerRef.current?.signal.aborted || loadingCancelled) {
          console.log('PDF loading cancelled');
          return;
        }

        pdfDocumentRef.current = await loadPDFDocument(file.originalFile);
        console.log('PDF document loaded, starting thumbnail generation...');

        // Now render thumbnails sequentially using the cached PDF
        for (let i = 0; i < file.pages.length; i++) {
          if (abortControllerRef.current?.signal.aborted || loadingCancelled) {
            console.log('Thumbnail loading cancelled');
            break;
          }

          try {
            console.log(`Rendering thumbnail ${i + 1}/${file.pages.length}`);
            
            // Generate thumbnail with fast timeout
            const thumbnail = await Promise.race([
              renderSingleThumbnail(pdfDocumentRef.current, i + 1),
              new Promise<string>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 2000) // 2 second timeout
              )
            ]);
            
            // Update thumbnails array progressively
            setThumbnails(prev => {
              const updated = [...prev];
              updated[i] = thumbnail;
              return updated;
            });
            
            setLoadingProgress(((i + 1) / file.pages.length) * 100);
            
            // Small delay to prevent UI blocking
            await new Promise(resolve => setTimeout(resolve, 50));
            
          } catch (error) {
            console.warn(`Failed to load thumbnail ${i + 1}:`, error);
            // Keep placeholder - don't update the thumbnail
          }
        }
        
      } catch (error) {
        console.error('Error loading PDF document:', error);
      } finally {
        setIsLoading(false);
        // Clean up PDF document reference
        pdfDocumentRef.current = null;
      }
    };

    loadThumbnailsProgressively();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      pdfDocumentRef.current = null;
    };
  }, [file, loadingCancelled]);

  const handleCancelLoading = () => {
    console.log('Cancelling thumbnail loading');
    setCancelled(true);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
    pdfDocumentRef.current = null;
  };

  return {
    thumbnails,
    loadingProgress,
    isLoading,
    handleCancelLoading,
  };
};
