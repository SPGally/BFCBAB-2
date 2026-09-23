// @vitest-environment node
// See scripts/build-feeds.test.ts for why this runs under the plain node environment.
import { describe, expect, it } from 'vitest';
import { getFaqTopics, getNews, getMinutes } from '../src/lib/content';
import { parseFrontMatter } from '../src/lib/frontmatter';
import { SITE_URL, loadNewsArticles } from './build-feeds.mjs';
import {
  buildFaqMarkdown,
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildMinuteMarkdown,
  buildNewsMarkdown,
  faqMarkdownUrl,
  htmlToMarkdown,
  loadFaqTopics,
  loadMinutes,
  minutesMarkdownUrl,
  newsMarkdownUrl,
} from './build-llms.mjs';

const now = new Date('2100-01-01T00:00:00Z');
const articles = loadNewsArticles(parseFrontMatter, now);
const faqTopics = loadFaqTopics();
const minutes = loadMinutes();

function allAbsolute(urls: string[]) {
  for (const url of urls) {
    expect(url.startsWith('http')).toBe(true);
  }
}

describe('loadFaqTopics / loadMinutes', () => {
  it('match the shape and counts getFaqTopics()/getMinutes() return', () => {
    const fromContent = getFaqTopics();
    expect(faqTopics.length).toBe(fromContent.length);
    const flatten = (topics: { questions: { id: string }[] }[]) =>
      topics.flatMap((t) => t.questions.map((q) => q.id)).sort();
    expect(flatten(faqTopics)).toEqual(flatten(fromContent));

    const fromContentMinutes = getMinutes();
    expect(minutes.length).toBe(fromContentMinutes.length);
    expect(minutes.map((m: { id: string }) => m.id).sort()).toEqual(
      fromContentMinutes.map((m) => m.id).sort(),
    );
  });
});

describe('htmlToMarkdown', () => {
  it('converts paragraphs, bold, italic and links', () => {
    const html = '<p>Hello <strong>world</strong> and <em>friends</em>.</p><p>See <a href="https://example.com">this</a>.</p>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('**world**');
    expect(md).toContain('*friends*');
    expect(md).toContain('[this](https://example.com)');
    expect(md).not.toContain('<p>');
  });

  it('decodes HTML entities', () => {
    expect(htmlToMarkdown('<p>Rock &amp; roll&nbsp;&mdash; fans&#39; choice</p>')).toContain(
      "Rock & roll",
    );
  });
});

describe('every FAQ entry and article has a mirror', () => {
  it('buildFaqMarkdown covers every FAQ, with an absolute source URL', () => {
    for (const topic of faqTopics) {
      for (const faq of topic.questions) {
        const md = buildFaqMarkdown(topic, faq);
        expect(md).toContain(faq.question);
        expect(md).toContain(`Source: ${SITE_URL}/faq/${faq.id}`);
      }
    }
  });

  it('buildNewsMarkdown covers every published article', () => {
    expect(articles.length).toBe(getNews(now).length);
    for (const article of articles) {
      const md = buildNewsMarkdown(article);
      expect(md).toContain(article.title);
      expect(md).toContain(`Source: ${SITE_URL}/news/${article.slug}`);
    }
  });

  it('buildMinuteMarkdown covers every set of minutes', () => {
    for (const minute of minutes) {
      const md = buildMinuteMarkdown(minute);
      expect(md).toContain(minute.title);
      expect(md).toContain(minute.file_path);
      expect(md).toContain(`Source: ${SITE_URL}/meetings/${minute.id}`);
    }
  });
});

describe('buildLlmsTxt', () => {
  const txt = buildLlmsTxt({ articles, faqTopics, minutes });

  it('lists every FAQ, article and minute mirror with absolute URLs', () => {
    const faqUrls = faqTopics.flatMap((t) => t.questions.map((q) => faqMarkdownUrl(q.id)));
    const newsUrls = articles.map((a) => newsMarkdownUrl(a.slug));
    const minuteUrls = minutes.map((m) => minutesMarkdownUrl(m.id));

    for (const url of [...faqUrls, ...newsUrls, ...minuteUrls]) {
      expect(txt).toContain(url);
    }

    const linkTargets = [...txt.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
    allAbsolute(linkTargets);
  });

  it('has no relative URLs anywhere', () => {
    expect(txt).not.toMatch(/\]\(\//);
    expect(txt).not.toMatch(/href="\//);
  });
});

describe('buildLlmsFullTxt', () => {
  const txt = buildLlmsFullTxt({ articles, faqTopics });

  it('includes every FAQ question and article title in full', () => {
    for (const topic of faqTopics) {
      for (const faq of topic.questions) {
        expect(txt).toContain(faq.question);
      }
    }
    for (const article of articles) {
      expect(txt).toContain(article.title);
    }
  });
});
