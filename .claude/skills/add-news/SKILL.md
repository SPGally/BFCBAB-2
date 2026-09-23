---
name: add-news
description: Add a news article to the site from a title, a body, and an optional image, writing the Markdown file, resizing the image, running checks and opening the PR. Use when Paul says "add a news article", "post this as news", "write up the meeting as an article", or gives you a title and some text to publish.
---

News articles are files: `docs/content-guide.md` §News articles is the full field reference
this skill follows. There is no admin UI; every article is a pull request, and (per
`docs/review-agent.md` §3.5) the reviewer approves but leaves it open, labelled
`approved-hold-for-paul`, for Paul to merge.

## Inputs
- **Title** (required).
- **Body** (required): plain text or simple HTML. If plain text, wrap each paragraph in
  `<p>...</p>`; keep formatting to `<p>`, `<h2>`/`<h3>`, `<strong>`/`<em>`, `<ul>`/`<li>`,
  `<a href="..." target="_blank" rel="noopener noreferrer">`. This becomes the file's body
  verbatim — the site renders it as HTML, not Markdown.
- **Image** (optional): a path to a source image.
- **Optional**: summary (else write one to two sentences from the body), author (a member
  `id` from `src/data/members.json`, else `null`), pinned (else `false`).

## Steps
1. Make sure you're on a claimed branch (`scripts/agent claim <N>` for a tracked issue, or
   ask before working off an untracked branch).
2. Work out the slug from the title: lowercase, hyphenated, no punctuation, e.g. "FAB Welcomes
   Two New Board Members" → `fab-welcomes-two-new-board-members`. Check it doesn't collide
   with an existing file in `src/content/news/`.
3. Write `src/content/news/<yyyy-mm-dd>-<slug>.md` where the date prefix is today
   (`date +%Y-%m-%d`), with front matter:
   ```
   ---
   title: "<title>"
   slug: <slug>
   published_at: "<today's date>T09:00:00Z"
   summary: "<summary>"
   author: <"member-id" or null>
   image: <"/images/news/<yyyy-mm-dd>-<slug>.jpg" or null>
   pinned: <true or false>
   draft: false
   ---
   <body HTML>
   ```
   Use `date -u +%Y-%m-%dT09:00:00Z` (or equivalent) for `published_at` so the article is
   immediately published, not scheduled in the future.
4. If an image was given: resize it to 1600px wide JPEG with `sips` and write it to
   `public/images/news/<yyyy-mm-dd>-<slug>.jpg` (matching the front matter `image` path):
   ```bash
   sips -Z 1600 "<source image>" --out public/images/news/<yyyy-mm-dd>-<slug>.jpg
   ```
   `-Z 1600` scales so the longest edge is 1600px; if the source is portrait, check the
   result is still a reasonable width for a hero image and re-crop if not. If no image was
   given, leave `image: null` and skip this step — do not invent or fetch one.
5. Run the checks: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`. Optionally
   `npm run dev` and check the article renders at `/news/<slug>`.
6. Open the PR with `scripts/agent pr @path/to/body.md` (write the body to a file first),
   following the template: `Fixes #N` if there's a tracked issue, `Agent:` line, what
   changed, how verified, out of scope, handoff. Then `scripts/agent handoff "<one line>"`.

## Guardrails
- Never fabricate quotes, figures or claims not given to you; ask if the body is unclear
  rather than filling gaps.
- Never set `published_at` in the future unless explicitly asked to schedule the article
  (then also set nothing else that depends on "today").
- Never commit an unresized source image — always run it through `sips -Z 1600` first.
- This skill does not merge or auto-publish anything: it stops at opening the PR.
