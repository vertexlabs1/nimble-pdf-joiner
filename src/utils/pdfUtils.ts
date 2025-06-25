
import { PDFDocument } from 'pdf-lib';

export interface MergeResult {
  success: boolean;
  mergedPdfBytes?: Uint8Array;
  processedFiles: string[];
  skippedFiles: { name: string; reason: string; }[];
  totalPages: number;
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
      
      // First, try to load the PDF normally
      try {
        pdf = await PDFDocument.load(arrayBuffer);
      } catch (encryptionError) {
        console.log(`File ${file.name} appears to be encrypted, trying with ignoreEncryption...`);
        
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
