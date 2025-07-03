
import * as pdfjsLib from 'pdfjs-dist';

// Disable the worker by setting it to an empty string
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

console.log('PDF.js initialized without worker - using main thread');
console.log('PDF.js version:', pdfjsLib.version);

// Simple function that always returns true since we're not using a worker
export const ensureWorkerReady = async (): Promise<boolean> => {
  return true;
};

export { pdfjsLib };
