import { describe, expect, it } from 'vitest';
import {
  getArticle,
  getFaq,
  getMinute,
  getMinutes,
  getNews,
  getUpcomingMeetings,
  parseFrontMatter,
} from './content';

describe('parseFrontMatter', () => {
  it('parses JSON string values, unescaping quotes', () => {
    const { data, body } = parseFrontMatter(
      '---\ntitle: "Say \\"hello\\""\n---\n<p>Body</p>'
    );
    expect(data.title).toBe('Say "hello"');
    expect(body).toBe('<p>Body</p>');
  });

  it('parses booleans', () => {
    const { data } = parseFrontMatter('---\npinned: true\ndraft: false\n---\nBody');
    expect(data.pinned).toBe(true);
    expect(data.draft).toBe(false);
  });

  it('parses null and empty values as null', () => {
    const { data } = parseFrontMatter('---\nauthor: null\nimage:\n---\nBody');
    expect(data.author).toBeNull();
    expect(data.image).toBeNull();
  });

  it('parses bare tokens as strings', () => {
    const { data } = parseFrontMatter('---\nslug: welcome-the-fab\n---\nBody');
    expect(data.slug).toBe('welcome-the-fab');
  });

  it('returns empty data and the raw body when there is no front matter block', () => {
    const { data, body } = parseFrontMatter('<p>No front matter here</p>');
    expect(data).toEqual({});
    expect(body).toBe('<p>No front matter here</p>');
  });
});

describe('getMinutes', () => {
  it('sorts newest first', () => {
    const minutes = getMinutes();
    const dates = minutes.map((m) => m.meeting_date);
    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    expect(dates).toEqual(sorted);
  });
});

describe('getMinute', () => {
  it('finds a minute by id', () => {
    const minute = getMinute('2026-08-04');
    expect(minute).toBeDefined();
    expect(minute?.meeting_date).toBe('2026-08-04');
  });

  it('returns undefined for an unknown id', () => {
    expect(getMinute('not-a-real-id')).toBeUndefined();
  });
});

describe('getUpcomingMeetings', () => {
  it('filters out meetings before the given time', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const all = getUpcomingMeetings(new Date('2000-01-01T00:00:00Z'));
    const upcoming = getUpcomingMeetings(now);
    expect(upcoming.length).toBeLessThanOrEqual(all.length);
    for (const meeting of upcoming) {
      expect(new Date(meeting.date).getTime()).toBeGreaterThanOrEqual(now.getTime());
    }
  });
});

describe('getNews', () => {
  it('puts pinned articles first', () => {
    const news = getNews(new Date('2100-01-01T00:00:00Z'));
    const firstUnpinnedIndex = news.findIndex((a) => !a.pinned);
    if (firstUnpinnedIndex >= 0) {
      for (let i = 0; i < firstUnpinnedIndex; i++) {
        expect(news[i].pinned).toBe(true);
      }
    }
  });

  it('excludes draft articles', () => {
    const news = getNews(new Date('2100-01-01T00:00:00Z'));
    expect(news.some((a) => a.draft)).toBe(false);
  });

  it('excludes articles published after the given time', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const news = getNews(now);
    const nowIso = now.toISOString();
    for (const article of news) {
      expect(article.published_at <= nowIso).toBe(true);
    }
    const future = getNews(new Date('2100-01-01T00:00:00Z'));
    expect(future.length).toBeGreaterThanOrEqual(news.length);
  });

  it('sorts non-pinned articles newest first', () => {
    const news = getNews(new Date('2100-01-01T00:00:00Z')).filter((a) => !a.pinned);
    const dates = news.map((a) => a.published_at);
    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    expect(dates).toEqual(sorted);
  });
});

describe('getArticle', () => {
  it('resolves an article by slug', () => {
    const news = getNews(new Date('2100-01-01T00:00:00Z'));
    const target = news[0];
    expect(getArticle(target.slug)).toEqual(target);
  });

  it('resolves an article by legacy_id', () => {
    const news = getNews(new Date('2100-01-01T00:00:00Z'));
    const withLegacyId = news.find((a) => a.legacy_id);
    if (withLegacyId) {
      expect(getArticle(withLegacyId.legacy_id!)?.slug).toBe(withLegacyId.slug);
    }
  });

  it('returns undefined for an unknown slug', () => {
    expect(getArticle('not-a-real-slug')).toBeUndefined();
  });
});

describe('getFaq', () => {
  it('resolves minutes_refs to minutes', () => {
    const result = getFaq('what-is-the-fan-advisory-board');
    expect(result).toBeDefined();
    expect(result?.faq.minutes_refs.length).toBeGreaterThan(0);
    for (const ref of result?.faq.minutes_refs ?? []) {
      expect(getMinute(ref)).toBeDefined();
    }
  });

  it('returns the topic the question belongs to', () => {
    const result = getFaq('what-is-the-fan-advisory-board');
    expect(result?.topic.id).toBe('fan-engagement');
    expect(result?.topic.questions).toContainEqual(result?.faq);
  });

  it('returns undefined for an unknown id', () => {
    expect(getFaq('not-a-real-question')).toBeUndefined();
  });
});
