import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
  },
  base: '/',
  ssgOptions: {
    script: 'async',
    // `/foo` -> `/foo/index.html`, matching Netlify's pretty-URL + `_redirects` fallback.
    dirStyle: 'nested',
    beastiesOptions: false,
    formatting: 'none',
  },
});
