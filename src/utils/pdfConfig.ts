import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker with proper error handling
let workerInitialized = false;

export async function initializePDFWorker(): Promise<boolean> {
  if (workerInitialized) {
    return true;
  }

  try {
    // First try: Use Vite's handling of the worker
    try {
      const workerUrl = new URL(
        'pdfjs-dist/build/pdf.worker.min.js', 
        import.meta.url
      ).href;
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
      console.log('PDF.js worker configured with local URL:', workerUrl);
    } catch (localError) {
      console.warn('Local worker setup failed:', localError);
      
      // Fallback: Use CDN
      const cdnWorkerUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      pdfjsLib.GlobalWorkerOptions.workerSrc = cdnWorkerUrl;
      console.log('PDF.js worker configured with CDN URL:', cdnWorkerUrl);
    }

    // Test worker by creating a minimal PDF document
    const testArrayBuffer = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xc4, 0xe5, 0xf2, 0xe5, 0xeb, 0xa7, 0xf3, 0xa0, 0xd0, 0xc4, 0xc6, 0x0a
    ]);
    
    const loadingTask = pdfjsLib.getDocument({ 
      data: testArrayBuffer,
      verbosity: 0 
    });
    
    await Promise.race([
      loadingTask.promise.then(() => {
        console.log('PDF.js worker test successful');
        workerInitialized = true;
        return true;
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Worker test timeout')), 5000)
      )
    ]);

    return workerInitialized;
  } catch (error) {
    console.error('PDF.js worker initialization failed:', error);
    workerInitialized = false;
    return false;
  }
}

export function getPDFLib() {
  return pdfjsLib;
}

export function isWorkerReady(): boolean {
  return workerInitialized;
}