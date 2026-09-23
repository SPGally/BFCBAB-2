// Build-time llms.txt / llms-full.txt and per-entry Markdown mirrors, for AI crawlers and
// browsing agents that prefer plain text/Markdown over HTML. Run after build-feeds.mjs (see
// the "build" script in package.json), so dist/ already exists:
//
//   node scripts/build-llms.mjs
//
// Writes:
//   dist/llms.txt        - what the FAB is, one line per key page, links to every mirror
//   dist/llms-full.txt   - every FAQ entry and news article, in full, as plain text
//   dist/faq/<id>.md      - one Markdown mirror per FAQ entry
//   dist/news/<slug>.md   - one Markdown mirror per published news article
//   dist/minutes/<date>.md - one Markdown mirror per set of minutes
//
// Reads the same files src/lib/content.ts reads (src/content/news/*.md, src/data/*.json),
// via the front-matter loader shared with scripts/build-feeds.mjs, so the mirrors always
// match what the site itself renders.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformWithEsbuild } from 'vite';
import { SITE_URL, loadNewsArticles } from './build-feeds.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');

const SITE_NAME = 'Barnsley FC Fan Advisory Board';
const SITE_SUMMARY =
  'The Barnsley FC Fan Advisory Board (FAB) is a group of elected supporters who meet the ' +
  "club's senior staff regularly to raise supporters' questions, get answers on the record, " +
  "and feed into decisions that affect fans.";

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

function loadJson(relativePath) {
  return JSON.parse(readFileSync(resolve(ROOT, relativePath), 'utf8'));
}

const HTML_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  mdash: '—',
  ndash: '–',
  hellip: '…',
};

function decodeEntities(text) {
  return text.replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z0-9]+);/g, (match, code) => {
    if (code in HTML_ENTITIES) return HTML_ENTITIES[code];
    if (code.startsWith('#x')) return String.fromCodePoint(parseInt(code.slice(2), 16));
    if (code.startsWith('#')) return String.fromCodePoint(parseInt(code.slice(1), 10));
    return match;
  });
}

/**
 * Converts the small subset of HTML used in content_html/answer_html (paragraphs, bold,
 * italic, links, lists, headings, line breaks) to Markdown. Good enough for this site's
 * content, not a general-purpose HTML parser.
 */
