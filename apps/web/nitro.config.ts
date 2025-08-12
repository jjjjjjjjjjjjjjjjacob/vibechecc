import { defineNitroConfig } from 'nitropack/config';

/**
 * Nitro configuration for the web app's server build.
 * The options mirror our Vite build optimizations so the Cloudflare
 * runtime receives a small, tree-shaken bundle.
 */
export default defineNitroConfig({
  rollupConfig: {
    treeshake: {
      // Use recommended tree shaking to drop unused code
      preset: 'recommended',
      propertyReadSideEffects: false,
      moduleSideEffects: false,
    },
  },
  // Minify the server output for faster delivery
  minify: true,
  experimental: {
    // Enable WebAssembly support when the runtime allows it
    wasm: true,
  },
});
