import { defineNitroConfig } from 'nitropack/config';

export default defineNitroConfig({
  rollupConfig: {
    treeshake: {
      preset: 'recommended',
      propertyReadSideEffects: false,
      moduleSideEffects: false,
    },
  },
  minify: true,
  experimental: {
    wasm: true,
  },
});
