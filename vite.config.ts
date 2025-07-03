
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { copyFileSync, existsSync, mkdirSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Copy PDF.js worker during build - ensure it's always available
  const copyPDFWorker = () => {
    const workerSource = path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.js');
    const workerDest = path.resolve(__dirname, 'public/pdf.worker.min.js');
    
    console.log('📋 Copying PDF.js worker...');
    console.log('From:', workerSource);
    console.log('To:', workerDest);
    
    // Ensure public directory exists
    const publicDir = path.resolve(__dirname, 'public');
    if (!existsSync(publicDir)) {
      try {
        mkdirSync(publicDir, { recursive: true });
        console.log('✅ Created public directory');
      } catch (error) {
        console.error('❌ Failed to create public directory:', error);
        return false;
      }
    }
    
    if (existsSync(workerSource)) {
      try {
        copyFileSync(workerSource, workerDest);
        
        // Verify the copied file is valid JavaScript
        const content = require('fs').readFileSync(workerDest, 'utf8');
        if (content.startsWith('<!DOCTYPE') || content.startsWith('<html')) {
          console.error('❌ Worker file contains HTML instead of JavaScript!');
          return false;
        }
        
        console.log('✅ PDF.js worker copied and verified successfully');
        return true;
      } catch (error) {
        console.error('❌ Failed to copy PDF.js worker:', error);
        return false;
      }
    } else {
      console.warn('⚠️ PDF.js worker source not found:', workerSource);
      console.log('This is normal during initial install - worker will be available after dependencies are installed');
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
