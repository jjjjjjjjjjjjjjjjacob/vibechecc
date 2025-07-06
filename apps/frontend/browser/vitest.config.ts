import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { config as rootConfig } from '../../../vitest.config';

export default defineConfig({
  ...rootConfig,
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],
  test: {
    ...rootConfig.test,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['./node_modules'],
  },
});
