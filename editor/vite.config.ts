import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root,
  publicDir: path.resolve(root, "../projeto/public"),
  resolve: { alias: { remotion: path.resolve(root, "node_modules/remotion") } },
  server: { port: 5174, strictPort: true, proxy: { "/api/media": { target: "http://127.0.0.1:5175", changeOrigin: false }, "/api/render": { target: "http://127.0.0.1:5175", changeOrigin: false } } },
  build: { outDir: "dist", emptyOutDir: true },
});