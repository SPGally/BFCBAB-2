// @vitest-environment node
// transformWithEsbuild (used by build-feeds.mjs to load the shared TS front-matter parser)
// relies on Node's real TextEncoder/Uint8Array, which jsdom's environment patches over;
// run this suite under the plain node environment rather than the project's jsdom default.
import { describe, expect, it } from 'vitest';
import { getFaqTopics, getNews, getUpcomingMeetings } from '../src/lib/content';
import { parseFrontMatter } from '../src/lib/frontmatter';
import { SITE_URL, buildRss, buildSitemap, loadNewsArticles } from './build-feeds.mjs';

/** Minimal well-formedness check: every opening tag is matched by a closing tag, in order. */
function assertWellFormedXml(xml: string) {
  expect(xml.startsWith('<?xml')).toBe(true);
  const stack: string[] = [];
  const tagPattern = /<(\/?)([a-zA-Z][\w:-]*)\b[^>]*?(\/?)>/g;
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(xml))) {
    const [, closing, name, selfClosing] = match;
    if (selfClosing) continue;
    if (closing) {
      expect(stack.pop()).toBe(name);
    } else {
      stack.push(name);
    }
  }
  expect(stack).toEqual([]);
}

function countTag(xml: string, name: string): number {
  return (xml.match(new RegExp(`<${name}[ >]`, 'g')) ?? []).length;
}

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
}

describe('loadNewsArticles', () => {
  it('matches the count and slugs getNews() returns', () => {
    const now = new Date('2100-01-01T00:00:00Z');
    const fromContent = getNews(now);
    const fromScript = loadNewsArticles(parseFrontMatter, now);
    expect(fromScript.length).toBe(fromContent.length);
    expect(fromScript.map((a) => a.slug).sort()).toEqual(fromContent.map((a) => a.slug).sort());
  });
});

describe('buildRss', () => {
  const now = new Date('2100-01-01T00:00:00Z');
  const articles = loadNewsArticles(parseFrontMatter, now);
  const xml = buildRss(articles);

  it('parses as well-formed XML', () => {
    assertWellFormedXml(xml);
  });

  it('caps items at 20, uses absolute URLs, and no more than getNews() has', () => {
    const itemCount = countTag(xml, 'item');
    expect(itemCount).toBeLessThanOrEqual(20);
    expect(itemCount).toBeLessThanOrEqual(getNews(now).length);
    expect(itemCount).toBeGreaterThan(0);
    const itemLinks = [...xml.matchAll(/<item>[\s\S]*?<\/item>/g)].map(
      (m) => m[0].match(/<link>(.*?)<\/link>/)?.[1],
    );
    expect(itemLinks.length).toBe(itemCount);
    for (const link of itemLinks) {
      expect(link).toMatch(new RegExp(`^${SITE_URL}/news/`));
    }
  });
});

describe('buildSitemap', () => {
  const now = new Date('2100-01-01T00:00:00Z');
  const articles = loadNewsArticles(parseFrontMatter, now);
  const faqTopics = getFaqTopics();
  const upcomingMeetings = getUpcomingMeetings(new Date('2000-01-01T00:00:00Z'));
  const xml = buildSitemap({ articles, faqTopics, upcomingMeetings, now });

  it('parses as well-formed XML', () => {
    assertWellFormedXml(xml);
  });

  it('has one <url> per article, per FAQ question, per future meeting, plus static pages, all absolute', () => {
    const allLocs = locs(xml);
    for (const loc of allLocs) {
      expect(loc).toMatch(new RegExp(`^${SITE_URL}/`));
    }

    const questionCount = faqTopics.reduce((n, t) => n + t.questions.length, 0);
    const futureMeetingCount = getUpcomingMeetings(now).length;

    const newsLocs = allLocs.filter((l) => l.includes('/news/'));
    const faqLocs = allLocs.filter((l) => l.includes('/faq/'));
    const meetingLocs = allLocs.filter((l) => l.includes('/meetings/'));

    expect(newsLocs.length).toBe(articles.length);
    expect(faqLocs.length).toBe(questionCount);
    expect(meetingLocs.length).toBe(futureMeetingCount);
    // Static pages: home, about-us, minutes, meetings, news, faq, submit, visual-history.
    expect(allLocs.length - newsLocs.length - faqLocs.length - meetingLocs.length).toBe(8);
  });
});
