import { Head } from 'vite-react-ssg';
import { SITE_NAME, SITE_URL } from '../lib/site';

interface SeoProps {
  title: string;
  description: string;
  /** Path from the site root, e.g. "/news/some-article". */
  path: string;
  image?: string | null;
  type?: 'website' | 'article';
  /** Set false when `title` is already the full page title (e.g. the home page). */
  appendSiteName?: boolean;
  /**
   * Path from the site root to this page's Markdown mirror (FAB-019), e.g.
   * "/faq/some-id.md". Set on pages that have one (FAQ entries, news articles, minutes).
   */
  markdownPath?: string;
  /** JSON-LD structured data object(s) to embed as <script type="application/ld+json">
   * tags, baked into the pre-rendered HTML alongside the other head tags. */
  jsonLd?: object | object[];
}

/** Sets the per-page <title>, description, canonical URL and OG/Twitter tags, baked into
 * the pre-rendered static HTML for that route (see FAB-008). */
export default function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  appendSiteName = true,
  markdownPath,
  jsonLd,
}: SeoProps) {
  const url = `${SITE_URL}${path}`;
  const imageUrl = image ? `${SITE_URL}${image}` : null;
  const fullTitle = appendSiteName ? `${title} - ${SITE_NAME}` : title;
  const jsonLdBlocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {markdownPath && (
        <link rel="alternate" type="text/markdown" href={`${SITE_URL}${markdownPath}`} />
      )}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      <meta name="twitter:card" content={imageUrl ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      {jsonLdBlocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Head>
  );
}
