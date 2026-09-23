// Generates responsive, modern-format variants of the news article images in
// public/images/news/ (FAB-020: news images were the main contributor to a 4.1s mobile
// LCP — see issue #50). For every source JPEG this writes AVIF and WebP files at three
// widths, named `<basename>-<width>w.<format>` next to the original, e.g.
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
// than its source. Run manually after adding/replacing a news image (see
// docs/content-guide.md) and automatically as part of `npm run build`, so a forgotten
// regeneration still produces variants in dist/ before deploy.
//
//   node scripts/optimize-news-images.mjs

import { readdirSync, statSync } from 'node:fs';
import { resolve, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NEWS_DIR = resolve(ROOT, 'public/images/news');

const WIDTHS = [400, 800, 1200];
const FORMATS = ['avif', 'webp'];
const SOURCE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

async function main() {
  const entries = readdirSync(NEWS_DIR).filter((name) =>
    SOURCE_EXTENSIONS.has(extname(name).toLowerCase())
  );

  let written = 0;
  let skipped = 0;

  for (const file of entries) {
    const sourcePath = resolve(NEWS_DIR, file);
    const sourceStat = statSync(sourcePath);
    const name = basename(file, extname(file));
    const image = sharp(sourcePath);
    const metadata = await image.metadata();
    const sourceWidth = metadata.width ?? Math.max(...WIDTHS);

    for (const targetWidth of WIDTHS) {
      const width = Math.min(targetWidth, sourceWidth);
      for (const format of FORMATS) {
        const outPath = resolve(NEWS_DIR, `${name}-${targetWidth}w.${format}`);
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

  console.log(`optimize-news-images: wrote ${written} variant(s), ${skipped} already up to date`);
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
