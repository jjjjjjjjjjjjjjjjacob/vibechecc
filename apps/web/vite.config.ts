import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      target: 'cloudflare-module',
      customViteReactPlugin: true,
    }),
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
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-avatar', '@radix-ui/react-dialog'],
          convex: ['convex', '@viberater/convex'],
          clerk: ['@clerk/tanstack-react-start'],
          query: ['@tanstack/react-query', '@tanstack/react-router'],
        },
      },
    },
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
  },
});
