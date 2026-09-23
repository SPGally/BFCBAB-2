// Build-time RSS feed and sitemap for the static site. Run after `vite build` (see the
// "build" script in package.json): writes dist/rss.xml (the 20 newest published news
// articles) and dist/sitemap.xml (every public route). Everything here reads the same
// files src/lib/content.ts reads (src/content/news/*.md, src/data/*.json) so the feed and
// sitemap always match what the site itself renders.
//
//   node scripts/build-feeds.mjs
//
// The front-matter parser is shared with the app via src/lib/frontmatter.ts. That file is
// TypeScript, so this plain Node script transpiles it with esbuild (bundled with Vite,
// already a project dependency) rather than duplicating the parsing rules.

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformWithEsbuild } from 'vite';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');

export const SITE_URL = 'https://fab.barnsleyfc.co.uk';
const RSS_ITEM_LIMIT = 20;

async function loadFrontMatterParser() {
  const tsPath = resolve(ROOT, 'src/lib/frontmatter.ts');
  const source = readFileSync(tsPath, 'utf8');
  const { code } = await transformWithEsbuild(source, tsPath, {
    loader: 'ts',
    target: 'es2022',
  });
  const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  // Not a static specifier Vite (or a bundler) can analyse; it's a runtime-only data: URL,
  // safe to skip the warning for.
  const mod = await import(/* @vite-ignore */ dataUrl);
  return mod.parseFrontMatter;
}

/** Mirrors the shape and filtering/sort rules of src/lib/content.ts's getNews(). */
export function loadNewsArticles(parseFrontMatter, now = new Date()) {
  const newsDir = resolve(ROOT, 'src/content/news');
  const files = readdirSync(newsDir).filter((f) => f.endsWith('.md'));
  const nowIso = now.toISOString();

  const articles = files.map((file) => {
    const raw = readFileSync(resolve(newsDir, file), 'utf8');
    const { data, body } = parseFrontMatter(raw);
    const fileSlug = file.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
    return {
      slug: data.slug || fileSlug,
      title: data.title || fileSlug,
      published_at: data.published_at || '',
      summary: data.summary || '',
      image: data.image ?? null,
      pinned: Boolean(data.pinned),
      draft: Boolean(data.draft),
      content_html: String(body).trim(),
    };
  });

  return articles
    .filter((a) => !a.draft && a.published_at && a.published_at <= nowIso)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.published_at).localeCompare(String(a.published_at));
    });
}

function loadJson(relativePath) {
  return JSON.parse(readFileSync(resolve(ROOT, relativePath), 'utf8'));
}

function xmlEscape(value) {
  return String(value).replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&apos;';
    }
  });
}

function imageMimeType(path) {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

export function buildRss(articles) {
  const newest = [...articles]
    .sort((a, b) => String(b.published_at).localeCompare(String(a.published_at)))
    .slice(0, RSS_ITEM_LIMIT);

  const items = newest
    .map((article) => {
      const url = `${SITE_URL}/news/${article.slug}`;
      const pubDate = new Date(article.published_at).toUTCString();
      const enclosure = article.image
        ? `<enclosure url="${xmlEscape(`${SITE_URL}${article.image}`)}" type="${imageMimeType(article.image)}" />`
        : '';
      return `    <item>
      <title>${xmlEscape(article.title)}</title>
      <link>${xmlEscape(url)}</link>
      <guid isPermaLink="true">${xmlEscape(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${xmlEscape(article.summary)}</description>
      ${enclosure}
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Barnsley FC Fan Advisory Board — News</title>
    <link>${SITE_URL}/news</link>
    <description>News from the Barnsley FC Fan Advisory Board.</description>
${items}
  </channel>
</rss>
`;
}

export function buildSitemap({ articles, faqTopics, upcomingMeetings, now = new Date() }) {
  const staticRoutes = [
    '/',
    '/about-us',
    '/minutes',
    '/meetings',
    '/news',
    '/faq',
    '/submit',
    '/visual-history',
  ];

  const futureMeetings = upcomingMeetings.filter((m) => new Date(m.date) >= now);

  const urls = [
    ...staticRoutes.map((path) => ({ loc: path })),
    ...articles.map((a) => ({ loc: `/news/${a.slug}`, lastmod: a.published_at })),
    ...futureMeetings.map((m) => ({ loc: `/meetings/${m.id}` })),
    ...faqTopics.flatMap((topic) => topic.questions.map((q) => ({ loc: `/faq/${q.id}` }))),
  ];

  const entries = urls
    .map(({ loc, lastmod }) => {
      const lastmodTag = lastmod ? `\n    <lastmod>${xmlEscape(lastmod.slice(0, 10))}</lastmod>` : '';
      return `  <url>
    <loc>${xmlEscape(`${SITE_URL}${loc}`)}</loc>${lastmodTag}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

async function main() {
  if (!existsSync(DIST)) {
    throw new Error(`dist/ not found at ${DIST} — run "vite build" before build-feeds.mjs`);
  }

  const parseFrontMatter = await loadFrontMatterParser();
  const now = new Date();
  const articles = loadNewsArticles(parseFrontMatter, now);
  const faqTopics = loadJson('src/data/faq.json');
  const upcomingMeetings = loadJson('src/data/meetings.json');

  const rss = buildRss(articles);
  const sitemap = buildSitemap({ articles, faqTopics, upcomingMeetings, now });

  writeFileSync(resolve(DIST, 'rss.xml'), rss);
  writeFileSync(resolve(DIST, 'sitemap.xml'), sitemap);

  console.log(`build-feeds: wrote dist/rss.xml (${Math.min(articles.length, RSS_ITEM_LIMIT)} items)`);
  console.log('build-feeds: wrote dist/sitemap.xml');
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
