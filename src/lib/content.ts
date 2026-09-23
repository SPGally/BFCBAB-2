// Static content layer. Everything here is read from files committed to the repo
// (src/data/*.json and src/content/news/*.md), so the site has no runtime database.
// To change content, edit the file and open a pull request; Netlify redeploys on merge.
import minutesData from '../data/minutes.json';
import meetingsData from '../data/meetings.json';
import membersData from '../data/members.json';
import faqData from '../data/faq.json';
import { parseFrontMatter } from './frontmatter';

// ---------- Minutes and meetings ----------

export interface Minute {
  /** ISO date of the meeting, also used as the URL id (e.g. "2026-08-04"). */
  id: string;
  title: string;
  meeting_date: string;
  location: string;
  /** Public PDF URL. Currently hot-linked from the club CDN. */
  file_path: string;
  /** The label the club website shows for this document. */
  club_label?: string;
  /** Optional HTML agenda for the meeting. */
  agenda_html?: string | null;
  /** Plain text extracted from the PDF, used for search. */
  content_text: string | null;
}

export interface UpcomingMeeting {
  /** Stable slug, e.g. "2026-10-06". */
  id: string;
  title: string;
  /** ISO date-time with offset, e.g. "2026-10-06T18:30:00+01:00". */
  date: string;
  location: string;
  description?: string | null;
  /** Optional HTML agenda. */
  agenda_html?: string | null;
}

const minutes: Minute[] = (minutesData as Minute[])
  .slice()
  .sort((a, b) => b.meeting_date.localeCompare(a.meeting_date));

const upcoming: UpcomingMeeting[] = (meetingsData as UpcomingMeeting[])
  .slice()
  .sort((a, b) => a.date.localeCompare(b.date));

export function getMinutes(): Minute[] {
  return minutes;
}

export function getMinute(id: string): Minute | undefined {
  return minutes.find((m) => m.id === id);
}

export function getUpcomingMeetings(now: Date = new Date()): UpcomingMeeting[] {
  return upcoming.filter((m) => new Date(m.date) >= now);
}

export function getUpcomingMeeting(id: string): UpcomingMeeting | undefined {
  return upcoming.find((m) => m.id === id);
}

/** Past meetings are derived from the published minutes: one meeting per set of minutes. */
export function getPastMeetings(): Minute[] {
  return minutes;
}

export const CLUB_MINUTES_URL =
  'https://www.barnsleyfc.co.uk/fans/fan-advisory-board/fab-meeting-minutes';

// ---------- Board members ----------

export interface Member {
  /** Slug, e.g. "steve-brain". Referenced by news `author` and used in the Submit form. */
  id: string;
  name: string;
  role: string;
  email: string | null;
  bio: string;
  /** Path under /public, e.g. "/images/members/steve-brain.jpg". */
  image: string | null;
  order: number;
  vacant: boolean;
}

const members: Member[] = (membersData as Member[]).slice().sort((a, b) => a.order - b.order);

export function getMembers(): Member[] {
  return members;
}

export function getMember(id: string): Member | undefined {
  return members.find((m) => m.id === id);
}

// ---------- FAQ ----------

export interface FaqQuestion {
  id: string;
  question: string;
  answer_html: string;
  raised_by: string[];
  /** Minute ids (ISO dates) this answer draws on. */
  minutes_refs: string[];
  /** Member id of whoever answered, if known. */
  author?: string | null;
}

export interface FaqTopic {
  id: string;
  name: string;
  description: string | null;
  questions: FaqQuestion[];
}

const faqTopics: FaqTopic[] = faqData as FaqTopic[];

export function getFaqTopics(): FaqTopic[] {
  return faqTopics;
}

export function getFaq(id: string): { topic: FaqTopic; faq: FaqQuestion } | undefined {
  for (const topic of faqTopics) {
    const faq = topic.questions.find((q) => q.id === id);
    if (faq) return { topic, faq };
  }
  return undefined;
}

// ---------- News ----------

export interface Article {
  slug: string;
  title: string;
  /** ISO date-time, set once when the article is published. */
  published_at: string;
  summary: string;
  /** Member id of the author, or null. */
  author: string | null;
  authorMember: Member | null;
  /** Path under /public, or null. */
  image: string | null;
  pinned: boolean;
  draft: boolean;
  /** UUID from the old database, so old /news/<uuid> links still resolve. */
  legacy_id: string | null;
  /** Article body as HTML. */
  content_html: string;
}

// Re-exported so existing imports (and tests) that pull parseFrontMatter from here keep
// working; the implementation lives in ./frontmatter so the Node build script can reuse it.
export { parseFrontMatter } from './frontmatter';

const newsFiles = import.meta.glob('../content/news/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const articles: Article[] = Object.entries(newsFiles)
  .map(([path, raw]) => {
    const { data, body } = parseFrontMatter(raw);
    const fileSlug = path.split('/').pop()!.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
    const author = (data.author as string | null) ?? null;
    return {
      slug: (data.slug as string) || fileSlug,
      title: (data.title as string) || fileSlug,
      published_at: (data.published_at as string) || '',
      summary: (data.summary as string) || '',
      author,
      authorMember: author ? getMember(author) ?? null : null,
      image: (data.image as string | null) ?? null,
      pinned: Boolean(data.pinned),
      draft: Boolean(data.draft),
      legacy_id: (data.legacy_id as string | null) ?? null,
      content_html: body.trim(),
    };
  })
  .sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.published_at.localeCompare(a.published_at);
  });

/** Published articles, pinned first then newest, excluding drafts and future dates. */
export function getNews(now: Date = new Date()): Article[] {
  const nowIso = now.toISOString();
  return articles.filter((a) => !a.draft && a.published_at && a.published_at <= nowIso);
}

/** Look an article up by slug, or by the old database UUID. */
export function getArticle(slugOrId: string): Article | undefined {
  return getNews().find((a) => a.slug === slugOrId || a.legacy_id === slugOrId);
}
