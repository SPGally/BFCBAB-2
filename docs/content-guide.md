# Content guide

Everything on the site is a file in this repo, read through `src/lib/content.ts`. There is
no database and no admin UI: every content change — a new article, a fresh set of minutes, a
new meeting date, a member joining or leaving, an FAQ answer — is a pull request that Paul
(or a session on his behalf) opens, and Netlify redeploys automatically when it merges.

This guide has one section per content type: where the file lives, what fields it takes, a
copy-paste example, image rules where relevant, and the checklist to run before opening the
PR. If you only need to add a news article, `.claude/skills/add-news/SKILL.md` does the file
work for you; this guide is what it (and any cold session) follows.

**Content PRs are never auto-merged automatically by an agent.** The reviewer approves them
but leaves them open, labelled `approved-hold-for-paul`, for Paul to merge himself — see
`docs/review-agent.md` §3.5.

## News articles

**File:** one Markdown file per article in `src/content/news/`, named
`<yyyy-mm-dd>-<slug>.md` (the date is the day the file is added, not necessarily
`published_at`; the filename's date prefix is stripped to make the default slug if the front
matter doesn't set one).

**Fields** (front matter between `---` lines; `src/lib/content.ts` parses a small subset of
YAML — one `key: value` per line, quoted strings, `true`/`false`/`null`, or a bare token; no
nested structures, no multi-line values):

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Quoted string. |
| `slug` | no | Quoted string. Defaults to the filename with its date prefix stripped. Must be unique; it's the article's URL, `/news/<slug>`. |
| `published_at` | yes | ISO 8601 date-time, e.g. `"2026-09-23T09:00:00Z"`. Articles with a future `published_at`, or `draft: true`, are excluded from the public list. **The site is static:** an article scheduled for a future `published_at` won't actually appear until the site is rebuilt after that time passes (a Netlify build hook on a schedule, or a scheduled GitHub Actions workflow that triggers a Netlify deploy — neither exists yet, so for now, re-run a deploy once the date has passed). This also affects `dist/rss.xml` and `dist/sitemap.xml` (built by `scripts/build-feeds.mjs`), which only list articles published as of the build. |
| `summary` | yes | Quoted string, one or two sentences. Shown on the news list and as the share preview. |
| `author` | no | A member `id` from `src/data/members.json` (e.g. `paul-gallagher`), or `null`. Renders the member's name/photo as byline. |
| `image` | no | Path under `/public`, e.g. `"/images/news/2026-09-23-my-article.jpg"`, or `null`. Featured image on the list and article page. |
| `pinned` | no | `true`/`false`. Pinned articles sort first regardless of date. |
| `draft` | no | `true`/`false`. Draft articles never appear on the public site; use this to commit work in progress. A draft does not render anywhere, including its own URL — temporarily set `draft: false` to check it in `npm run dev`, then set it back before committing. |
| `legacy_id` | no | Only set on articles migrated from the old database; leave unset for new articles. |

The body after the second `---` is **HTML, not Markdown** — the site renders it directly as
`content_html`. Keep it to plain tags: `<p>`, `<h2>`/`<h3>`, `<strong>`/`<em>`, `<ul>`/`<li>`,
`<a href="..." target="_blank" rel="noopener noreferrer">`. Do not include `<script>` or
inline event handlers.

**Example:**

```markdown
---
title: "FAB welcomes two new board members"
slug: fab-welcomes-two-new-board-members
published_at: "2026-09-23T09:00:00Z"
summary: "The board is pleased to confirm two new representatives following the recent nomination process."
author: "paul-gallagher"
image: "/images/news/2026-09-23-fab-welcomes-two-new-board-members.jpg"
pinned: false
draft: false
---
<p>The Fan Advisory Board is pleased to confirm two new representatives, joining following the recent nomination process.</p>
<p>Full details of their roles will follow at the next meeting.</p>
```

**Image:** JPEG, 1600px wide (matches the existing files in `public/images/news/`), named to
match the article's filename minus the extension, e.g.
`public/images/news/2026-09-23-fab-welcomes-two-new-board-members.jpg`. Resize with `sips`
(macOS, already installed) or any image tool before committing; do not commit an
unresized source photo.

## Minutes

**File:** `src/data/minutes.json`, a JSON array. One entry per published set of minutes; the
site sorts by `meeting_date` descending, so append entries wherever in the array — order in
the file doesn't matter.

**Fields:**

| Field | Required | Notes |
|---|---|---|
| `id` | yes | ISO date, e.g. `"2026-09-08"`. Used as the URL id (`/minutes/<id>`); must be unique. |
| `title` | yes | e.g. `"FAB Meeting Minutes - 8 September 2026"`. |
| `meeting_date` | yes | ISO date, same as `id` in practice. |
| `location` | yes | e.g. `"Video call (Microsoft Teams)"`. |
| `file_path` | yes | The public PDF URL. Minutes PDFs are hot-linked from the club CDN (`images.gc.barnsleyfcservices.co.uk`) and should mirror the official list at https://www.barnsleyfc.co.uk/fans/fan-advisory-board/fab-meeting-minutes — do not upload PDFs into this repo. |
| `club_label` | no | The label the club website shows for this document, e.g. `"08.09.26"`. Helps cross-reference against the official list. |
| `agenda_html` | no | Optional HTML agenda, or `null`. |
| `content_text` | yes | Plain text extracted from the PDF, used for on-site search. `null` if not extracted. Copy the PDF's text (a PDF-to-text tool or manual copy-paste is fine); don't skip this or search will miss the minutes. |

**Example:**

```json
{
  "id": "2026-10-06",
  "title": "FAB Meeting Minutes - 6 October 2026",
  "meeting_date": "2026-10-06",
  "location": "Oakwell",
  "file_path": "https://images.gc.barnsleyfcservices.co.uk/<club-cdn-id>.pdf",
  "club_label": "06.10.26",
  "agenda_html": null,
  "content_text": "Barnsley FC Fan Advisory Board — Meeting Minutes\nDate: Tuesday 6 October 2026\n..."
}
```

## Upcoming meetings

**File:** `src/data/meetings.json`, a JSON array. The site filters to meetings with `date`
in the future and sorts ascending; remove or leave an entry once it has passed — a past
meeting isn't hidden automatically, it just won't be filtered out, so tidy it up when you add
that meeting's minutes.

**Fields:**

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Stable slug, conventionally the ISO date, e.g. `"2026-10-29"`. Must be unique. Also used as the ICS `UID` prefix for "Add to calendar", so it must stay stable once published. |
| `title` | yes | e.g. `"Fan Advisory Board Meeting"`. |
| `date` | yes | ISO date-time with offset, e.g. `"2026-10-29T18:00:00+00:00"`. The offset matters: the "Add to calendar" `.ics` file is built from this value and always exports `DTSTART`/`DTEND` in UTC, so an incorrect offset produces an event at the wrong time in the supporter's calendar app. |
| `location` | yes | e.g. `"Online via Microsoft Teams"` or `"Oakwell"`. |
| `description` | no | One or two sentences, or `null`. |
| `agenda_html` | no | Optional HTML agenda, or `null`. |

**Example:**

```json
{
  "id": "2026-11-10",
  "title": "Fan Advisory Board Meeting",
  "date": "2026-11-10T18:00:00+00:00",
  "location": "Online via Microsoft Teams",
  "description": "Regular meeting of the Fan Advisory Board with the club. Send anything you would like raised beforehand via the Submit page.",
  "agenda_html": null
}
```

### Add to calendar

`MeetingDetails` offers an "Add to calendar" button for upcoming meetings, built by
`src/lib/ics.ts` (`buildIcsEvent` / `downloadIcsEvent`). It generates a minimal RFC 5545
`.ics` file entirely in the browser — no server, no third-party calendar API — defaulting
the event duration to 60 minutes.

## Members

**File:** `src/data/members.json`, a JSON array, sorted by `order` on the site (lower first).

**Fields:**

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Slug, e.g. `"steve-brain"`. Referenced by news `author` and the Submit form; must be unique and stable — changing it breaks existing article bylines. |
| `name` | yes | Display name, or `"Vacant"` for an unfilled seat. |
| `role` | yes | e.g. `"Representing season ticket holders"`. |
| `email` | no | Contact email, or `null`. |
| `bio` | yes | Free text, newlines allowed in the JSON string (`\n`). |
| `image` | no | Path under `/public`, e.g. `"/images/members/steve-brain.jpg"`, or `null`. |
| `order` | yes | Integer; controls display order. Leave gaps if useful, or renumber the whole file — either is fine as long as it's internally consistent. |
| `vacant` | yes | `true`/`false`. Vacant seats use `id` prefixed `vacant-...` by convention and `name: "Vacant"`. |

**Example:**

```json
{
  "id": "jane-example",
  "name": "Jane Example",
  "role": "Representing season ticket holders",
  "email": "jane.example@example.com",
  "bio": "Jane has supported the club for over twenty years and represents season ticket holders on the board.",
  "image": "/images/members/jane-example.jpg",
  "order": 5,
  "vacant": false
}
```

**Image:** JPEG, 600px wide, square preferred (most existing files are 600x600), named
`<id>.jpg`, e.g. `public/images/members/jane-example.jpg`.

## FAQ

**File:** `src/data/faq.json`, a JSON array of topics, each with a nested array of
questions. Displayed in file order.

**Topic fields:**

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Slug, unique across topics. |
| `name` | yes | Topic heading, e.g. `"Matchday Experience"`. |
| `description` | no | One sentence, or `null`. |
| `questions` | yes | Array of question objects (below); `[]` for an empty topic. |

**Question fields:**

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Slug, unique across all topics (used as the FAQ item's URL). |
| `question` | yes | The question text. |
| `answer_html` | yes | HTML, same rules as news body: `<p>`, `<h2>`/`<h3>`, `<a href="..." target="_blank" rel="noopener noreferrer">`, etc. |
| `raised_by` | yes | Array of strings describing who raised it, e.g. `["a supporter at the September meeting"]`. `[]` if unknown. |
| `minutes_refs` | yes | Array of minutes `id`s (ISO dates from `src/data/minutes.json`) the answer draws on. `[]` if none. |
| `author` | no | A member `id` from `src/data/members.json` who answered, or `null`. |

**Example:**

```json
{
  "id": "how-do-i-contact-the-fab",
  "question": "How do I contact the FAB?",
  "answer_html": "<p>Use the Submit page to send a message to any FAB member, or email a representative directly if you have their address.</p>",
  "raised_by": [],
  "minutes_refs": [],
  "author": null
}
```

## PR checklist

Before opening the pull request:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run build`
4. `npm test`
5. `npm run dev` and check the page in the browser: the new/changed item renders, links work,
   images load at the right size, and (for news) the article isn't accidentally excluded by a
   future `published_at` or `draft: true`.
6. Valid JSON — `npm run build` will fail loudly on a syntax error, but a linter or
   `python3 -m json.tool src/data/<file>.json > /dev/null` catches it faster.
7. Open the PR with `scripts/agent pr` (or by hand, following the PR template): `Fixes #N`
   if there's an issue, `Agent:` line, what changed, how verified, out of scope, handoff.
   Content PRs (`src/content/`, `src/data/`, `public/images/`) are approved but left open for
   Paul to merge — do not expect or ask for an auto-merge.
