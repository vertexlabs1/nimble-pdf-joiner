
import * as pdfjsLib from 'pdfjs-dist';

// Try multiple worker sources for better reliability
const setWorkerSource = () => {
  // First try the local copy (preferred)
  const localWorker = '/pdf.worker.min.js';
  
  // Fallback to CDN if local copy fails
  const cdnWorker = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  
  // Set the primary worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = localWorker;
  
  console.log('PDF.js initialized with version:', pdfjsLib.version);
  console.log('Primary worker source:', localWorker);
  console.log('Fallback worker source:', cdnWorker);
  
  // Test if local worker is available
  fetch(localWorker, { method: 'HEAD' })
    .then(response => {
      if (!response.ok) {
        console.warn('Local PDF.js worker not found, falling back to CDN');
        pdfjsLib.GlobalWorkerOptions.workerSrc = cdnWorker;
      } else {
        console.log('✅ Local PDF.js worker is available');
      }
    })
    .catch(() => {
      console.warn('Local PDF.js worker not accessible, using CDN fallback');
      pdfjsLib.GlobalWorkerOptions.workerSrc = cdnWorker;
    });
};

// Initialize worker source
setWorkerSource();

export { pdfjsLib };
