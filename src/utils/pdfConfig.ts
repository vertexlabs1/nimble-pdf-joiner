
import * as pdfjsLib from 'pdfjs-dist';

// Robust worker setup with immediate CDN fallback
const setWorkerSource = () => {
  const cdnWorker = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  
  console.log('PDF.js initialized with version:', pdfjsLib.version);
  console.log('Using CDN worker for reliability:', cdnWorker);
  
  // Use CDN worker directly for better reliability
  pdfjsLib.GlobalWorkerOptions.workerSrc = cdnWorker;
  
  console.log('✅ PDF.js worker configured with CDN source');
};

// Initialize worker source
setWorkerSource();

export { pdfjsLib };
