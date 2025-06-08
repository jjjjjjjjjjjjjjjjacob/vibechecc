import { defineConfig } from '@tanstack/react-start/config';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import type { InlineConfig } from 'vite';

const viteConfig: InlineConfig = {
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
  ],
};

export default defineConfig({
  tsr: {
    appDirectory: 'src',
  },
  vite: viteConfig,
});
