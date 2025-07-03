import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker with proper error handling
let workerInitialized = false;

export async function initializePDFWorker(): Promise<boolean> {
  if (workerInitialized) {
    return true;
  }

  console.log('PDF.js worker initialization starting...');

  try {
    // Try local worker first (both dev and production)
    try {
      const workerUrl = new URL(
        'pdfjs-dist/build/pdf.worker.min.js', 
        import.meta.url
      ).href;
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
      console.log('PDF.js worker configured with local URL:', workerUrl);
      
      // Test local worker
      if (await testWorker()) {
        console.log('PDF.js worker successful with local worker');
        workerInitialized = true;
        return true;
      }
    } catch (localError) {
      console.warn('Local worker setup failed:', localError);
    }

    // Fallback to CDN sources only if local fails
    const workerSources = [
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`,
      `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    ];

    for (const workerUrl of workerSources) {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
        console.log('Trying PDF.js worker URL:', workerUrl);
        
        if (await testWorker()) {
          console.log('PDF.js worker successful with:', workerUrl);
          workerInitialized = true;
          return true;
        }
      } catch (error) {
        console.warn('Worker failed with URL:', workerUrl, error);
      }
    }

    throw new Error('All worker sources failed');
  } catch (error) {
    console.error('PDF.js worker initialization completely failed:', error);
    workerInitialized = false;
    return false;
  }
}

async function testWorker(): Promise<boolean> {
  try {
    // Create a simple PDF for testing
    const testPdf = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
178
%%EOF`;

    const testArrayBuffer = new TextEncoder().encode(testPdf);
    
    const loadingTask = pdfjsLib.getDocument({ 
      data: testArrayBuffer,
      verbosity: 0,
      isEvalSupported: false
    });
    
    const pdf = await Promise.race([
      loadingTask.promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Worker test timeout')), 3000)
      )
    ]) as any;

    // Test that we can actually get a page
    await pdf.getPage(1);
    console.log('PDF.js worker test successful');
    return true;
  } catch (error) {
    console.warn('PDF.js worker test failed:', error);
    return false;
  }
}

export function getPDFLib() {
  return pdfjsLib;
}

export function isWorkerReady(): boolean {
  return workerInitialized;
}