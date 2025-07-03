
import * as pdfjsLib from 'pdfjs-dist';

// CDN worker URLs with fallbacks for maximum reliability
const CDN_WORKERS = [
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
];

let workerInitialized = false;
let workerInitPromise: Promise<boolean> | null = null;

// Test and validate worker URL
const testWorkerUrl = async (workerUrl: string): Promise<boolean> => {
  try {
    console.log(`🔧 Testing worker URL: ${workerUrl}`);
    
    const response = await fetch(workerUrl, { 
      method: 'HEAD',
      mode: 'cors'
    });
    
    if (!response.ok) {
      console.warn(`❌ Worker URL failed: ${response.status} ${response.statusText}`);
      return false;
    }
    
    console.log(`✅ Worker URL validated: ${workerUrl}`);
    return true;
  } catch (error) {
    console.warn(`❌ Worker URL test failed:`, error);
    return false;
  }
};

// Initialize PDF.js worker with fallback CDN URLs
const initializeWorker = async (): Promise<boolean> => {
  if (workerInitialized) {
    return true;
  }

  if (workerInitPromise) {
    return workerInitPromise;
  }

  workerInitPromise = (async () => {
    console.log('🚀 Initializing PDF.js worker...');
    console.log('PDF.js version:', pdfjsLib.version);
    
    for (const workerUrl of CDN_WORKERS) {
      const isValid = await testWorkerUrl(workerUrl);
      if (isValid) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
        console.log(`✅ PDF.js worker initialized with: ${workerUrl}`);
        workerInitialized = true;
        return true;
      }
    }
    
    console.error('❌ All PDF.js worker URLs failed - PDF operations will not work');
    return false;
  })();

  return workerInitPromise;
};

// Ensure worker is initialized before any PDF operations
export const ensureWorkerReady = async (): Promise<boolean> => {
  return initializeWorker();
};

// Initialize worker immediately
initializeWorker();

export { pdfjsLib };
