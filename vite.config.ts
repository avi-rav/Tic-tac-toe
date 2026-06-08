/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
    // The project path contains spaces, which breaks vitest's default 'forks'
    // worker pool (it URL-encodes the path). 'threads' avoids that.
    pool: 'threads',
  },
});
