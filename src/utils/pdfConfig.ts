
import * as pdfjsLib from 'pdfjs-dist';

// Disable the worker to avoid all CORS and loading issues
pdfjsLib.GlobalWorkerOptions.workerSrc = null;
pdfjsLib.GlobalWorkerOptions.workerPort = null;

// Set the worker to use the main thread instead
(pdfjsLib as any).disableWorker = true;

console.log('PDF.js initialized without worker - using main thread');
console.log('PDF.js version:', pdfjsLib.version);

// Simple function that always returns true since we're not using a worker
export const ensureWorkerReady = async (): Promise<boolean> => {
  return true;
};

export { pdfjsLib };
