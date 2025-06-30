import { defineConfig } from '@tanstack/react-start/config';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import type { InlineConfig } from 'vite';
import { cloudflare } from 'unenv';

const viteConfig: InlineConfig = {
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
  ],
};

export default defineConfig({
  server: {
    preset: 'cloudflare-module',
    unenv: cloudflare,
  },
  tsr: {
    appDirectory: 'src',
  },
  vite: viteConfig,
});
