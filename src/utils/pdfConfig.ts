import * as pdfjsLib from 'pdfjs-dist';

// Simple direct path - no complex URL resolution needed
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// Optional: Add version check for debugging
console.log('PDF.js initialized with version:', pdfjsLib.version);

export { pdfjsLib };