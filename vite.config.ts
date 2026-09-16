import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { mars3dPlugin } from "vite-plugin-mars3d";
import vueDevTools from "vite-plugin-vue-devtools";

export default defineConfig({
  plugins: [vue(), mars3dPlugin(), vueDevTools()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  worker: {
    format: "es",
  },
  server: {
    host: "0.0.0.0",
    port: 36000,
    strictPort: false,
    open: true,
    proxy: {
      "/serviceApi": {
        target: "http://172.16.18.58:37002",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "html",
    target: "chrome130",
    assetsDir: "assets",
    assetsInlineLimit: 4096,
    sourcemap: false,
    rollupOptions: {
      output: {
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
