# Content guide

All content is files in this repo, read through `src/lib/content.ts`. There is no
database and no admin UI: every content change is a pull request, and Netlify redeploys
when it merges.

This guide is being filled in as content-shaped issues land (FAB-005 owns the full guide).
Today it documents `src/data/meetings.json`; other files will get sections as their issues
touch them.

## `src/data/meetings.json` — upcoming meetings

An array of upcoming (not yet held) Fan Advisory Board meetings. `getUpcomingMeetings()`
in `src/lib/content.ts` filters this list to meetings whose `date` is in the future and
feeds the Home and Meetings pages; `getUpcomingMeeting(id)` looks one up by `id` for
`MeetingDetails`.

Once a meeting has happened, remove it from `meetings.json` and add its minutes to
`src/data/minutes.json` instead.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable slug, also the URL id (e.g. `"2026-10-29"`). Used as the ICS `UID` prefix for "Add to calendar", so keep it stable once published. |
| `title` | string | Shown as the page heading and calendar event title. |
| `date` | string | ISO 8601 date-time **with a UTC offset**, e.g. `"2026-10-29T18:00:00+00:00"`. The offset matters: the "Add to calendar" `.ics` file is built from this value and always exports `DTSTART`/`DTEND` in UTC, so an incorrect offset produces an event at the wrong time in the supporter's calendar app. |
| `location` | string | Free text, e.g. `"Online via Microsoft Teams"`. Included in the `.ics` file's `LOCATION`. |
| `description` | string \| null | Optional. Shown under "Overview" and included in the `.ics` file's `DESCRIPTION`. |
| `agenda_html` | string \| null | Optional pre-rendered HTML agenda, shown under "Agenda". |

### Add to calendar

`MeetingDetails` offers an "Add to calendar" button for upcoming meetings, built by
`src/lib/ics.ts` (`buildIcsEvent` / `downloadIcsEvent`). It generates a minimal RFC 5545
`.ics` file entirely in the browser — no server, no third-party calendar API — defaulting
the event duration to 60 minutes.
