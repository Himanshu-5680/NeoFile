import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const skip = new Set(["node_modules", "dist", "target", "build", ".gradle", "artifacts"]);
const include = new Set([".ts", ".tsx", ".js", ".mjs", ".css", ".html", ".json", ".rs", ".java", ".kt", ".xml", ".md", ".gradle", ".toml", ".ps1", ".sh", ".yml"]);

let bytes = 0;
let files = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name) || name.startsWith(".")) continue;
    const path = join(dir, name);
    const portablePath = path.replace(/\\/g, "/");
    if (portablePath.includes("/ios/App/App/public/") || portablePath.includes("/android/app/src/main/assets/")) continue;
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (portablePath.endsWith("/android/app/build") || portablePath.includes("/src-tauri/gen/")) continue;
      walk(path);
      continue;
    }
    const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
    if (!include.has(ext)) continue;
    if (name === "package-lock.json" || name.endsWith(".keystore")) continue;
    bytes += stat.size;
    files += 1;
  }
}
walk(root);
const mb = bytes / (1024 * 1024);
console.log(`${files} source files, ${(bytes / 1024).toFixed(1)} KB (${mb.toFixed(2)} MB)`);
if (bytes > 10 * 1024 * 1024) {
  console.error("Source is over the 10 MB budget.");
  process.exit(1);
}
