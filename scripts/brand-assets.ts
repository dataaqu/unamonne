import { mkdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

/**
 * Derive the loader-sized mark from the studio's master art.
 *
 * The masters are 4000px and 8000px squares with a lot of transparent margin
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

// The loader shows the mark at ~152px and the wordmark at ~280px, so these are
// roughly 3.5x — enough for any screen, small enough to arrive with the HTML.
const ASSETS = [
  { from: "fav.webp", to: "moon.webp", width: 560, quality: 82 },
] as const;

/** Trimmed of its transparent margin and sized for the loader. */
function prepare(file: string, width: number) {
  return (
    sharp(path.join(ROOT, file))
      // `threshold: 1` trims fully transparent pixels only, so no part of the
      // artwork's own soft edge is eaten.
      .trim({ threshold: 1 })
      .resize({ width, withoutEnlargement: true })
  );
}

function report(name: string, info: sharp.OutputInfo) {
  console.log(
    `brand/${name}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} kB`,
  );
}

/**
 * The wordmark, repainted white.
 *
 * The master draws the name in black on transparency, which disappears against
 * the cocoa the overture plays on. Only the colour is replaced: the original
 * alpha is kept as the mask, so every serif and every hairline of the logotype
 * survives exactly as drawn. (Setting the name in a font is not an option — the
 * logotype is a high-contrast serif, and the house's text face is a grotesque.)
 */
async function whiteWordmark() {
  const { data, info } = await prepare("logotext.webp", 1200)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mask = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .extractChannel("alpha")
    .toBuffer();

  const out = await sharp({
    create: {
      width: info.width,
      height: info.height,
      channels: 3,
      background: "#ffffff",
    },
  })
    .joinChannel(mask, {
      raw: { width: info.width, height: info.height, channels: 1 },
    })
    .webp({ quality: 92, effort: 6, alphaQuality: 100 })
    .toFile(path.join(OUT, "wordmark.webp"));

  report("wordmark.webp", out);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  for (const asset of ASSETS) {
    report(
      asset.to,
      await prepare(asset.from, asset.width)
        .webp({ quality: asset.quality, effort: 6 })
        .toFile(path.join(OUT, asset.to)),
    );
  }

  await whiteWordmark();
}

main().then(() => process.exit(0));
