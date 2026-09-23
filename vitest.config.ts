import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { minutesSplitPlugin } from './vite-plugins/minutes-split';

export default defineConfig({
  plugins: [react(), minutesSplitPlugin()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
