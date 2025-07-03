import React, { useEffect } from 'react';
import { pdfjsLib } from '@/utils/pdfConfig';

export default function PDFWorkerDebug() {
  useEffect(() => {
    console.log('Testing PDF.js setup:');
    console.log('- Version:', pdfjsLib.version);
    console.log('- Worker source:', pdfjsLib.GlobalWorkerOptions.workerSrc);
    
    // Try to load worker directly
    fetch('/pdf.worker.min.js')
      .then(res => {
        console.log('- Worker fetch status:', res.status);
        return res.text();
      })
      .then(text => {
        console.log('- Worker content starts with:', text.substring(0, 50));
        console.log('- Is JavaScript?', !text.startsWith('<'));
        if (text.startsWith('<')) {
          console.error('❌ Worker file contains HTML instead of JavaScript!');
        } else {
          console.log('✅ Worker file contains JavaScript');
        }
      })
      .catch(error => {
        console.error('- Worker fetch failed:', error);
      });
  }, []);

  return null; // This is just a debugging component
}