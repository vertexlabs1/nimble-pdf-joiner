
import * as pdfjsLib from 'pdfjs-dist';

// Completely disable workers - use undefined to force main thread
pdfjsLib.GlobalWorkerOptions.workerSrc = undefined;

console.log('PDF.js initialized without worker - forced main thread, version:', pdfjsLib.version);

// Simple function that always returns true since we're not using a worker
export const ensureWorkerReady = async (): Promise<boolean> => {
  return true;
};

export { pdfjsLib };
