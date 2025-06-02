import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['./node_modules'],
  },
});
