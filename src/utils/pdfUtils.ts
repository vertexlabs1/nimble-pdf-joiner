
import { PDFDocument } from 'pdf-lib';

export interface MergeResult {
  success: boolean;
  mergedPdfBytes?: Uint8Array;
  processedFiles: string[];
  skippedFiles: { name: string; reason: string; }[];
  totalPages: number;
}

// More comprehensive validation to detect if pages will render as blank
async function validatePageContent(pdf: PDFDocument, pageIndex: number): Promise<boolean> {
  try {
    const page = pdf.getPage(pageIndex);
    const { width, height } = page.getSize();
    
    // If page has no dimensions, it's definitely empty
    if (width === 0 || height === 0) {
      console.log(`Page ${pageIndex} has no dimensions`);
      return false;
    }
    
    // Try to access page content stream
    try {
      const pageContent = page.node.Contents();
      
      // If no content at all
      if (!pageContent) {
        console.log(`Page ${pageIndex} has no content stream`);
        return false;
      }
      
      // If content is an empty array
      if (Array.isArray(pageContent) && pageContent.length === 0) {
        console.log(`Page ${pageIndex} has empty content array`);
        return false;
      }
      
      // Try to get the actual content bytes - this often fails for encrypted content
      if (Array.isArray(pageContent)) {
        for (const content of pageContent) {
          try {
            const bytes = content.Contents();
            if (!bytes || bytes.length === 0) {
              console.log(`Page ${pageIndex} content stream is empty`);
              return false;
            }
          } catch (contentError) {
            console.log(`Page ${pageIndex} content stream access failed:`, contentError);
            return false;
          }
        }
      } else {
        try {
          const bytes = pageContent.Contents();
          if (!bytes || bytes.length === 0) {
            console.log(`Page ${pageIndex} single content stream is empty`);
            return false;
          }
        } catch (contentError) {
          console.log(`Page ${pageIndex} single content stream access failed:`, contentError);
          return false;
        }
      }
      
    } catch (contentAccessError) {
      console.log(`Page ${pageIndex} content access completely failed:`, contentAccessError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`Page ${pageIndex} validation failed:`, error);
    return false;
  }
}

// More thorough test to detect if encrypted PDF will produce blank content
async function testEncryptedPdfContent(pdf: PDFDocument): Promise<boolean> {
  try {
    console.log('Testing encrypted PDF content...');
    
    // Test multiple pages if available (up to 3)
    const pageCount = pdf.getPageCount();
    const pagesToTest = Math.min(3, pageCount);
    
    for (let i = 0; i < pagesToTest; i++) {
      // First validate the source page
      const sourcePageValid = await validatePageContent(pdf, i);
      if (!sourcePageValid) {
        console.log(`Source page ${i} validation failed`);
        return false;
      }
      
      // Create a test PDF with this page
      try {
        const testPdf = await PDFDocument.create();
        const [copiedPage] = await testPdf.copyPages(pdf, [i]);
        testPdf.addPage(copiedPage);
        
        // Validate the copied page
        const copiedPageValid = await validatePageContent(testPdf, 0);
        if (!copiedPageValid) {
          console.log(`Copied page ${i} validation failed`);
          return false;
        }
        
        // Try to generate the test PDF bytes - this often fails for truly encrypted content
        try {
          const testBytes = await testPdf.save();
          if (!testBytes || testBytes.length < 1000) { // Very small PDFs are likely empty
            console.log(`Test PDF for page ${i} is too small (${testBytes?.length || 0} bytes)`);
            return false;
          }
        } catch (saveError) {
          console.log(`Failed to save test PDF for page ${i}:`, saveError);
          return false;
        }
        
      } catch (copyError) {
        console.log(`Failed to copy page ${i} for testing:`, copyError);
        return false;
      }
    }
    
    console.log('Encrypted PDF content test passed');
    return true;
  } catch (error) {
    console.log('Encrypted PDF content test failed:', error);
    return false;
  }
}

export async function mergePDFs(files: File[]): Promise<MergeResult> {
  console.log('Starting PDF merge with files:', files.map(f => f.name));
  
  const mergedPdf = await PDFDocument.create();
  const processedFiles: string[] = [];
  const skippedFiles: { name: string; reason: string; }[] = [];
  let totalPages = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      let pdf: PDFDocument;
      let isEncrypted = false;
      
      // First, try to load the PDF normally
      try {
        pdf = await PDFDocument.load(arrayBuffer);
      } catch (encryptionError) {
        console.log(`File ${file.name} appears to be encrypted, trying with ignoreEncryption...`);
        isEncrypted = true;
        
        // If it fails due to encryption, try with ignoreEncryption option
        try {
          pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          console.log(`Successfully loaded encrypted file: ${file.name}`);
        } catch (finalError) {
          console.error(`Failed to load encrypted file ${file.name}:`, finalError);
          skippedFiles.push({
            name: file.name,
            reason: 'File is encrypted and cannot be processed. Please remove password protection and try again.'
          });
          continue;
        }
      }
      
      // If the file was encrypted OR if we want to be extra cautious, test content validity
      if (pdf.getPageCount() > 0) {
        const hasValidContent = await testEncryptedPdfContent(pdf);
        if (!hasValidContent) {
          console.log(`File ${file.name} appears to have invalid or blank content`);
          const reason = isEncrypted 
            ? 'This encrypted PDF would produce blank pages in the merged document. Please remove password protection and try again.'
            : 'This PDF appears to have invalid content and would produce blank pages.';
          
          skippedFiles.push({
            name: file.name,
            reason: reason
          });
          continue;
        }
      }
      
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
      
      processedFiles.push(file.name);
      totalPages += copiedPages.length;
      console.log(`Added ${copiedPages.length} pages from ${file.name}`);
      
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
      skippedFiles.push({
        name: file.name,
        reason: 'Invalid or corrupted PDF file.'
      });
    }
  }

  // Check if we have any pages to merge
  if (totalPages === 0) {
    return {
      success: false,
      processedFiles,
      skippedFiles,
      totalPages: 0
    };
  }

  console.log('Generating final merged PDF...');
  const mergedPdfBytes = await mergedPdf.save();
  console.log(`PDF merge completed. Processed: ${processedFiles.length}, Skipped: ${skippedFiles.length}, Total pages: ${totalPages}`);
  
  return {
    success: true,
    mergedPdfBytes,
    processedFiles,
    skippedFiles,
    totalPages
  };
}

export function downloadBlob(data: Uint8Array, filename: string) {
  console.log('Starting download of:', filename);
  
  const blob = new Blob([data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('Download initiated for:', filename);
}
