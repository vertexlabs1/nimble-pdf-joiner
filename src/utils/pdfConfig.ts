
import * as pdfjsLib from 'pdfjs-dist';

// Use the non-minified version which exists and doesn't have CORS issues
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.js';

console.log('PDF.js initialized with version:', pdfjsLib.version);

// Simple function that always returns true since we're not using a worker
export const ensureWorkerReady = async (): Promise<boolean> => {
  return true;
};

export { pdfjsLib };
