import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist", // Ensures correct build directory
    assetsDir: "assets", // Stores assets properly
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    mimeTypes: {
      "application/javascript": ["js"],
    },
  },
  publicDir: "public", // Ensures `_headers` is included
});
