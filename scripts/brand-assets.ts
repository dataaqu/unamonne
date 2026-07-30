import { mkdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

/**
 * Derive the loader-sized mark from the studio's master art.
 *
 * The master (`public/fav.webp`) is a 4000px square with a lot of transparent
 * margin around the crescent. That is right for a source file and wrong for the
 * first thing a visitor downloads, so this trims the margin away and resizes to
 * the largest size the loader can show on a 3x screen. The wordmark is not here
 * on purpose: it is set as type, so it needs no artwork at all.
 *
 * Re-run whenever the studio replaces the master art:
 *
 *   npm run brand:assets
 */
const ROOT = path.join(process.cwd(), "public");
const OUT = path.join(ROOT, "brand");

// The loader shows the mark at ~152px, so 560 is roughly 3.5x — enough for any
// screen, small enough to arrive with the HTML.
const ASSETS = [
  { from: "fav.webp", to: "moon.webp", width: 560, quality: 82 },
] as const;

async function main() {
  await mkdir(OUT, { recursive: true });

  for (const asset of ASSETS) {
    const info = await sharp(path.join(ROOT, asset.from))
      // `threshold: 1` trims fully transparent pixels only, so no part of the
      // artwork's own soft edge is eaten.
      .trim({ threshold: 1 })
      .resize({ width: asset.width, withoutEnlargement: true })
      .webp({ quality: asset.quality, effort: 6 })
      .toFile(path.join(OUT, asset.to));

    console.log(
      `${asset.from} → brand/${asset.to}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} kB`,
    );
  }
}

main().then(() => process.exit(0));
