// build-manifest.mjs
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

function parseLabels(filename) {
  const base = filename.replace(/\.[^.]+$/, ""); // strip extension

  // leading digits (if present)
  const m = base.match(/^(\d+)\s*[-_. ]?\s*(.*)$/);

  if (!m) {
    // no leading number
    return { number: "", name: base };
  }

  const number = m[1] ?? "";
  const restRaw = m[2] ?? "";

  // clean the name (rest of filename)
  const name = restRaw
    .replace(/[_-]+/g, " ")
    .trim();

  return { number, name: name || base };
}

async function main() {
  console.log("Manifest build starting…");
  console.log("Sounds dir:", SOUNDS_DIR);

  const files = (await readdir(SOUNDS_DIR))
    .filter((f) => exts.has(path.extname(f).toLowerCase()))
    .sort(numericSort);

  console.log(`Found ${files.length} audio file(s).`);

  const manifest = files.map((filename) => {
    const { number, name } = parseLabels(filename);
    return { filename, number, name };
  });

  await writeFile(OUT_FILE, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Wrote:", OUT_FILE);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});