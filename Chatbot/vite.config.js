import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist", // Ensures correct build directory
    assetsDir: "assets", // Stores assets properly
  },
  server: {
    mimeTypes: {
      "application/javascript": ["js"],
    },
  },
  publicDir: "public", // Ensures `_headers` is included
});
