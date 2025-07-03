import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { copyFileSync, existsSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Copy PDF.js worker during build
  const copyPDFWorker = () => {
    const workerSource = path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.js');
    const workerDest = path.resolve(__dirname, 'public/pdf.worker.min.js');
    
    if (existsSync(workerSource) && !existsSync(workerDest)) {
      try {
        copyFileSync(workerSource, workerDest);
        console.log('PDF.js worker copied successfully');
      } catch (error) {
        console.warn('Failed to copy PDF.js worker:', error);
      }
    }
  };

  // Copy worker file
  copyPDFWorker();

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