// Builders for schema.org JSON-LD, embedded as <script type="application/ld+json">
// via react-helmet on each page. Content only — no runtime fetch, everything here is
// derived from src/lib/content.ts and src/data/*.json.
import type { Article, FaqQuestion, FaqTopic, Member, Minute, UpcomingMeeting } from './content';

export const SITE_URL = 'https://fab.barnsleyfc.co.uk';

export const ORGANIZATION_NAME = 'Barnsley FC Fan Advisory Board';

/** Strip HTML tags and collapse whitespace, for schema.org text fields that want plain text. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

// ---------- Organization (site-wide) ----------

export interface OrganizationJsonLd {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  sameAs: string[];
  contactPoint: {
    '@type': 'ContactPoint';
    email: string;
    contactType: string;
  };
}

export function buildOrganizationJsonLd(): OrganizationJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ORGANIZATION_NAME,
    url: SITE_URL,
    logo: 'https://images.gc.barnsleyfcservices.co.uk/fit-in/170x170/3b17caf0-1393-11ef-9954-698e48ed286c.png',
    sameAs: [
      'https://www.barnsleyfc.co.uk/fans/fan-advisory-board',
      'https://x.com/BarnsleyFC',
      'https://www.facebook.com/officialbarnsleyfc',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'FAB@barnsleyfc.co.uk',
      contactType: 'customer support',
    },
  };
}

// ---------- FAQ ----------

function questionJsonLd(faq: FaqQuestion) {
  return {
    '@type': 'Question' as const,
    name: faq.question,
    url: absoluteUrl(`/faq/${faq.id}`),
    acceptedAnswer: {
      '@type': 'Answer' as const,
      text: stripHtml(faq.answer_html),
    },
  };
}

export interface FaqPageJsonLd {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: ReturnType<typeof questionJsonLd>[];
}

/** One FAQPage covering every published question, for the /faq index. */
export function buildFaqPageJsonLd(topics: FaqTopic[]): FaqPageJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: topics.flatMap((topic) => topic.questions.map((faq) => questionJsonLd(faq))),
  };
}

export interface FaqQuestionJsonLd {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: [ReturnType<typeof questionJsonLd> & { dateModified?: string }];
}

/** A single question/answer, for a /faq/<id> detail page. */
export function buildFaqQuestionJsonLd(faq: FaqQuestion, dateModified?: string | null): FaqQuestionJsonLd {
  const question = questionJsonLd(faq);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [dateModified ? { ...question, dateModified } : question],
  };
}

// ---------- News ----------

export interface NewsArticleJsonLd {
  '@context': 'https://schema.org';
  '@type': 'NewsArticle';
  headline: string;
  datePublished: string;
  description: string;
  url: string;
  author?: { '@type': 'Person'; name: string; jobTitle: string };
  image?: string;
  publisher: {
    '@type': 'Organization';
    name: string;
    logo: { '@type': 'ImageObject'; url: string };
  };
}

export function buildNewsArticleJsonLd(article: Article, authorMember: Member | null): NewsArticleJsonLd {
  const jsonld: NewsArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    datePublished: article.published_at,
    description: article.summary || stripHtml(article.content_html).slice(0, 200),
    url: absoluteUrl(`/news/${article.slug}`),
    publisher: {
      '@type': 'Organization',
      name: ORGANIZATION_NAME,
      logo: {
        '@type': 'ImageObject',
        url: 'https://images.gc.barnsleyfcservices.co.uk/fit-in/170x170/3b17caf0-1393-11ef-9954-698e48ed286c.png',
      },
    },
  };
  if (authorMember) {
    jsonld.author = { '@type': 'Person', name: authorMember.name, jobTitle: authorMember.role };
  }
  if (article.image) {
    jsonld.image = absoluteUrl(article.image);
  }
  return jsonld;
}

// ---------- Meetings ----------

export interface EventJsonLd {
  '@context': 'https://schema.org';
  '@type': 'Event';
  name: string;
  startDate: string;
  eventAttendanceMode: string;
  eventStatus: string;
  location: { '@type': 'VirtualLocation' | 'Place'; name: string; url?: string } | { '@type': 'Place'; name: string };
  organizer: { '@type': 'Organization'; name: string; url: string };
  description?: string;
}

function isVirtualLocation(location: string): boolean {
  return /teams|online|video call|virtual|zoom/i.test(location);
}

function eventJsonLd(
  title: string,
  startDate: string,
  location: string,
  description?: string | null
): EventJsonLd {
  const virtual = isVirtualLocation(location);
  const jsonld: EventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    startDate,
    eventAttendanceMode: virtual
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: virtual
      ? { '@type': 'VirtualLocation', name: location, url: SITE_URL }
      : { '@type': 'Place', name: location },
    organizer: { '@type': 'Organization', name: ORGANIZATION_NAME, url: SITE_URL },
  };
  if (description) jsonld.description = description;
  return jsonld;
}

/** An upcoming meeting, before it has minutes. */
export function buildUpcomingMeetingEventJsonLd(meeting: UpcomingMeeting): EventJsonLd {
  return eventJsonLd(meeting.title, meeting.date, meeting.location, meeting.description);
}

/** A past meeting, once its minutes are published. */
export function buildPastMeetingEventJsonLd(minute: Minute): EventJsonLd {
  return eventJsonLd(minute.title, minute.meeting_date, minute.location);
}

// ---------- Minutes ----------

export interface DigitalDocumentJsonLd {
  '@context': 'https://schema.org';
  '@type': 'DigitalDocument';
  name: string;
  url: string;
  datePublished: string;
}

export function buildMinuteDocumentJsonLd(minute: Minute): DigitalDocumentJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    name: minute.title,
    url: minute.file_path,
    datePublished: minute.meeting_date,
  };
}

export interface MinutesListJsonLd {
  '@context': 'https://schema.org';
  '@type': 'CollectionPage';
  name: string;
  url: string;
  hasPart: DigitalDocumentJsonLd[];
}

/** A CollectionPage of DigitalDocuments, for the /minutes index. */
export function buildMinutesListJsonLd(minutes: Minute[]): MinutesListJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Meeting Minutes',
    url: absoluteUrl('/minutes'),
    hasPart: minutes.map(buildMinuteDocumentJsonLd),
  };
}

// ---------- Breadcrumbs ----------

export interface BreadcrumbListJsonLd {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: { '@type': 'ListItem'; position: number; name: string; item: string }[];
}

export function buildBreadcrumbListJsonLd(items: { name: string; path: string }[]): BreadcrumbListJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
