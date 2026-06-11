import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

const plugins = [react(), tailwindcss(), vitePluginManusRuntime()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  base: "/",
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        // Safe manualChunks: only split leaf libraries that have no internal
        // cross-imports with React core. This avoids the circular dependency
        // issue (vendor → react-vendor → vendor) that broke React.createContext.
        manualChunks(id) {
          // Heavy PDF libraries — lazy loaded, safe to isolate
          if (id.includes("node_modules/pdfjs-dist")) {
            return "pdf-viewer";
          }
          if (id.includes("node_modules/jspdf")) {
            return "pdf-export";
          }
          // Chart libraries
          if (id.includes("node_modules/recharts") || id.includes("node_modules/chart.js")) {
            return "charts";
          }
          // Animation library
          if (id.includes("node_modules/framer-motion")) {
            return "motion";
          }
          // Document generation
          if (id.includes("node_modules/docx") || id.includes("node_modules/mammoth")) {
            return "docx";
          }
          // Date utilities
          if (id.includes("node_modules/date-fns")) {
            return "date-fns";
          }
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
