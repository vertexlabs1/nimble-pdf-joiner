
import * as pdfjsLib from 'pdfjs-dist';

// CDN worker URLs with correct paths for v5.3.31 and fallbacks
const CDN_WORKERS = [
  // v5.3.31 uses /legacy/build/ path
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.js`,
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.js`,
  // Fallback to older working version
  `https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.js`,
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.js`,
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`
];

let workerInitialized = false;
let workerInitPromise: Promise<boolean> | null = null;

// Test and validate worker URL with detailed logging
const testWorkerUrl = async (workerUrl: string): Promise<boolean> => {
  try {
    console.log(`🔧 Testing worker URL: ${workerUrl}`);
    
    const response = await fetch(workerUrl, { 
      method: 'HEAD',
      mode: 'cors'
    });
    
    console.log(`📊 Response for ${workerUrl}:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
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
    console.log('Available worker URLs:', CDN_WORKERS);
    
    for (let i = 0; i < CDN_WORKERS.length; i++) {
      const workerUrl = CDN_WORKERS[i];
      console.log(`🔄 Trying worker URL ${i + 1}/${CDN_WORKERS.length}: ${workerUrl}`);
      
      const isValid = await testWorkerUrl(workerUrl);
      if (isValid) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
        console.log(`✅ PDF.js worker initialized with: ${workerUrl}`);
        workerInitialized = true;
        return true;
      }
      
      console.log(`❌ Worker URL ${i + 1} failed, trying next...`);
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
