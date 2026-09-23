// Post-build AI-readability regression check (FAB-021). Guards the whole AI-readability
// effort (FAB-008 pre-rendering, FAB-018 JSON-LD, FAB-019 llms.txt/Markdown mirrors,
// FAB-020 titles/descriptions/canonicals) against a future change that moves content back
// into client-side-only rendering. Serves `dist/` with a plain Node HTTP server (mirroring
// Netlify's pretty-URL fallback, same approach as scripts/check-nojs.mjs) and fetches one
// page of each content type with a plain `fetch` (no browser, no JavaScript execution),
// asserting:
//   - the headline and body text are present in the raw HTML (already checked by
//     check-nojs.mjs, re-asserted here as a base for the other checks)
//   - at least one <script type="application/ld+json"> block parses as JSON and has one of
//     the expected @type values
//   - <title> and the meta description are present and non-empty
//   - the page's Markdown mirror (FAB-019) exists and is non-empty, where the page has one
//   - robots.txt allows the AI crawler user agents
//   - sitemap.xml lists the page's canonical path
//
// Run after `vite-react-ssg build` and the other build-time scripts, as part of
// `npm run build` (see package.json) and in CI (.github/workflows/ci.yml).
//
//   node scripts/check-ai-readable.mjs

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');

const AI_USER_AGENTS = ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'anthropic-ai', 'PerplexityBot'];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

/** Mirrors netlify.toml's/`_redirects`' SPA fallback: serve the exact file if it exists,
 * else `<path>/index.html`, else the site-wide `index.html`. */
async function resolveFile(urlPath) {
  const cleanPath = urlPath.split('?')[0];
  const direct = join(DIST, decodeURIComponent(cleanPath));
  if (existsSync(direct) && (await stat(direct)).isFile()) return direct;

  const asIndex = join(DIST, decodeURIComponent(cleanPath), 'index.html');
  if (existsSync(asIndex)) return asIndex;

  return join(DIST, 'index.html');
}

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const filePath = await resolveFile(req.url ?? '/');
      const body = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME_TYPES[extname(filePath)] ?? 'application/octet-stream' });
      res.end(body);
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });
  return new Promise((resolvePromise) => {
    server.listen(0, '127.0.0.1', () => resolvePromise(server));
  });
}

/** True if `filePath` exists on disk *as an actual file*, not the SPA-fallback `index.html`
 * `resolveFile` would otherwise silently substitute — a missing Markdown mirror must fail
 * this check, not be masked by the fallback. */
function distFileExists(distRelativePath) {
  return existsSync(resolve(DIST, decodeURIComponent(distRelativePath.replace(/^\//, ''))));
}

// react-helmet-async prepends a `data-rh="true"` attribute to every tag it manages, so
// these can't assume a fixed attribute order (e.g. `<script data-rh="true"
// type="application/ld+json">`, `<meta data-rh="true" name="description" content="...">`).

function extractJsonLdBlocks(html) {
  const blocks = [];
  const re = /<script[^>]*\btype="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let match;
  while ((match = re.exec(html))) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      blocks.push(null); // present but unparseable — still recorded so it's reported as a failure
    }
  }
  return blocks;
}

function extractTitle(html) {
  const match = /<title[^>]*>([^<]*)<\/title>/.exec(html);
  return match ? match[1].trim() : '';
}

function extractMetaDescription(html) {
  const match = /<meta[^>]*\bname="description"[^>]*\bcontent="([^"]*)"/.exec(html);
  return match ? match[1].trim() : '';
}

