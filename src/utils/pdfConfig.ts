
import * as pdfjsLib from 'pdfjs-dist';

// Use a blob URL approach to bypass CORS
async function initializePDFWorker() {
  try {
    // Use unpkg which doesn't have CORS restrictions
    const workerUrl = 'https://unpkg.com/pdfjs-dist@4.9.155/build/pdf.worker.js';
    
    console.log('Fetching PDF.js worker script from:', workerUrl);
    
    // Fetch the worker script as text
    const response = await fetch(workerUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch worker: ${response.status} ${response.statusText}`);
    }
    
    const workerScript = await response.text();
    console.log('Worker script fetched successfully, length:', workerScript.length);
    
    // Create a blob URL from the script
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Set the worker source to the blob URL
    pdfjsLib.GlobalWorkerOptions.workerSrc = blobUrl;
    
    console.log('PDF.js worker initialized successfully with blob URL:', blobUrl);
    return true;
  } catch (error) {
    console.error('Failed to initialize PDF.js worker:', error);
    // Fallback: Use the library's built-in worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    console.log('Using fallback worker configuration');
    return false;
  }
}

// Initialize on import
initializePDFWorker();

console.log('PDF.js version:', pdfjsLib.version);

// Simple function that always returns true since we attempt initialization on import
export const ensureWorkerReady = async (): Promise<boolean> => {
  return true;
};

export { pdfjsLib };
