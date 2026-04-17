import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  resolve: {
    alias: {
      "@shared": path.resolve(import.meta.dirname, "./shared"),
    },
  },
  test: {
    environment: "node",
    testTimeout: 30000,
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "client/src/__tests__/**/*.test.ts",
      "shared/__tests__/**/*.test.ts"
    ],
  },
});
