import { defineConfig } from 'vite';
import { config } from '../../vitest.config';

export default defineConfig({
  ...config,
  test: {
    ...config.test,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
  },
});
