
import { PDFDocument } from 'pdf-lib';

export interface MergeResult {
  success: boolean;
  mergedPdfBytes?: Uint8Array;
  processedFiles: string[];
  skippedFiles: { name: string; reason: string; }[];
  totalPages: number;
}

// Helper function to validate if a PDF page has actual content
async function validatePageContent(pdf: PDFDocument, pageIndex: number): Promise<boolean> {
  try {
    const page = pdf.getPage(pageIndex);
    const { width, height } = page.getSize();
    
    // If page has no dimensions, it's likely empty
    if (width === 0 || height === 0) {
      return false;
    }
    
    // Try to get page content - if it throws or returns minimal content, it might be encrypted
    const pageContent = page.node.Contents();
    if (!pageContent || (Array.isArray(pageContent) && pageContent.length === 0)) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('Content validation failed for page:', error);
    return false;
  }
}

// Test if an encrypted PDF will produce blank content when merged
async function testEncryptedPdfContent(pdf: PDFDocument): Promise<boolean> {
  try {
    // Create a test PDF with the first page
    const testPdf = await PDFDocument.create();
    const [firstPage] = await testPdf.copyPages(pdf, [0]);
    testPdf.addPage(firstPage);
    
    // Check if the first page has valid content
    const hasContent = await validatePageContent(testPdf, 0);
    console.log('Encrypted PDF content test result:', hasContent);
    
    return hasContent;
  } catch (error) {
    console.log('Failed to test encrypted PDF content:', error);
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
      
      // If the file was encrypted, test if it will produce blank content
      if (isEncrypted && pdf.getPageCount() > 0) {
        const hasValidContent = await testEncryptedPdfContent(pdf);
        if (!hasValidContent) {
          console.log(`Encrypted file ${file.name} appears to have blank content`);
          skippedFiles.push({
            name: file.name,
            reason: 'This encrypted PDF would produce blank pages in the merged document. Please remove password protection and try again.'
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
