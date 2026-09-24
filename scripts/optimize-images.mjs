// Generates responsive, modern-format variants of the site's content photos: news article
// images (public/images/news/), board member photos (public/images/members/) and the
// visual-history gallery (public/images/*.jpg at the top level). FAB-020 (issue #50) did
// this for news images first, since they were the main contributor to a 4.1s mobile LCP;
// FAB-023 (issue #64) extended it to the other two directories, which were the largest
// remaining Lighthouse performance offenders (/about-us 0.83, /visual-history 0.74, the
// latter with a 13s LCP from an unoptimized 276 KB header photo plus ten more unlazied
// full-size JPEGs below it).
//
// For every source JPEG this writes AVIF and WebP files at three widths, named
// `<basename>-<width>w.<format>` next to the original, e.g.
//   welcome-the-fan-advisory-board.jpg
//   welcome-the-fan-advisory-board-400w.webp
//   welcome-the-fan-advisory-board-400w.avif
//   welcome-the-fan-advisory-board-800w.webp
//   ...
// <ResponsiveImage> (src/components/ResponsiveImage.tsx) assumes this exact naming
// convention and always requests all three widths, so every source image must have all
// three variants — widths wider than the source are simply capped to the source's own
// width (never upscaled), so the file always exists. The original JPEG is left untouched
// and used as the final <img> fallback.
//
// Idempotent and incremental: a variant is only (re)written if it is missing or older
// than its source. Run manually after adding/replacing a photo (see docs/content-guide.md)
// and automatically as part of `npm run build`, so a forgotten regeneration still produces
// variants in dist/ before deploy.
//
//   node scripts/optimize-images.mjs

import { readdirSync, statSync } from 'node:fs';
import { resolve, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const WIDTHS = [400, 800, 1200];
const FORMATS = ['avif', 'webp'];

// The top-level public/images directory also holds the site logo and the Parliament
// sponsor logo (small PNGs used as-is, not through <ResponsiveImage>) — only the
// visual-history JPEGs there need variants, so the root entry is JPEG-only and
// non-recursive (it must not descend into news/ or members/, which are handled by their
// own entries below).
const TARGETS = [
  { dir: resolve(ROOT, 'public/images/news'), extensions: ['.jpg', '.jpeg', '.png'] },
  { dir: resolve(ROOT, 'public/images/members'), extensions: ['.jpg', '.jpeg', '.png'] },
  { dir: resolve(ROOT, 'public/images'), extensions: ['.jpg', '.jpeg'] },
];

async function main() {
  let written = 0;
  let skipped = 0;

  for (const target of TARGETS) {
    const extensions = new Set(target.extensions);
    const entries = readdirSync(target.dir, { withFileTypes: true }).filter(
      (entry) => entry.isFile() && extensions.has(extname(entry.name).toLowerCase())
    );

    for (const entry of entries) {
      const sourcePath = resolve(target.dir, entry.name);
      const sourceStat = statSync(sourcePath);
      const name = basename(entry.name, extname(entry.name));
      const image = sharp(sourcePath);
      const metadata = await image.metadata();
      const sourceWidth = metadata.width ?? Math.max(...WIDTHS);

      for (const targetWidth of WIDTHS) {
        const width = Math.min(targetWidth, sourceWidth);
        for (const format of FORMATS) {
          const outPath = resolve(target.dir, `${name}-${targetWidth}w.${format}`);
          if (existsAndFresh(outPath, sourceStat.mtimeMs)) {
            skipped++;
            continue;
          }
          await sharp(sourcePath)
            .resize({ width, withoutEnlargement: true })
            .toFormat(format, format === 'avif' ? { quality: 55 } : { quality: 75 })
            .toFile(outPath);
          written++;
        }
      }
    }
  }

  console.log(`optimize-images: wrote ${written} variant(s), ${skipped} already up to date`);
}

function existsAndFresh(path, sourceMtimeMs) {
  try {
    const stat = statSync(path);
    return stat.mtimeMs >= sourceMtimeMs;
  } catch {
    return false;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
