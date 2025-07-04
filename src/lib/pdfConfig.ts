import { pdfjs } from 'react-pdf';

// Configure react-pdf worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// PDF configuration options
export const PDF_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: ['application/pdf'],
  THUMBNAIL_SIZE: { width: 150, height: 200 },
  PREVIEW_SIZE: { width: 800, height: 1000 },
  REDACT_COLOR: '#000000',
  WATERMARK_OPACITY: 0.5,
  IMAGE_QUALITY: 0.8,
  MAX_PAGES_PREVIEW: 50
};

// File validation
export const validatePDFFile = (file: File): string | null => {
  if (!file) return 'No file selected';
  if (file.size > PDF_CONFIG.MAX_FILE_SIZE) {
    return `File too large. Maximum size is ${PDF_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }
  if (!PDF_CONFIG.SUPPORTED_FORMATS.includes(file.type)) {
    return 'Only PDF files are supported';
  }
  return null;
};

// Utility functions
export const createObjectURL = (file: File): string => {
  return URL.createObjectURL(file);
};

export const revokeObjectURL = (url: string): void => {
  URL.revokeObjectURL(url);
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};