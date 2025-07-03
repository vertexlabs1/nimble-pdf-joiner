
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { copyFileSync, existsSync, mkdirSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Copy PDF.js worker during build - always overwrite to ensure fresh copy
  const copyPDFWorker = () => {
    const workerSource = path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.js');
    const workerDest = path.resolve(__dirname, 'public/pdf.worker.min.js');
    
    // Ensure public directory exists
    const publicDir = path.resolve(__dirname, 'public');
    if (!existsSync(publicDir)) {
      try {
        mkdirSync(publicDir, { recursive: true });
        console.log('Created public directory');
      } catch (error) {
        console.warn('Failed to create public directory:', error);
      }
    }
    
    if (existsSync(workerSource)) {
      try {
        copyFileSync(workerSource, workerDest);
        console.log('PDF.js worker copied successfully');
      } catch (error) {
        console.warn('Failed to copy PDF.js worker:', error);
      }
    } else {
      console.warn('PDF.js worker source not found:', workerSource);
      console.log('This is normal during initial install - worker will be available after dependencies are installed');
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
