import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { tuiPreviewsPlugin } from "./vite-plugin-tui-previews.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tuiPreviewsPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        changelog: resolve(__dirname, "changelog.html")
      }
    }
  }
});
