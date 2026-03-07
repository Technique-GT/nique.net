import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  plugins: [
    tailwindcss() as any,
    react()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Specific Heavy Libraries - Match these FIRST to prevent them being caught by generic 'react' check
            
            // PDF libraries
            if (id.includes('pdfjs-dist') || id.includes('react-pdf')) {
              return 'pdf-vendor';
            }

            // Rich Text Editor
            if (id.includes('react-quill-new')) {
              return 'editor-vendor';
            }

            // UI Libraries
            if (id.includes('swiper')) return 'swiper-vendor';
            if (id.includes('react-select')) return 'react-select-vendor';
            if (id.includes('react-dropzone')) return 'dropzone-vendor';
            
            // Icon libraries
            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'icons-vendor';
            }

            // Core React Framework - grouping subpaths like react/jsx-runtime, react-dom/client
            // Check for exact package names to avoid catching 'react-pdf', 'react-icons', etc.
            if (
              id.includes('/node_modules/react/') || 
              id.includes('/node_modules/react-dom/') || 
              id.includes('/node_modules/react-router-dom/') || 
              id.includes('/node_modules/scheduler/') ||
              id.includes('/node_modules/react-router/')
            ) {
              return 'framework';
            }

            // Everything else in node_modules goes to vendor
            return 'vendor';
          }
        }
      }
    }
  }
})
