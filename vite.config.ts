
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { copyFileSync, existsSync, mkdirSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Copy PDF.js worker during build - ALWAYS overwrite to ensure correct content
  const copyPDFWorker = () => {
    const workerSource = path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.js');
    const workerDest = path.resolve(__dirname, 'public/pdf.worker.min.js');
    
    console.log('🔄 FORCE copying PDF.js worker (always overwrite)...');
    console.log('From:', workerSource);
    console.log('To:', workerDest);
    
    // Ensure public directory exists
    const publicDir = path.resolve(__dirname, 'public');
    if (!existsSync(publicDir)) {
      mkdirSync(publicDir, { recursive: true });
      console.log('✅ Created public directory');
    }
    
    if (existsSync(workerSource)) {
      try {
        // ALWAYS copy (remove any existing file first)
        copyFileSync(workerSource, workerDest);
        
        // CRITICAL: Verify the copied file contains JavaScript, not HTML
        const fs = require('fs');
        const content = fs.readFileSync(workerDest, 'utf8');
        const first100chars = content.substring(0, 100);
        
        console.log('📝 Verifying worker file content...');
        console.log('First 100 chars:', first100chars);
        
        if (content.startsWith('<!DOCTYPE') || content.startsWith('<html') || content.includes('<html>')) {
          console.error('❌ CRITICAL: Worker file contains HTML instead of JavaScript!');
          console.error('File content preview:', first100chars);
          throw new Error('Worker file corrupted - contains HTML');
        }
        
        if (content.includes('var Module') || content.includes('self.pdfjsWorker') || content.includes('importScripts')) {
          console.log('✅ PDF.js worker copied and verified - contains valid JavaScript');
          return true;
        } else {
          console.warn('⚠️ Worker file may not be valid PDF.js worker code');
          console.log('Expected to find: var Module, self.pdfjsWorker, or importScripts');
          return false;
        }
      } catch (error) {
        console.error('❌ Failed to copy/verify PDF.js worker:', error);
        return false;
      }
    } else {
      console.warn('⚠️ PDF.js worker source not found:', workerSource);
      return false;
    }
  };

  // Copy worker file - but don't fail if it doesn't exist yet
  try {
    copyPDFWorker();
  } catch (error) {
    console.log('PDF.js worker copy skipped (dependencies may still be installing)');
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: ['pdfjs-dist'],
    },
    worker: {
      format: 'es',
    },
    assetsInclude: ['**/*.worker.js', '**/*.worker.min.js'],
    build: {
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.worker.min.js')) {
              return 'assets/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          }
        }
      }
    },
  };
});
