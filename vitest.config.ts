import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

/**
 * Shared Vitest configuration used by packages that don't maintain
 * their own config. It wires up path aliases and a happy-dom
 * environment so tests run in a browser-like context.
 */
export const config = defineConfig({
  // Resolve TS path aliases across the monorepo
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],
  test: {
    // Use a minimal DOM implementation for component tests
    environment: 'happy-dom',
    // Register global setup (see vitest.setup.ts)
    setupFiles: ['./vitest.setup.ts'],
    // Skip node_modules to speed up test runs
    exclude: ['./node_modules'],
    // Ensure NODE_ENV is set to test for libraries relying on it
    env: {
      NODE_ENV: 'test',
      VITEST: 'true',
    },
  },
});

export default config;