export function htmlToMarkdown(html) {
  if (!html) return '';
  let text = html
    .replace(/<a\s+[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis, (_m, href, label) => `[${label}](${href})`)
    .replace(/<(strong|b)>(.*?)<\/\1>/gis, (_m, _tag, inner) => `**${inner}**`)
    .replace(/<(em|i)>(.*?)<\/\1>/gis, (_m, _tag, inner) => `*${inner}*`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>\s*<li>/gi, '</li>\n<li>')
    .replace(/<li>(.*?)<\/li>/gis, (_m, inner) => `- ${inner.trim()}\n`)
    .replace(/<\/?(ul|ol)>/gi, '\n')
    .replace(/<h([1-6])>(.*?)<\/h\1>/gis, (_m, level, inner) => `\n${'#'.repeat(Number(level))} ${inner}\n`)
    .replace(/<blockquote>(.*?)<\/blockquote>/gis, (_m, inner) => `> ${inner.trim()}\n`)
    .replace(/<\/p>\s*<p>/gi, '</p>\n\n<p>')
    .replace(/<\/?p>/gi, '')
    .replace(/<[^>]+>/g, '');
  text = decodeEntities(text);
  return text
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Mirrors the shape src/lib/content.ts's getFaqTopics()/getFaq() return. */
export function loadFaqTopics() {
  return loadJson('src/data/faq.json');
}

/** Mirrors the shape src/lib/content.ts's getMinutes() returns, including content_text
 * (which the app itself splits into a lazily-loaded chunk, but the build script can read
 * straight from disk). */
export function loadMinutes() {
  return loadJson('src/data/minutes.json');
}

export function faqMarkdownUrl(id) {
  return `${SITE_URL}/faq/${id}.md`;
}

export function newsMarkdownUrl(slug) {
  return `${SITE_URL}/news/${slug}.md`;
}

export function minutesMarkdownUrl(id) {
  return `${SITE_URL}/minutes/${id}.md`;
}

export function buildFaqMarkdown(topic, faq) {
  const lines = [`# ${faq.question}`, ''];
  if (topic?.name) lines.push(`Topic: ${topic.name}`, '');
  lines.push(htmlToMarkdown(faq.answer_html), '');
  if (faq.minutes_refs?.length) {
    lines.push('## Related minutes', '');
    for (const ref of faq.minutes_refs) {
      lines.push(`- ${minutesMarkdownUrl(ref)}`);
    }
    lines.push('');
  }
  lines.push(`Source: ${SITE_URL}/faq/${faq.id}`, '');
  return lines.join('\n');
}

export function buildNewsMarkdown(article) {
  const lines = [`# ${article.title}`, ''];
  if (article.published_at) lines.push(`Published: ${article.published_at.slice(0, 10)}`, '');
  if (article.summary) lines.push(article.summary, '');
  lines.push(htmlToMarkdown(article.content_html), '');
  lines.push(`Source: ${SITE_URL}/news/${article.slug}`, '');
  return lines.join('\n');
}

export function buildMinuteMarkdown(minute) {
  const lines = [`# ${minute.title}`, ''];
  lines.push(`Date: ${minute.meeting_date}`);
  lines.push(`Location: ${minute.location}`);
  lines.push(`PDF: ${minute.file_path}`, '');
  if (minute.content_text) lines.push(minute.content_text.trim(), '');
  lines.push(`Source: ${SITE_URL}/meetings/${minute.id}`, '');
  return lines.join('\n');
}

export function buildLlmsTxt({ articles, faqTopics, minutes }) {
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_SUMMARY}`,
    '',
    '## Key pages',
    '',
    `- [Home](${SITE_URL}/): overview of the FAB, its members and recent news.`,
    `- [About the FAB](${SITE_URL}/about-us): what the board is, how it works and who sits on it.`,
    `- [Minutes](${SITE_URL}/minutes): every published set of FAB meeting minutes.`,
    `- [Meetings](${SITE_URL}/meetings): upcoming and past FAB meetings.`,
    `- [News](${SITE_URL}/news): news and updates from the FAB.`,
    `- [FAQ](${SITE_URL}/faq): answers to common supporter questions, drawn from FAB meetings.`,
    `- [Submit](${SITE_URL}/submit): raise a question or idea with a FAB member.`,
    '',
    '## FAQ',
    '',
  ];

  for (const topic of faqTopics) {
    for (const faq of topic.questions) {
      lines.push(`- [${faq.question}](${faqMarkdownUrl(faq.id)}): ${topic.name}`);
    }
  }

  lines.push('', '## News', '');
  for (const article of articles) {
    const summary = article.summary ? `: ${article.summary}` : '';
    lines.push(`- [${article.title}](${newsMarkdownUrl(article.slug)})${summary}`);
  }

  lines.push('', '## Minutes', '');
  for (const minute of minutes) {
    lines.push(`- [${minute.title}](${minutesMarkdownUrl(minute.id)}): ${minute.location}`);
  }

  lines.push('', '## Full text', '', `- [llms-full.txt](${SITE_URL}/llms-full.txt): every FAQ answer and news article in full.`, '');

  return lines.join('\n');
}

export function buildLlmsFullTxt({ articles, faqTopics }) {
  const sections = [`${SITE_NAME}`, '', SITE_SUMMARY, '', '='.repeat(80), '', 'FAQ', ''];

  for (const topic of faqTopics) {
    for (const faq of topic.questions) {
      sections.push(`## ${faq.question}`, '', `(${topic.name} — ${SITE_URL}/faq/${faq.id})`, '');
      sections.push(htmlToMarkdown(faq.answer_html), '', '-'.repeat(40), '');
    }
  }

  sections.push('='.repeat(80), '', 'News', '');
  for (const article of articles) {
    sections.push(
      `## ${article.title}`,
      '',
      `(${article.published_at.slice(0, 10)} — ${SITE_URL}/news/${article.slug})`,
      '',
    );
    sections.push(htmlToMarkdown(article.content_html), '', '-'.repeat(40), '');
  }

  return sections.join('\n');
}

function ensureDir(path) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

async function main() {
  if (!existsSync(DIST)) {
    throw new Error(`dist/ not found at ${DIST} — run "vite build" before build-llms.mjs`);
  }

  const parseFrontMatter = await loadFrontMatterParser();
  const now = new Date();
  const articles = loadNewsArticles(parseFrontMatter, now);
  const faqTopics = loadFaqTopics();
  const minutes = loadMinutes();

  const faqDir = resolve(DIST, 'faq');
  const newsDir = resolve(DIST, 'news');
  const minutesDir = resolve(DIST, 'minutes');
  ensureDir(faqDir);
  ensureDir(newsDir);
  ensureDir(minutesDir);

  let faqCount = 0;
  for (const topic of faqTopics) {
    for (const faq of topic.questions) {
      writeFileSync(resolve(faqDir, `${faq.id}.md`), buildFaqMarkdown(topic, faq));
      faqCount += 1;
    }
  }

  for (const article of articles) {
    writeFileSync(resolve(newsDir, `${article.slug}.md`), buildNewsMarkdown(article));
  }

  for (const minute of minutes) {
    writeFileSync(resolve(minutesDir, `${minute.id}.md`), buildMinuteMarkdown(minute));
  }

  writeFileSync(resolve(DIST, 'llms.txt'), buildLlmsTxt({ articles, faqTopics, minutes }));
  writeFileSync(resolve(DIST, 'llms-full.txt'), buildLlmsFullTxt({ articles, faqTopics }));

  console.log(
    `build-llms: wrote dist/llms.txt, dist/llms-full.txt, ${faqCount} FAQ mirrors, ` +
      `${articles.length} news mirrors, ${minutes.length} minutes mirrors`,
  );
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
