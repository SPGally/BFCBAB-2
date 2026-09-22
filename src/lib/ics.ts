// Builds a minimal RFC 5545 .ics file for a single event, entirely in the browser.
// No network call and no server: the file is generated from data already on the page.

export interface IcsEvent {
  /** Stable identifier for the event, used to build the UID. */
  id: string;
  title: string;
  /** ISO date-time with offset, e.g. "2026-10-06T18:30:00+01:00". */
  date: string;
  location?: string | null;
  description?: string | null;
  /** Event duration in minutes. Defaults to 60. */
  durationMinutes?: number;
}

/** Formats a Date as a UTC "basic" ICS date-time, e.g. "20261006T173000Z". */
function toIcsUtc(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
}

/** Escapes text per RFC 5545 §3.3.11 (commas, semicolons, backslashes, newlines). */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/** Folds a content line at 75 octets as required by RFC 5545 §3.1. */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = ' ' + rest.slice(75);
  }
  parts.push(rest);
  return parts.join('\r\n');
}

/** Builds the text of an .ics (iCalendar) file for one event. DTSTART is always UTC. */
export function buildIcsEvent(event: IcsEvent): string {
  const start = new Date(event.date);
  const durationMs = (event.durationMinutes ?? 60) * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);
  const stamp = toIcsUtc(new Date());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Barnsley FC Fan Advisory Board//FAB Website//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}@fab.barnsleyfc.co.uk`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ];

  if (event.location) {
    lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  }
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.map(foldLine).join('\r\n') + '\r\n';
}

/** Triggers a browser download of the given event as an .ics file. */
export function downloadIcsEvent(event: IcsEvent, filename = `${event.id}.ics`): void {
  const contents = buildIcsEvent(event);
  const blob = new Blob([contents], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
