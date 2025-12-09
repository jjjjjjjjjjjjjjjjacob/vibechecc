import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/constants/index.ts',
    'src/format/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
    compilerOptions: {
      composite: false,
    },
  },
  splitting: true,
  sourcemap: false,
  clean: true,
  treeshake: true,
});
