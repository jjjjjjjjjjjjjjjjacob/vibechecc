import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

export const config = defineConfig({
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['./node_modules'],
  },
});

export default config;
