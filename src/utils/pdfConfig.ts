
import * as pdfjsLib from 'pdfjs-dist';

// Robust worker setup with local-first approach
const setWorkerSource = () => {
  const localWorker = '/pdf.worker.min.js';
  const corsFreeCdn = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
  
  console.log('PDF.js initialized with version:', pdfjsLib.version);
  console.log('Primary worker source (local):', localWorker);
  console.log('Fallback worker source (CORS-free CDN):', corsFreeCdn);
  
  // Start with local worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = localWorker;
  
  // Test local worker availability
  fetch(localWorker, { method: 'HEAD' })
    .then(response => {
      if (response.ok) {
        console.log('✅ Local PDF.js worker is available and working');
      } else {
        console.warn('⚠️ Local worker responded with error, falling back to CDN');
        pdfjsLib.GlobalWorkerOptions.workerSrc = corsFreeCdn;
      }
    })
    .catch(error => {
      console.warn('❌ Local PDF.js worker not accessible:', error.message);
      console.log('🔄 Switching to CORS-friendly CDN fallback');
      pdfjsLib.GlobalWorkerOptions.workerSrc = corsFreeCdn;
    });
};

// Initialize worker source
setWorkerSource();

export { pdfjsLib };
