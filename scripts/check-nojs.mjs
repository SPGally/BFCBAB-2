// Post-build no-JS regression check for FAB-008 (pre-rendering). Serves `dist/` with a
// plain Node HTTP server (mirroring Netlify's pretty-URL + `_redirects` fallback: an exact
// file wins, otherwise `<path>/index.html`, otherwise the SPA shell) and fetches one page
// of each content type with a plain `fetch` (no JavaScript execution), asserting the
// expected headline/body text is present in the raw HTML. Run after `vite-react-ssg build`
// as part of `npm run build`, so a pre-rendering regression fails CI.
//
//   node scripts/check-nojs.mjs

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.xml': 'application/xml',
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

async function main() {
  if (!existsSync(DIST)) {
    throw new Error(`dist/ not found at ${DIST} — run the build before check-nojs.mjs`);
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
  const meetings = JSON.parse(await readFile(resolve(ROOT, 'src/data/meetings.json'), 'utf8'));

  const firstArticle = articles[0];
  const firstFaq = faqTopics.flatMap((t) => t.questions)[0];
  const firstMinute = minutes[0];
  const firstMeeting = meetings[0];

  if (!firstArticle) throw new Error('check-nojs: no news articles to check');
  if (!firstFaq) throw new Error('check-nojs: no FAQ questions to check');
  if (!firstMinute) throw new Error('check-nojs: no minutes to check');

  const server = await startServer();
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  const checks = [
    // The site name alone isn't enough here: it's in the navbar/footer markup on every
    // page, including the SPA fallback shell dist/index.html doubles as (dirStyle:
    // 'nested' + Netlify's fallback rule both resolve unknown paths to it), so that alone
    // would pass even if the home page's dynamic content failed to pre-render. Assert the
    // latest news headline too — it only appears once Home has actually pre-rendered its
    // "Latest News" section.
    { path: '/', expect: ['Barnsley FC Fan Advisory Board', firstArticle.title] },
    { path: `/news/${firstArticle.slug}`, expect: [firstArticle.title] },
    { path: `/faq/${firstFaq.id}`, expect: [firstFaq.question] },
    { path: `/minutes`, expect: [firstMinute.title] },
    { path: `/meetings/${firstMinute.id}`, expect: [firstMinute.title] },
  ];
  if (firstMeeting) {
    checks.push({ path: `/meetings/${firstMeeting.id}`, expect: [firstMeeting.title] });
  }

  let failures = 0;
  for (const { path, expect } of checks) {
    const res = await fetch(`${base}${path}`);
    const html = await res.text();
    for (const text of expect) {
      if (!html.includes(text)) {
        failures += 1;
        console.error(`check-nojs: FAIL ${path} — missing "${text}"`);
      }
    }
    if (!/<div id="root"[^>]*>[\s\S]*?\S[\s\S]*?<\/div>/.test(html)) {
      failures += 1;
      console.error(`check-nojs: FAIL ${path} — #root looks empty (not pre-rendered)`);
    }
  }

  server.close();

  if (failures > 0) {
    console.error(`check-nojs: ${failures} failure(s)`);
    process.exitCode = 1;
    return;
  }

  console.log(`check-nojs: ${checks.length} route(s) OK, no JavaScript required`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