async function main() {
  if (!existsSync(DIST)) {
    throw new Error(`dist/ not found at ${DIST} — run the build before check-ai-readable.mjs`);
  }

  const { loadNewsArticles } = await import('./build-feeds.mjs');
  const { transformWithEsbuild } = await import('vite');
  const parseFrontMatter = await (async () => {
    const tsPath = resolve(ROOT, 'src/lib/frontmatter.ts');
    const source = await readFile(tsPath, 'utf8');
    const { code } = await transformWithEsbuild(source, tsPath, { loader: 'ts', target: 'es2022' });
    const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
    const mod = await import(/* @vite-ignore */ dataUrl);
    return mod.parseFrontMatter;
  })();

  const articles = loadNewsArticles(parseFrontMatter);
  const faqTopics = JSON.parse(await readFile(resolve(ROOT, 'src/data/faq.json'), 'utf8'));
  const minutes = JSON.parse(await readFile(resolve(ROOT, 'src/data/minutes.json'), 'utf8'));

  const firstArticle = articles[0];
  const firstFaq = faqTopics.flatMap((t) => t.questions)[0];
  const firstMinute = minutes[0];

  if (!firstArticle) throw new Error('check-ai-readable: no news articles to check');
  if (!firstFaq) throw new Error('check-ai-readable: no FAQ questions to check');
  if (!firstMinute) throw new Error('check-ai-readable: no minutes to check');

  const server = await startServer();
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  const checks = [
    {
      path: '/',
      expectText: ['Barnsley FC Fan Advisory Board', firstArticle.title],
      jsonLdTypes: ['Organization'],
      sitemapPath: '/',
    },
    {
      path: `/news/${firstArticle.slug}`,
      expectText: [firstArticle.title],
      jsonLdTypes: ['NewsArticle'],
      markdownPath: `/news/${firstArticle.slug}.md`,
      sitemapPath: `/news/${firstArticle.slug}`,
    },
    {
      path: `/faq/${firstFaq.id}`,
      expectText: [firstFaq.question],
      jsonLdTypes: ['FAQPage'],
      markdownPath: `/faq/${firstFaq.id}.md`,
      sitemapPath: `/faq/${firstFaq.id}`,
    },
    {
      path: '/minutes',
      expectText: [firstMinute.title],
      jsonLdTypes: ['CollectionPage'],
      sitemapPath: '/minutes',
    },
    {
      path: `/meetings/${firstMinute.id}`,
      expectText: [firstMinute.title],
      jsonLdTypes: ['Event'],
      markdownPath: `/minutes/${firstMinute.id}.md`,
      // Past meetings aren't in the sitemap (only future ones are: see build-feeds.mjs's
      // buildSitemap), so there's no sitemap assertion for this route.
    },
  ];

  let sitemapXml = '';
  {
    const res = await fetch(`${base}/sitemap.xml`);
    sitemapXml = await res.text();
    if (res.status !== 200 || !sitemapXml.includes('<urlset')) {
      console.error('check-ai-readable: FAIL /sitemap.xml — missing or malformed');
      process.exitCode = 1;
    }
  }

  let robotsTxt = '';
  {
    const res = await fetch(`${base}/robots.txt`);
    robotsTxt = await res.text();
    if (res.status !== 200) {
      console.error('check-ai-readable: FAIL /robots.txt — missing');
      process.exitCode = 1;
    }
    for (const agent of AI_USER_AGENTS) {
      const re = new RegExp(`User-agent:\\s*${agent}\\s*\\n\\s*Allow:\\s*/`, 'i');
      if (!re.test(robotsTxt)) {
        console.error(`check-ai-readable: FAIL /robots.txt — does not explicitly allow ${agent}`);
        process.exitCode = 1;
      }
    }
  }

  let failures = 0;
  for (const check of checks) {
    const res = await fetch(`${base}${check.path}`);
    const html = await res.text();

    for (const text of check.expectText) {
      if (!html.includes(text)) {
        failures += 1;
        console.error(`check-ai-readable: FAIL ${check.path} — missing text "${text}"`);
      }
    }

    const title = extractTitle(html);
    if (!title) {
      failures += 1;
      console.error(`check-ai-readable: FAIL ${check.path} — <title> missing or empty`);
    }

    const description = extractMetaDescription(html);
    if (!description) {
      failures += 1;
      console.error(`check-ai-readable: FAIL ${check.path} — meta description missing or empty`);
    }

    const jsonLdBlocks = extractJsonLdBlocks(html);
    if (jsonLdBlocks.length === 0) {
      failures += 1;
      console.error(`check-ai-readable: FAIL ${check.path} — no JSON-LD <script> block found`);
    } else {
      const types = jsonLdBlocks.map((b) => b?.['@type']);
      const missingTypes = check.jsonLdTypes.filter((t) => !types.includes(t));
      if (missingTypes.length > 0) {
        failures += 1;
        console.error(
          `check-ai-readable: FAIL ${check.path} — expected JSON-LD @type(s) [${missingTypes.join(', ')}], found [${types.join(', ')}]`,
        );
      }
      if (jsonLdBlocks.some((b) => b === null)) {
        failures += 1;
        console.error(`check-ai-readable: FAIL ${check.path} — a JSON-LD <script> block failed to parse`);
      }
    }

    if (check.markdownPath) {
      if (!distFileExists(check.markdownPath)) {
        failures += 1;
        console.error(`check-ai-readable: FAIL ${check.path} — Markdown mirror ${check.markdownPath} missing`);
      } else {
        const mdRes = await fetch(`${base}${check.markdownPath}`);
        const md = await mdRes.text();
        if (mdRes.status !== 200 || !md.trim()) {
          failures += 1;
          console.error(`check-ai-readable: FAIL ${check.path} — Markdown mirror ${check.markdownPath} is empty`);
        }
      }
    }

    if (check.sitemapPath) {
      const loc = `https://fab.barnsleyfc.co.uk${check.sitemapPath}`;
      if (!sitemapXml.includes(`<loc>${loc}</loc>`) && !sitemapXml.includes(`<loc>${loc.replace(/\/$/, '')}</loc>`)) {
        failures += 1;
        console.error(`check-ai-readable: FAIL ${check.path} — sitemap.xml does not list ${loc}`);
      }
    }
  }

  server.close();

  if (failures > 0 || process.exitCode === 1) {
    console.error(`check-ai-readable: ${failures} page failure(s), see above`);
    process.exitCode = 1;
    return;
  }

  console.log(`check-ai-readable: ${checks.length} route(s) OK — text, JSON-LD, titles, Markdown mirrors, robots.txt and sitemap.xml all present`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
