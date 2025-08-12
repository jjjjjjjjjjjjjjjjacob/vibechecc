import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for the web frontend. Combines TanStack Start,
 * React, Tailwind, and path alias plugins. Build options mirror the
 * Nitro config to ensure optimal deployment on Cloudflare.
 */
export default defineConfig({
  server: {
    // Run dev server on port 3000 with less intrusive HMR overlay
    port: 3000,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    // Resolve TS path aliases
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    // Inject Tailwind's Vite plugin for faster builds
    tailwindcss(),
    // Enable TanStack Start support targeting Cloudflare workers
    tanstackStart({
      target: 'cloudflare-module',
      customViteReactPlugin: true,
    }),
    // React plugin last so it can process resulting JSX
    react(),
  ],
  build: {
    rollupOptions: {
      treeshake: {
        preset: 'recommended',
        propertyReadSideEffects: false,
        moduleSideEffects: false,
      },
      output: {
        // Manual chunks removed due to SSR external module conflicts
        assetFileNames: (assetInfo) => {
          // Optimize font file names and paths
          if (
            assetInfo.name &&
            /\.(woff|woff2|ttf|otf|eot)$/.test(assetInfo.name)
          ) {
            return 'fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    // Inline small assets to reduce requests
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
  },
  // Pre-bundle commonly used dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-router',
      '@tanstack/react-query',
    ],
  },
});
