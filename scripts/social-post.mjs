#!/usr/bin/env node
// Post to the FAB Facebook page and/or X account from the command line.
//
//   node scripts/social-post.mjs --text "..." [--link URL] [--image path-or-URL] [--to facebook,x] [--dry-run]
//   node scripts/social-post.mjs --article <slug> [--to facebook,x] [--dry-run]
//
// --article builds the post from src/content/news/<date>-<slug>.md (title, summary, link, image).
// --dry-run prints exactly what would be sent and touches nothing.
// Credentials are read from .env.social in the repo root (gitignored; see .env.social.example).
// No dependencies: Node 20+, fetch, crypto only.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, basename, extname } from 'node:path';
import { createHmac, randomBytes } from 'node:crypto';

const ROOT = resolve(new URL('.', import.meta.url).pathname, '..');
const SITE = process.env.FAB_SITE_URL || 'https://fab.barnsleyfc.co.uk';
const X_LIMIT = 280;
const X_URL_LEN = 23; // every URL counts as 23 characters on X

// ---------- args ----------
const args = process.argv.slice(2);
const opt = (name, fallback = undefined) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const v = args[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
const dryRun = args.includes('--dry-run');
const targets = String(opt('to', 'facebook,x')).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
for (const t of targets) if (!['facebook', 'x'].includes(t)) die(`Unknown target "${t}" (use facebook, x)`);

function die(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

// ---------- env ----------
function loadEnv() {
  const p = resolve(ROOT, '.env.social');
  const env = {};
  if (existsSync(p)) {
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !line.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return { ...env, ...process.env };
}
const env = loadEnv();

// ---------- post content ----------
function parseFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const data = {};
  if (!m) return { data, body: raw };
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (v === 'true') v = true;
    else if (v === 'false') v = false;
    else if (v === 'null' || v === '') v = null;
    else if (v.startsWith('"')) v = JSON.parse(v);
    data[k] = v;
  }
  return { data, body: m[2] };
}

function fromArticle(slug) {
  const dir = resolve(ROOT, 'src/content/news');
  const file = readdirSync(dir).find((f) => f.endsWith(`-${slug}.md`) || f === `${slug}.md`);
  if (!file) die(`No article found for slug "${slug}" in src/content/news`);
  const { data } = parseFrontMatter(readFileSync(resolve(dir, file), 'utf8'));
  if (data.draft) die(`Article "${slug}" is a draft; publish it first`);
  return {
    text: `${data.title}\n\n${data.summary || ''}`.trim(),
    link: `${SITE}/news/${data.slug || slug}`,
    image: data.image ? resolve(ROOT, 'public', data.image.replace(/^\//, '')) : null,
  };
}

let post;
if (opt('article')) post = fromArticle(String(opt('article')));
else if (opt('text')) post = { text: String(opt('text')), link: opt('link') ? String(opt('link')) : null, image: opt('image') ? String(opt('image')) : null };
else die('Give --text "..." or --article <slug>');

if (post.image && !/^https?:\/\//.test(post.image)) {
  post.image = resolve(post.image);
  if (!existsSync(post.image)) die(`Image not found: ${post.image}`);
}

// X: text plus a link must fit in 280; trim the text if needed.
function xText({ text, link }) {
  const budget = X_LIMIT - (link ? X_URL_LEN + 2 : 0);
  let t = text;
  if (t.length > budget) t = t.slice(0, budget - 1).replace(/\s+\S*$/, '') + '…';
  return link ? `${t}\n\n${link}` : t;
}
function fbText({ text, link }) {
  return link ? `${text}\n\n${link}` : text;
}

// ---------- Facebook ----------
async function postFacebook() {
  const pageId = env.FB_PAGE_ID;
  const token = env.FB_PAGE_TOKEN;
  const message = fbText(post);
  if (dryRun) return console.log(`\n[facebook] would post to page ${pageId || '<FB_PAGE_ID not set>'}:\n${message}\n${post.image ? `[facebook] with image ${post.image}` : ''}`);
  if (!pageId || !token) die('FB_PAGE_ID and FB_PAGE_TOKEN are required in .env.social');

  let res;
  if (post.image) {
    // Photo post with caption. Local files are uploaded; URLs are fetched by Facebook.
    const form = new FormData();
    form.set('caption', message);
    form.set('access_token', token);
    if (/^https?:\/\//.test(post.image)) form.set('url', post.image);
    else form.set('source', new Blob([readFileSync(post.image)]), basename(post.image));
    res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, { method: 'POST', body: form });
  } else {
    const body = new URLSearchParams({ message, access_token: token });
    if (post.link) body.set('link', post.link);
    res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, { method: 'POST', body });
  }
  const json = await res.json();
  if (!res.ok || json.error) die(`Facebook: ${JSON.stringify(json.error || json)}`);
  console.log(`[facebook] posted: id ${json.post_id || json.id}`);
}

// ---------- X (OAuth 1.0a user context, no library) ----------
const pct = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
function oauthHeader(method, url, params = {}) {
  const k = env.X_API_KEY, ks = env.X_API_SECRET, t = env.X_ACCESS_TOKEN, ts = env.X_ACCESS_SECRET;
  if (!k || !ks || !t || !ts) die('X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN and X_ACCESS_SECRET are required in .env.social');
  const oauth = {
    oauth_consumer_key: k,
    oauth_nonce: randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: t,
    oauth_version: '1.0',
  };
  const all = { ...params, ...oauth };
  const paramString = Object.keys(all).sort().map((key) => `${pct(key)}=${pct(all[key])}`).join('&');
  const base = `${method.toUpperCase()}&${pct(url)}&${pct(paramString)}`;
  const signingKey = `${pct(ks)}&${pct(ts)}`;
  oauth.oauth_signature = createHmac('sha1', signingKey).update(base).digest('base64');
  return 'OAuth ' + Object.keys(oauth).sort().map((key) => `${pct(key)}="${pct(oauth[key])}"`).join(', ');
}

async function xUploadMedia(imagePath) {
  let bytes;
  if (/^https?:\/\//.test(imagePath)) bytes = Buffer.from(await (await fetch(imagePath)).arrayBuffer());
  else bytes = readFileSync(imagePath);
  const url = 'https://upload.twitter.com/1.1/media/upload.json';
  const form = new FormData();
  form.set('media', new Blob([bytes]), basename(imagePath) || `image${extname(imagePath) || '.jpg'}`);
  const res = await fetch(url, { method: 'POST', headers: { Authorization: oauthHeader('POST', url) }, body: form });
  const json = await res.json();
  if (!res.ok) die(`X media upload: ${JSON.stringify(json)}`);
  return json.media_id_string;
}

async function postX() {
  const text = xText(post);
  const weighted = text.replace(/https?:\/\/\S+/g, 'x'.repeat(X_URL_LEN)).length; // X counts every URL as 23
  if (dryRun) return console.log(`\n[x] would post (${weighted}/${X_LIMIT} chars as X counts them):\n${text}\n${post.image ? `[x] with image ${post.image}` : ''}`);
  const body = { text };
  if (post.image) body.media = { media_ids: [await xUploadMedia(post.image)] };
  const url = 'https://api.twitter.com/2/tweets';
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: oauthHeader('POST', url), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) die(`X: ${JSON.stringify(json)}`);
  console.log(`[x] posted: https://x.com/i/status/${json.data.id}`);
}

// ---------- run ----------
console.log(dryRun ? 'DRY RUN, nothing will be sent.' : 'Posting…');
for (const t of targets) {
  if (t === 'facebook') await postFacebook();
  if (t === 'x') await postX();
}
