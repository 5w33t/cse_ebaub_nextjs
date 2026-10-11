import manifestJson from "@/lib/generated/asset-manifest.json";
import type { AssetManifest, FileAsset, ImageAsset } from "@/scripts/generate-asset-manifest";

/**
 * The static asset manifest, built by scripts/generate-asset-manifest.ts on predev/prebuild.
 * Imported statically so it is bundled; a missing file is a build error on purpose.
 */
export const manifest = manifestJson as AssetManifest;

export function listImages(folder?: string): ImageAsset[] {
  return folder ? manifest.images.filter((i) => i.folder === folder) : manifest.images;
}

export function listFiles(folder?: string): FileAsset[] {
  return folder ? manifest.files.filter((f) => f.folder === folder) : manifest.files;
}

export function imageFolders(): string[] {
  return [...new Set(manifest.images.map((i) => i.folder))].sort();
}

export function findImage(src: string): ImageAsset | undefined {
  return manifest.images.find((i) => i.path === src);
}
