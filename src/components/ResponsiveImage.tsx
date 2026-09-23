import { ImgHTMLAttributes } from 'react';

/** Must match the widths scripts/optimize-news-images.mjs generates. */
const WIDTHS = [400, 800, 1200] as const;
const NEWS_IMAGE_PREFIX = '/images/news/';
const RESPONSIVE_SOURCE_PATTERN = /\.(jpe?g|png)$/i;

export interface ResponsiveImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  /** The CSS `sizes` attribute describing how wide the image is rendered at each breakpoint. */
  sizes: string;
}

/**
 * Renders a news article image (see scripts/optimize-news-images.mjs and
 * docs/content-guide.md) as a `<picture>` offering AVIF and WebP sources at 400/800/1200px,
 * falling back to the original JPEG `<img>` for browsers that support neither. Cuts news
 * image payload roughly 60-80% versus the source JPEG (FAB-020, issue #50).
 *
 * Any `src` outside `/images/news/*.{jpg,jpeg,png}` (e.g. an unrelated image path) renders
 * as a plain `<img>` — the responsive variants only exist for news images.
 */
export default function ResponsiveImage({ src, alt, sizes, className, ...imgProps }: ResponsiveImageProps) {
  if (!src.startsWith(NEWS_IMAGE_PREFIX) || !RESPONSIVE_SOURCE_PATTERN.test(src)) {
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
