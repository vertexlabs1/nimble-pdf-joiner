
import * as pdfjsLib from 'pdfjs-dist';

// Force CDN worker for development to avoid local serving issues
const setWorkerSource = () => {
  const corsFreeCdn = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
  const localWorker = '/pdf.worker.min.js';
  
  console.log('PDF.js initialized with version:', pdfjsLib.version);
  console.log('Primary worker source (CDN):', corsFreeCdn);
  console.log('Fallback worker source (local):', localWorker);
  
  // Start with CDN worker to avoid local serving issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = corsFreeCdn;
  console.log('✅ Using CDN PDF.js worker to avoid CORS/serving issues');
  
  // Test local worker in background for future use
  testLocalWorker(localWorker, corsFreeCdn);
};

// Test local worker content validation
const testLocalWorker = async (localWorker: string, fallback: string) => {
  try {
    console.log('🔧 Testing local worker content...');
    const response = await fetch(localWorker);
    
    if (!response.ok) {
      console.warn('❌ Local worker fetch failed:', response.status, response.statusText);
      return;
    }
    
    const contentType = response.headers.get('content-type') || '';
    console.log('📄 Local worker content-type:', contentType);
    
    const text = await response.text();
    const first100 = text.substring(0, 100);
    console.log('📝 Local worker content preview:', first100);
    
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html') || text.includes('<html>')) {
      console.error('❌ CRITICAL: Local worker contains HTML instead of JavaScript!');
      console.error('Content preview:', first100);
      console.log('🔄 Keeping CDN worker as primary');
      return;
    }
    
    if (text.includes('var Module') || text.includes('self.pdfjsWorker') || text.includes('importScripts')) {
      console.log('✅ Local worker contains valid JavaScript - but using CDN for now');
    } else {
      console.warn('⚠️ Local worker content may not be valid PDF.js worker');
    }
    
  } catch (error) {
    console.error('❌ Error testing local worker:', error);
  }
};

// Initialize worker source
setWorkerSource();

export { pdfjsLib };
