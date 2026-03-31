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
    // Reduce memory usage during build
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return undefined;

          // React core — must be first (many packages depend on it)
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/") ||
            id.includes("wouter")
          ) {
            return "react-vendor";
          }

          // Radix UI primitives — the biggest group (~26 packages)
          if (id.includes("@radix-ui/")) {
            return "radix-vendor";
          }

          // Lucide icons — thousands of SVG icons
          if (id.includes("lucide-react")) {
            return "icons-vendor";
          }

          // Chart libraries
          if (
            id.includes("chart.js") ||
            id.includes("recharts") ||
            id.includes("react-chartjs") ||
            id.includes("/d3") ||
            id.includes("d3-")
          ) {
            return "charts-vendor";
          }

          // Sentry (large SDK)
          if (id.includes("@sentry/")) {
            return "sentry-vendor";
          }

          // tRPC and TanStack Query
          if (id.includes("@trpc/") || id.includes("@tanstack/")) {
            return "trpc-vendor";
          }

          // Markdown / KaTeX / Mermaid rendering (streamdown dependencies)
          if (
            id.includes("katex") ||
            id.includes("streamdown") ||
            id.includes("mermaid") ||
            id.includes("shiki") ||
            id.includes("@shikijs") ||
            id.includes("marked") ||
            id.includes("react-markdown") ||
            id.includes("rehype") ||
            id.includes("remark") ||
            id.includes("unified") ||
            id.includes("hast") ||
            id.includes("mdast") ||
            id.includes("micromark") ||
            id.includes("unist")
          ) {
            return "markdown-vendor";
          }

          // Document generation (heavy — docx, jspdf, file-saver)
          if (
            id.includes("docx") ||
            id.includes("jspdf") ||
            id.includes("file-saver")
          ) {
            return "docs-vendor";
          }

          // Form and date libraries
          if (
            id.includes("react-hook-form") ||
            id.includes("react-day-picker") ||
            id.includes("embla-carousel") ||
            id.includes("date-fns")
          ) {
            return "forms-vendor";
          }

          // Utility libraries
          if (
            id.includes("zod") ||
            id.includes("superjson") ||
            id.includes("tailwind-merge") ||
            id.includes("clsx") ||
            id.includes("class-variance-authority") ||
            id.includes("cmdk") ||
            id.includes("vaul") ||
            id.includes("sonner") ||
            id.includes("next-themes") ||
            id.includes("input-otp") ||
            id.includes("react-resizable-panels")
          ) {
            return "utils-vendor";
          }

          // Animation
          if (id.includes("framer-motion")) {
            return "animation-vendor";
          }

          // Everything else (should be small now)
          return "vendor";
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
