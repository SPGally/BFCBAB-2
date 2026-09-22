import { describe, expect, it } from 'vitest';
import {
  buildEntry,
  parseClubLabel,
  parseDateText,
  parseHeader,
  titleForDate,
} from './sync-minutes.mjs';

// First-page text fixtures, one per header style currently seen across the club's PDFs.
const FIXTURES = {
  dateColonFormat: `Barnsley FC Fan Advisory Board —
Meeting Minutes
Date: Tuesday 8 September 2026
Format: Video call
Chair: Steve Brain
Attendees `,
  meetingHeld: `Barnsley FC Fan Advisory Board (FAB)
Meeting Minutes
Meeting held: Tuesday 4 August 2026, 6.15pm, South Stand Meeting Room, Oakwell Stadium
A note on this record `,
  meetingOf: `Barnsley FC Fan Advisory Board | Meeting of Tuesday 9 June 2026
Minutes | 9 June 2026 | Page 1 of 6
Barnsley FC Fan Advisory Board
Meeting Minutes, Tuesday 9 June 2026
Held online via Microsoft Teams.
1. Attendees `,
  dateColonLocation: `• FAB Meeting
• Date: 26 March 2026
• Location: Online (Teams)
• Attendees: Steve Brain, Jon Flatman `,
  dateOfMeeting: `1
Barnsley FC Fan Advisory Group Meeting Minutes
Date of Meeting Tuesday 25th November 2025
Location Microsoft Teams
Time 6:30 pm
Meeting Objective(s) `,
};

describe('parseDateText', () => {
  it('parses a full weekday + day + month + year', () => {
    expect(parseDateText('Tuesday 8 September 2026')).toBe('2026-09-08');
  });

  it('parses an ordinal day with an abbreviated month', () => {
    expect(parseDateText('17th Dec 2024')).toBe('2024-12-17');
  });

  it('parses a bare day + month + year', () => {
    expect(parseDateText('26 March 2026')).toBe('2026-03-26');
  });

  it('returns null when nothing matches', () => {
    expect(parseDateText('no date here')).toBeNull();
  });
});

describe('parseClubLabel', () => {
  it('parses the club site DD.MM.YY label', () => {
    expect(parseClubLabel('08.09.26')).toBe('2026-09-08');
  });

  it('returns null for an unrecognised label', () => {
    expect(parseClubLabel('Read here')).toBeNull();
    expect(parseClubLabel(undefined)).toBeNull();
  });
});

describe('parseHeader', () => {
  it('handles "Date:" with a "Format:" location (8 September 2026)', () => {
    expect(parseHeader(FIXTURES.dateColonFormat)).toEqual({
      date: '2026-09-08',
      location: 'Video call',
      style: 'date-colon',
    });
  });

  it('handles "Meeting held:" with date, time and location on one line (4 August 2026)', () => {
    expect(parseHeader(FIXTURES.meetingHeld)).toEqual({
      date: '2026-08-04',
      location: 'South Stand Meeting Room, Oakwell Stadium',
      style: 'meeting-held',
    });
  });

  it('handles "Meeting of" with a "Held online via" location (9 June 2026)', () => {
    expect(parseHeader(FIXTURES.meetingOf)).toEqual({
      date: '2026-06-09',
      location: 'Microsoft Teams',
      style: 'meeting-of',
    });
  });

  it('handles "Date:" with a "Location:" line (26 March 2026)', () => {
    expect(parseHeader(FIXTURES.dateColonLocation)).toEqual({
      date: '2026-03-26',
      location: 'Online (Teams)',
      style: 'date-colon',
    });
  });

  it('handles "Date of Meeting" with a "Location" line (25 November 2025)', () => {
    expect(parseHeader(FIXTURES.dateOfMeeting)).toEqual({
      date: '2025-11-25',
      location: 'Microsoft Teams',
      style: 'date-of-meeting',
    });
  });

  it('returns null when none of the header styles match', () => {
    expect(parseHeader('BFC FAB Meeting 12/02/26 \nMicrosoft Teams \n')).toBeNull();
  });

  it('returns null for empty text', () => {
    expect(parseHeader('')).toBeNull();
    expect(parseHeader(null)).toBeNull();
  });
});

describe('titleForDate', () => {
  it('formats an ISO date as the club minutes title', () => {
    expect(titleForDate('2026-09-08')).toBe('FAB Meeting Minutes - 8 September 2026');
  });
});

describe('buildEntry', () => {
  it('prefers the PDF header date over a differing club label', () => {
    // The club site once labelled this PDF 08.08.26; the PDF itself says 4 August 2026.
    const entry = buildEntry({
      href: 'https://images.gc.barnsleyfcservices.co.uk/example.pdf',
      clubLabel: '08.08.26',
      pdfText: FIXTURES.meetingHeld,
    });
    expect(entry?.id).toBe('2026-08-04');
    expect(entry?.meeting_date).toBe('2026-08-04');
    expect(entry?.location).toBe('South Stand Meeting Room, Oakwell Stadium');
    expect(entry?.club_label).toBe('08.08.26');
  });

  it('falls back to the club label when the header cannot be parsed', () => {
    const entry = buildEntry({
      href: 'https://images.gc.barnsleyfcservices.co.uk/example2.pdf',
      clubLabel: '12.02.26',
      pdfText: 'BFC FAB Meeting 12/02/26 \nMicrosoft Teams \n',
    });
    expect(entry?.id).toBe('2026-02-12');
    expect(entry?.location).toBe('Not recorded');
  });

  it('returns null when neither the header nor the club label yields a date', () => {
    const entry = buildEntry({
      href: 'https://images.gc.barnsleyfcservices.co.uk/example3.pdf',
      clubLabel: null,
      pdfText: 'no usable date anywhere in this text',
    });
    expect(entry).toBeNull();
  });
});
