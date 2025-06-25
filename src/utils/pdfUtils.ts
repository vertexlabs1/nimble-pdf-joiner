import { PDFDocument } from 'pdf-lib';

export interface MergeResult {
  success: boolean;
  mergedPdfBytes?: Uint8Array;
  processedFiles: string[];
  skippedFiles: { name: string; reason: string; }[];
  totalPages: number;
}

// Simplified but more reliable validation for encrypted content
async function isEncryptedContentBlank(pdf: PDFDocument): Promise<boolean> {
  try {
    console.log('Testing if encrypted PDF will produce blank content...');
    
    // Create a small test PDF with the first page
    const testPdf = await PDFDocument.create();
    
    try {
      // Try to copy the first page
      const [copiedPage] = await testPdf.copyPages(pdf, [0]);
      testPdf.addPage(copiedPage);
      
      // Try to save the test PDF
      const testBytes = await testPdf.save();
      
      // Check if the generated PDF is suspiciously small (likely means blank content)
      if (testBytes.length < 2000) {
        console.log(`Test PDF is too small (${testBytes.length} bytes) - likely blank content`);
        return true; // Content is blank
      }
      
      console.log(`Test PDF size: ${testBytes.length} bytes - content appears valid`);
      return false; // Content appears valid
      
    } catch (copyError) {
      console.log('Failed to copy page for testing:', copyError);
      return true; // If we can't copy, assume it's encrypted/blank
    }
    
  } catch (error) {
    console.log('Encrypted content test failed:', error);
    return true; // If test fails, assume content is blank
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
      let wasEncrypted = false;
      
      // First, try to load the PDF normally
      try {
        pdf = await PDFDocument.load(arrayBuffer);
        console.log(`Successfully loaded ${file.name} normally`);
      } catch (encryptionError) {
        console.log(`File ${file.name} appears to be encrypted, trying with ignoreEncryption...`);
        wasEncrypted = true;
        
        // If it fails due to encryption, try with ignoreEncryption option
        try {
          pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          console.log(`Successfully loaded encrypted file: ${file.name} with ignoreEncryption`);
        } catch (finalError) {
          console.error(`Failed to load encrypted file ${file.name}:`, finalError);
          skippedFiles.push({
            name: file.name,
            reason: 'File is password-protected and cannot be processed. Please remove the password and try again.'
          });
          continue;
        }
      }
      
      // If the file was loaded with ignoreEncryption, test if it will produce blank content
      if (wasEncrypted && pdf.getPageCount() > 0) {
        const isBlank = await isEncryptedContentBlank(pdf);
        if (isBlank) {
          console.log(`File ${file.name} would produce blank pages - skipping`);
          skippedFiles.push({
            name: file.name,
            reason: 'This password-protected PDF would produce blank pages. Please remove the password protection and try again.'
          });
          continue;
        }
      }
      
      // If we get here, the PDF should be valid - proceed with merging
      if (pdf.getPageCount() === 0) {
        console.log(`File ${file.name} has no pages - skipping`);
        skippedFiles.push({
          name: file.name,
          reason: 'This PDF file contains no pages.'
        });
        continue;
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
