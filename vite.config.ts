import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { minutesSplitPlugin } from './vite-plugins/minutes-split';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), minutesSplitPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  server: {
    port: 5173,
  },
  base: '/',
});
