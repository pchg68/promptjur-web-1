/**
 * Post-build script: fix __vite__mapDeps paths
 *
 * Vite generates relative paths like "assets/chunk.js" inside __vite__mapDeps.
 * When the browser loads /assets/index.js and tries to dynamically import
 * "assets/chunk.js", it resolves to /assets/assets/chunk.js — which returns
 * the SPA fallback (index.html) instead of the actual JS chunk.
 *
 * This script rewrites those paths to absolute "/assets/chunk.js" so the
 * browser resolves them correctly from the site root.
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const distDir = new URL("../dist/public/assets", import.meta.url).pathname;

let fixedCount = 0;

for (const file of readdirSync(distDir)) {
  if (!file.endsWith(".js")) continue;

  const filePath = join(distDir, file);
  const original = readFileSync(filePath, "utf-8");

  // Match the __vite__mapDeps array: ["assets/foo.js","assets/bar.css",...]
  // Replace "assets/ with "/assets/ only inside __vite__mapDeps
  const fixed = original.replace(
    /(__vite__mapDeps\s*=\s*\([\s\S]*?m\.f\s*\|\|\s*\(m\.f\s*=\s*\[)([\s\S]*?)(\]\)\)\))/,
    (match, prefix, deps, suffix) => {
      const fixedDeps = deps.replace(/"assets\//g, '"/assets/');
      if (fixedDeps !== deps) {
        fixedCount++;
        console.log(`  Fixed: ${file}`);
      }
      return prefix + fixedDeps + suffix;
    }
  );

  if (fixed !== original) {
    writeFileSync(filePath, fixed, "utf-8");
  }
}

console.log(`\n✓ fix-vite-map-deps: ${fixedCount} file(s) patched.`);
