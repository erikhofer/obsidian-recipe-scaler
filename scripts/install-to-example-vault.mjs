import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), "..");
const dest = resolve(
  root,
  "example-vault/.obsidian/plugins/recipe-scaler"
);
mkdirSync(dest, { recursive: true });

for (const file of ["main.js", "manifest.json", "styles.css"]) {
  const src = resolve(root, file);
  if (!existsSync(src)) {
    console.error(`Missing build artifact: ${file}`);
    process.exit(1);
  }
  copyFileSync(src, resolve(dest, file));
  console.log(`Copied ${file}`);
}
