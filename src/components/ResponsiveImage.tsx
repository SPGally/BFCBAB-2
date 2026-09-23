import { ImgHTMLAttributes } from 'react';

/** Must match the widths scripts/optimize-images.mjs generates. */
const WIDTHS = [400, 800, 1200] as const;
// scripts/optimize-images.mjs generates variants for news images, member photos and the
// top-level visual-history gallery (but not subdirectories other than news/ and members/,
// and not PNGs at the top level — those are logos used as plain <img>s, not through this
// component).
const RESPONSIVE_SOURCE_PATTERN =
  /^\/images\/(news\/[^/]+\.(jpe?g|png)|members\/[^/]+\.(jpe?g|png)|[^/]+\.jpe?g)$/i;

export interface ResponsiveImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  /** The CSS `sizes` attribute describing how wide the image is rendered at each breakpoint. */
  sizes: string;
}

/**
 * Renders a news, member or visual-history photo (see scripts/optimize-images.mjs and
 * docs/content-guide.md) as a `<picture>` offering AVIF and WebP sources at 400/800/1200px,
 * falling back to the original JPEG/PNG `<img>` for browsers that support neither. Cuts
 * image payload roughly 60-80% versus the source (FAB-020/#50 for news images, FAB-023/#64
 * for member photos and the visual-history gallery).
 *
 * Any `src` outside those three directories (e.g. an unrelated image path, or a top-level
 * PNG logo) renders as a plain `<img>` — the responsive variants only exist for content
 * photos.
 */
export default function ResponsiveImage({ src, alt, sizes, className, ...imgProps }: ResponsiveImageProps) {
  if (!RESPONSIVE_SOURCE_PATTERN.test(src)) {
    return <img src={src} alt={alt} className={className} {...imgProps} />;
  }

  const extensionIndex = src.lastIndexOf('.');
  const base = src.slice(0, extensionIndex);
  const srcSetFor = (format: 'avif' | 'webp') =>
    WIDTHS.map((width) => `${base}-${width}w.${format} ${width}w`).join(', ');

  return (
    <picture style={{ display: 'block', width: '100%', height: '100%' }}>
      <source type="image/avif" srcSet={srcSetFor('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSetFor('webp')} sizes={sizes} />
      <img src={src} alt={alt} className={className} {...imgProps} />
    </picture>
  );
}
