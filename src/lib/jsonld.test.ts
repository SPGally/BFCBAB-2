import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildBreadcrumbListJsonLd,
  buildFaqPageJsonLd,
  buildFaqQuestionJsonLd,
  buildMinuteDocumentJsonLd,
  buildMinutesListJsonLd,
  buildNewsArticleJsonLd,
  buildOrganizationJsonLd,
  buildPastMeetingEventJsonLd,
  buildUpcomingMeetingEventJsonLd,
  stripHtml,
  SITE_URL,
} from './jsonld';
import { getArticle, getFaq, getFaqTopics, getMinute, getMinutes, getNews, getUpcomingMeetings } from './content';

describe('stripHtml', () => {
  it('removes tags and collapses whitespace', () => {
    expect(stripHtml('<p>Hello   <strong>world</strong></p>\n<p>Again</p>')).toBe('Hello world Again');
  });
});

describe('buildOrganizationJsonLd', () => {
  it('produces a valid Organization with a contact point', () => {
    const org = buildOrganizationJsonLd();
    expect(org['@type']).toBe('Organization');
    expect(org.name).toBe('Barnsley FC Fan Advisory Board');
    expect(org.url).toBe(SITE_URL);
    expect(org.contactPoint.email).toBe('FAB@barnsleyfc.co.uk');
    expect(org.sameAs.length).toBeGreaterThan(0);
  });

  it('matches the Organization JSON-LD embedded in index.html', () => {
    const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');
    const match = indexHtml.match(
      /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/
    );
    expect(match).not.toBeNull();
    const embedded = JSON.parse(match![1]);
    expect(embedded).toEqual(buildOrganizationJsonLd());
  });
});

describe('buildFaqPageJsonLd', () => {
  it('includes one Question per published FAQ entry', () => {
    const topics = getFaqTopics();
    const totalQuestions = topics.reduce((sum, t) => sum + t.questions.length, 0);
    const jsonld = buildFaqPageJsonLd(topics);
    expect(jsonld['@type']).toBe('FAQPage');
    expect(jsonld.mainEntity).toHaveLength(totalQuestions);
    for (const question of jsonld.mainEntity) {
      expect(question['@type']).toBe('Question');
      expect(question.name).toBeTruthy();
      expect(question.acceptedAnswer['@type']).toBe('Answer');
      expect(question.acceptedAnswer.text).toBeTruthy();
      // Answer text has no HTML left in it.
      expect(question.acceptedAnswer.text).not.toMatch(/<[^>]+>/);
      expect(question.url.startsWith(SITE_URL)).toBe(true);
    }
  });
});

describe('buildFaqQuestionJsonLd', () => {
  it('produces a single-entry FAQPage for one question', () => {
    const found = getFaq('what-is-the-fan-advisory-board');
    expect(found).toBeDefined();
    const jsonld = buildFaqQuestionJsonLd(found!.faq);
    expect(jsonld.mainEntity).toHaveLength(1);
    expect(jsonld.mainEntity[0].name).toBe(found!.faq.question);
  });

  it('includes dateModified when given one', () => {
    const found = getFaq('what-is-the-fan-advisory-board')!;
    const jsonld = buildFaqQuestionJsonLd(found.faq, '2026-01-01');
    expect(jsonld.mainEntity[0].dateModified).toBe('2026-01-01');
  });
});

describe('buildNewsArticleJsonLd', () => {
  it('produces a NewsArticle with headline, datePublished and publisher', () => {
    const article = getNews(new Date('2100-01-01T00:00:00Z'))[0];
    expect(article).toBeDefined();
    const jsonld = buildNewsArticleJsonLd(article, article.authorMember);
    expect(jsonld['@type']).toBe('NewsArticle');
    expect(jsonld.headline).toBe(article.title);
    expect(jsonld.datePublished).toBe(article.published_at);
    expect(jsonld.publisher.name).toBe('Barnsley FC Fan Advisory Board');
    expect(jsonld.url).toBe(`${SITE_URL}/news/${article.slug}`);
    if (article.authorMember) {
      expect(jsonld.author?.name).toBe(article.authorMember.name);
    }
  });

  it('resolves via getArticle for a real slug', () => {
    const article = getNews(new Date('2100-01-01T00:00:00Z'))[0];
    const resolved = getArticle(article.slug);
    expect(resolved).toBeDefined();
    const jsonld = buildNewsArticleJsonLd(resolved!, resolved!.authorMember);
    expect(jsonld.headline).toBe(resolved!.title);
  });
});

describe('meeting Event builders', () => {
  it('builds an Event for an upcoming meeting with a VirtualLocation when online', () => {
    const meeting = getUpcomingMeetings(new Date('2000-01-01T00:00:00Z'))[0];
    expect(meeting).toBeDefined();
    const jsonld = buildUpcomingMeetingEventJsonLd(meeting);
    expect(jsonld['@type']).toBe('Event');
    expect(jsonld.startDate).toBe(meeting.date);
    expect(jsonld.organizer.name).toBe('Barnsley FC Fan Advisory Board');
    if (/teams|online|video call/i.test(meeting.location)) {
      expect(jsonld.location['@type']).toBe('VirtualLocation');
      // No real Teams/Zoom join link exists in the meeting data, so VirtualLocation
      // must not advertise the site homepage (or anything else) as one.
      expect('url' in jsonld.location ? jsonld.location.url : undefined).toBeUndefined();
    }
  });

  it('builds an Event for a past meeting from its minutes', () => {
    const minutes = getMinutes();
    expect(minutes.length).toBeGreaterThan(0);
    const jsonld = buildPastMeetingEventJsonLd(minutes[0]);
    expect(jsonld['@type']).toBe('Event');
    expect(jsonld.startDate).toBe(minutes[0].meeting_date);
  });
});

describe('minutes DigitalDocument builders', () => {
  it('builds a DigitalDocument with the PDF url and datePublished', () => {
    const minute = getMinute(getMinutes()[0].id);
    expect(minute).toBeDefined();
    const jsonld = buildMinuteDocumentJsonLd(minute!);
    expect(jsonld['@type']).toBe('DigitalDocument');
    expect(jsonld.url).toBe(minute!.file_path);
    expect(jsonld.datePublished).toBe(minute!.meeting_date);
  });

  it('builds a CollectionPage listing every set of minutes', () => {
    const minutes = getMinutes();
    const jsonld = buildMinutesListJsonLd(minutes);
    expect(jsonld['@type']).toBe('CollectionPage');
    expect(jsonld.hasPart).toHaveLength(minutes.length);
  });
});

describe('buildBreadcrumbListJsonLd', () => {
  it('numbers positions from 1 and resolves absolute urls', () => {
    const jsonld = buildBreadcrumbListJsonLd([
      { name: 'FAQ', path: '/faq' },
      { name: 'A question', path: '/faq/a-question' },
    ]);
    expect(jsonld['@type']).toBe('BreadcrumbList');
    expect(jsonld.itemListElement[0].position).toBe(1);
    expect(jsonld.itemListElement[1].position).toBe(2);
    expect(jsonld.itemListElement[1].item).toBe(`${SITE_URL}/faq/a-question`);
  });
});
