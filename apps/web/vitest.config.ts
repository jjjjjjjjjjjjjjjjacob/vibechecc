/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@vibechecc/convex': resolve(__dirname, '../convex'),
      '@vibechecc/types': resolve(__dirname, '../../packages/types/src'),
      '@vibechecc/utils': resolve(__dirname, '../../packages/utils/src'),
    },
  },
});
