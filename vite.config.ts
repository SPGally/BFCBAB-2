import type { ConfigEnv, UserConfig } from 'vite';
import type { ViteReactSSGOptions } from 'vite-react-ssg';
import react from '@vitejs/plugin-react';
import { minutesSplitPlugin } from './vite-plugins/minutes-split';

// vite-react-ssg's `ssgOptions` isn't part of vite's own `UserConfig` type (this version of
// the package doesn't augment it), so we type the config object ourselves rather than lose
// type-checking on the rest of the file by casting the whole thing to `any`.
type Config = UserConfig & { ssgOptions: Partial<ViteReactSSGOptions> };

// https://vitejs.dev/config/
export default function config({ isSsrBuild }: ConfigEnv): Config {
  return {
    plugins: [react(), minutesSplitPlugin()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          // `react` etc are external in the SSR build (vite-react-ssg's server pass), so
          // manualChunks can't reference them there without Rollup erroring.
          manualChunks: isSsrBuild
            ? undefined
            : {
                'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              },
        },
      },
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
  };
}
