/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import tsConfigPaths from 'vite-tsconfig-paths';

// Integration test configuration - uses real Convex backend
export default defineConfig({
  plugins: [
    react(),
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],
  test: {
    name: 'integration',
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.integration.ts'],
    include: ['**/*.integration.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/*.d.ts',
        'test{,s}/**',
        '**/*.config.{js,ts}',
        'src/components/ui/**',
        'src/vite-env.d.ts',
        'src/routeTree.gen.ts',
      ],
    },
    testTimeout: 30000, // Longer timeout for integration tests
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@viberatr/convex': resolve(__dirname, '../convex'),
      '@viberatr/types': resolve(__dirname, '../../packages/types/src'),
      '@viberatr/utils': resolve(__dirname, '../../packages/utils/src'),
    },
  },
});
