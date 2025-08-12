import { defineConfig } from 'tsup';

/**
 * Build configuration for the shared `@viberatr/types` package.
 * Bundles the TypeScript source into both CommonJS and ESM outputs
 * so downstream packages can consume the library in either module
 * system.
 */
export default defineConfig({
  // Start bundling from the entry point
  entry: ['src/index.ts'],
  // Produce both CJS and ESM builds
  format: ['cjs', 'esm'],
  // This package only ships runtime JS; no separate d.ts emit
  dts: false,
  // Remove previous build artifacts before generating new ones
  clean: true,
  // Generate source maps to aid debugging of consumers
  sourcemap: true,
  // Keep the output as a single file for each format
  splitting: false,
  bundle: true,
});
