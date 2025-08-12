/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import tsConfigPaths from 'vite-tsconfig-paths';

/**
 * Vitest configuration for the web application.
 * Sets up React, path aliases, and coverage thresholds to keep
 * frontend code well tested.
 */
export default defineConfig({
  plugins: [
    react(),
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],
  test: {
    // Enable global test APIs like `describe` and `it`
    globals: true,
    // Run tests in a DOM-like environment for React components
    environment: 'happy-dom',
    // Register setup to install DOM polyfills and matchers
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Ignore generated and config files from coverage
      exclude: [
        'coverage/**',
        'dist/**',
        '**/*.d.ts',
        'test{,s}/**',
        '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
        '**/__tests__/**',
        '**/*.config.{js,ts}',
        'src/components/ui/**', // shadcn components
        'src/vite-env.d.ts',
        'src/routeTree.gen.ts',
      ],
      include: ['src/**/*.{ts,tsx}'],
      thresholds: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60,
        },
      },
    },
  },
  // Convenience import aliases shared across tests
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@viberatr/convex': resolve(__dirname, '../convex'),
      '@viberatr/types': resolve(__dirname, '../../packages/types/src'),
      '@viberatr/utils': resolve(__dirname, '../../packages/utils/src'),
    },
  },
});
