/**
 * Scans public/images and public/files and writes lib/generated/asset-manifest.json.
 * Runs on `predev` and `prebuild`. Both the admin pickers and next/image read the manifest.
 *
 *   npm run manifest
 */
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { imageSize } from "image-size";

const ROOT = process.cwd();
const IMAGES_DIR = join(ROOT, "public", "images");
const FILES_DIR = join(ROOT, "public", "files");
const OUT_FILE = join(ROOT, "lib", "generated", "asset-manifest.json");

const IMAGE_EXT = new Set([".webp", ".avif", ".png", ".jpg", ".jpeg", ".gif", ".svg"]);
const FILE_EXT = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".zip"]);

export type ImageAsset = {
  path: string;
  folder: string;
  name: string;
  ext: string;
  width: number;
  height: number;
  bytes: number;
};

export type FileAsset = {
  path: string;
  folder: string;
  name: string;
  ext: string;
  bytes: number;
};

export type AssetManifest = {
  generatedAt: string;
  images: ImageAsset[];
  files: FileAsset[];
};

function walk(dir: string): string[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const entry of entries) {
    if (entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function toPosix(p: string): string {
  return p.split("\\").join("/");
}

function folderOf(rel: string): string {
  const parts = rel.split("/");
  return parts.length > 1 ? parts[0] : "";
}

function collectImages(): ImageAsset[] {
  const assets: ImageAsset[] = [];
  for (const full of walk(IMAGES_DIR)) {
    const ext = extname(full).toLowerCase();
    if (!IMAGE_EXT.has(ext)) continue;
    const rel = toPosix(relative(IMAGES_DIR, full));
    let width = 0;
    let height = 0;
    try {
      const dims = imageSize(readFileSync(full));
      width = dims.width ?? 0;
      height = dims.height ?? 0;
    } catch (error) {
      console.warn(`[manifest] Could not read dimensions for ${rel}:`, (error as Error).message);
    }
    assets.push({
      path: `/images/${rel}`,
      folder: folderOf(rel),
      name: rel.split("/").pop() ?? rel,
      ext: ext.slice(1),
      width,
      height,
      bytes: statSync(full).size,
    });
  }
  return assets.sort((a, b) => a.path.localeCompare(b.path));
}

function collectFiles(): FileAsset[] {
  const assets: FileAsset[] = [];
  for (const full of walk(FILES_DIR)) {
    const ext = extname(full).toLowerCase();
    if (!FILE_EXT.has(ext)) continue;
    const rel = toPosix(relative(FILES_DIR, full));
    assets.push({
      path: `/files/${rel}`,
      folder: folderOf(rel),
      name: rel.split("/").pop() ?? rel,
      ext: ext.slice(1),
      bytes: statSync(full).size,
    });
  }
  return assets.sort((a, b) => a.path.localeCompare(b.path));
}

function main() {
  const manifest: AssetManifest = {
    generatedAt: new Date().toISOString(),
    images: collectImages(),
    files: collectFiles(),
  };
  mkdirSync(join(ROOT, "lib", "generated"), { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2) + "\n");
  const oversized = manifest.images.filter((i) => i.width > 2400);
  console.log(`[manifest] ${manifest.images.length} images, ${manifest.files.length} files → lib/generated/asset-manifest.json`);
  if (oversized.length) {
    console.warn(`[manifest] ${oversized.length} image(s) wider than 2400px:`);
    for (const img of oversized) console.warn(`  ${img.path} (${img.width}×${img.height})`);
  }
}

main();
