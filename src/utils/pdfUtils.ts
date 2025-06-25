
import { PDFDocument } from 'pdf-lib';

export interface MergeResult {
  success: boolean;
  mergedPdfBytes?: Uint8Array;
  processedFiles: string[];
  skippedFiles: { name: string; reason: string; }[];
  totalPages: number;
}

export interface EncryptedFileInfo {
  name: string;
  index: number;
}

// Check if a PDF file is encrypted by attempting to load it normally
async function checkIfEncrypted(file: File): Promise<boolean> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    await PDFDocument.load(arrayBuffer);
    return false; // Successfully loaded, not encrypted
  } catch (error) {
    // If loading fails, it might be encrypted
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    return errorMessage.includes('encrypt') || errorMessage.includes('password') || errorMessage.includes('security');
  }
}

// Detect which files are encrypted before merging
export async function detectEncryptedFiles(files: File[]): Promise<EncryptedFileInfo[]> {
  console.log('Checking for encrypted files...');
  const encryptedFiles: EncryptedFileInfo[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const isEncrypted = await checkIfEncrypted(file);
    if (isEncrypted) {
      console.log(`Detected encrypted file: ${file.name}`);
      encryptedFiles.push({ name: file.name, index: i });
    }
  }
  
  console.log(`Found ${encryptedFiles.length} encrypted files`);
  return encryptedFiles;
}

export async function mergePDFs(files: File[], includeEncrypted: boolean = true): Promise<MergeResult> {
  console.log('Starting PDF merge with files:', files.map(f => f.name));
  console.log('Include encrypted files:', includeEncrypted);
  
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
        console.log(`File ${file.name} appears to be encrypted`);
        wasEncrypted = true;
        
        if (!includeEncrypted) {
          console.log(`Skipping encrypted file: ${file.name} (user chose not to include)`);
          skippedFiles.push({
            name: file.name,
            reason: 'Password-protected file skipped by user choice.'
          });
          continue;
        }
        
        // Try with ignoreEncryption option
        try {
          pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          console.log(`Successfully loaded encrypted file: ${file.name} with ignoreEncryption`);
        } catch (finalError) {
          console.error(`Failed to load encrypted file ${file.name}:`, finalError);
          skippedFiles.push({
            name: file.name,
            reason: 'Password-protected PDF could not be processed. The file may be corrupted or use unsupported encryption.'
          });
          continue;
        }
      }
      
      // Check if PDF has pages
      if (pdf.getPageCount() === 0) {
        console.log(`File ${file.name} has no pages - skipping`);
        skippedFiles.push({
          name: file.name,
          reason: 'This PDF file contains no pages.'
        });
        continue;
      }
      
      // Copy pages to merged PDF
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
      
      processedFiles.push(file.name);
      totalPages += copiedPages.length;
      
      if (wasEncrypted) {
        console.log(`Added ${copiedPages.length} pages from encrypted file ${file.name}`);
      } else {
        console.log(`Added ${copiedPages.length} pages from ${file.name}`);
      }
      
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
