
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { copyFileSync, existsSync, mkdirSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  console.log('🚀 Vite config: Using CDN-only PDF.js worker strategy');

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
    // Define global for PDF.js worker compatibility
    define: {
      global: 'globalThis',
    },
    build: {
      rollupOptions: {
        external: (id) => {
          // Allow PDF.js worker to be loaded from CDN
          return id.includes('pdf.worker');
        }
      }
    },
  };
});
