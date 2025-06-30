// app.config.ts
import { defineConfig } from "@tanstack/react-start/config";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "unenv";
var viteConfig = {
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"]
    }),
    tailwindcss()
  ]
};
var app_config_default = defineConfig({
  server: {
    preset: "cloudflare-module",
    unenv: cloudflare()
  },
  tsr: {
    appDirectory: "src"
  },
  vite: viteConfig
});
export {
  app_config_default as default
};
