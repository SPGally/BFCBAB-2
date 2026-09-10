// Static content layer. Everything here is read from JSON files committed to the repo,
// so the site has no runtime database dependency. To change content, edit the file and
// open a pull request.
import minutesData from '../data/minutes.json';
import meetingsData from '../data/meetings.json';

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
