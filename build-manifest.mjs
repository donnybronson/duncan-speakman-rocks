// node build-manifest.mjs
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOUNDS_DIR = path.join(__dirname, "sounds");
const OUT_FILE = path.join(__dirname, "sounds.json");

const exts = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac"]);

function numericSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function labelFromFilename(filename) {
  // remove extension
  const base = filename.replace(/\.[^.]+$/, "");

  // extract leading number
  const match = base.match(/^\d+/);

  // if a number exists, use it
  if (match) {
    return match[0];
  }

  // fallback if no number exists
  return base;
}

async function main() {
  console.log("Manifest build starting…");
  console.log("Sounds dir:", SOUNDS_DIR);

  const files = (await readdir(SOUNDS_DIR))
    .filter((f) => exts.has(path.extname(f).toLowerCase()))
    .sort(numericSort);

  console.log(`Found ${files.length} audio file(s).`);

  const manifest = files.map((filename) => ({
    filename,
    label: labelFromFilename(filename)
  }));

  await writeFile(OUT_FILE, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Wrote:", OUT_FILE);
}

main().catch((err) => {
  console.error("Manifest build failed:");
  console.error(err);
  process.exit(1);
});
