
import { PDFDocument } from 'pdf-lib';

export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  console.log('Starting PDF merge with files:', files.map(f => f.name));
  
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      
      copiedPages.forEach(page => mergedPdf.addPage(page));
      console.log(`Added ${copiedPages.length} pages from ${file.name}`);
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
      throw new Error(`Failed to process ${file.name}. Please ensure it's a valid PDF file.`);
    }
  }

  console.log('Generating final merged PDF...');
  const mergedPdfBytes = await mergedPdf.save();
  console.log('PDF merge completed successfully');
  
  return mergedPdfBytes;
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
