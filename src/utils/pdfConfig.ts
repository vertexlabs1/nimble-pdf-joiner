
import * as pdfjsLib from 'pdfjs-dist';

// Use the non-minified version which exists at this path
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.js';

console.log('PDF.js initialized with version:', pdfjsLib.version);
console.log('PDF.js worker source:', pdfjsLib.GlobalWorkerOptions.workerSrc);

// Simple function that always returns true since worker is already set
export const ensureWorkerReady = async (): Promise<boolean> => {
  return true;
};

export { pdfjsLib };
