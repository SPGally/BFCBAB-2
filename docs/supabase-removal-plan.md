# Removing Supabase from fab.barnsleyfc.co.uk

Written 10 September 2026 after reading the whole codebase, the club website, the
Supabase organisation and the downloaded backups. This is the reasoning behind the
`backlog/issues.yaml` entries; each section names the issues that follow from it.

## 1. What happened

- The site is a Vite + React single-page app deployed to Netlify from `main`. It had no
  server of its own; every page fetched its data in the browser from Supabase.
- The Supabase project (`hefkoywehwsfqiwuknyv`, us-east-1, named `sb1-n3jwpfwk`) is
  **paused**. A restore attempt on 10 September 2026 was refused because the Supabase
  organisation has unpaid invoices. The REST endpoint does not resolve at all.
- In production that meant: Home showed "No news articles available", Minutes and
  Meetings were empty, About Us had no members, FAQ was empty, the Submit form failed,
  and the admin login could not authenticate. **That is the "news system issue".**
  Nothing in the news code was failing on its own; its data source was gone.
- Paul downloaded the last database backup (`db_cluster-27-07-2026@07-36-06`, taken
  27 July 2026) and the storage export the same day. Everything in them is now in the
  repo (PR #2), so no content was lost. The 7 rows in `submissions` were mostly tests
  and were handed to Paul as a CSV rather than committed.

## 2. What Supabase provided and what replaced it

| Supabase feature | Used by | Replacement (all merged in PRs #1 to #3) |
|---|---|---|
| `minutes` table + `minutes` bucket | Minutes, Meetings | `src/data/minutes.json`; PDFs hot-linked from the club CDN, which is the official record |
| `meetings` table + `meetings` bucket | Home, Meetings | `src/data/meetings.json` for upcoming; past meetings derived from the minutes; the three real agendas kept on the minutes entries |
| `news` table + `news-images` bucket | Home, News, NewsArticle | `src/content/news/*.md` (front matter plus HTML body), images in `public/images/news/` |
| `board_members` table + bucket | About Us, news author | `src/data/members.json`, photos in `public/images/members/` |
| `faq_topics`, `faqs` tables | FAQ, FAQDetails | `src/data/faq.json` (currently the three seed examples, flagged `placeholder`) |
| `submissions` table | Submit page | Netlify Forms with a mailto fallback (no credentials, no database) |
| `settings` table (social prompts), OpenAI helper | admin | Dropped; social posts are written outside the site |
| Auth | `/admin/*` | Dropped; content changes are pull requests |

`src/lib/content.ts` is the only code that knows where content comes from. Pages import
from it and never fetch. Old `/news/<uuid>` links still resolve through `legacy_id`.

## 3. How content is updated now

Edit a file, open a pull request, merge. Netlify rebuilds `main` automatically, so a
merged PR is live within a couple of minutes with no DNS or hosting change. Claude does
this in a session on request ("add this news article", "add the next meeting date", "the
club has published new minutes") and the reviewer agent checks the diff and the preview
before it is merged. `docs/content-guide.md` (FAB-005) will spell out each file's fields.

Minutes are the one content type with an external source of truth. A weekly GitHub
Action (FAB-006) will scrape the club minutes page and open a PR when a new PDF appears.

## 4. Problems found in the old news code, for the record

1. **Every edit reset the publish date.** The admin form set `published_at` to "now" on
   every save while "published" was ticked. In Markdown front matter the date is written
   once.
2. **Scheduling was half-built.** Queries filtered on `published_at <= now` but the admin
   form could not set a future date. Front matter can: a future `published_at` hides the
   article until then (client-side, so the build must happen after the date; FAB-007).
3. **The RSS feed never worked.** `src/pages/api/rss.ts` was never wired to anything; a
   Vite SPA has no API routes, so `/rss.xml` returned the SPA shell. Built at build time
   in FAB-007.
4. **Social link previews never worked.** Open Graph tags came from `react-helmet` in
   the browser, which crawlers do not run. Pre-rendering (FAB-008) fixes it with no server.
5. **The OpenAI key would have shipped to every visitor** if `VITE_OPENAI_API_KEY` had
   been set. Gone with the admin area.
6. **Errors looked like "no news".** Fetch failures were swallowed. Static content
   removes the failure mode.
7. **One 1.1 MB bundle** because the admin editor and pdf.js were imported at the top of
   `App.tsx`. Now 509 kB; route-level splitting (FAB-015) takes it further.

## 5. Hosting

Paul's decision (10 September 2026, confirmed 22 September 2026): the site stays fully static on
Netlify. No hosting move and no serverless functions are planned; the M2 milestone was retired and
issues FAB-011 to FAB-014 closed. Netlify Forms (with reCAPTCHA) handles the Submit page. The
comparison below is kept for reference only.

When the move happens, the built site is a plain `dist/` folder and will run anywhere.
The candidates are Cloudflare Pages (the `deploy.yml` workflow already supports it, gated
on secrets, exactly like the SPSync website) or an Azure Static Web App if Paul prefers
to consolidate on Azure. The differences are small:

| | Netlify (now) | Cloudflare Pages | Azure Static Web Apps |
|---|---|---|---|
| SPA fallback and headers | `netlify.toml`, `_redirects` | `_redirects`, `_headers` | `staticwebapp.config.json` |
| Submit form | Netlify Forms (100/month free) | Pages Function + Resend/MailChannels | Azure Function + email service |
| Deploy | Git integration on `main` | `wrangler pages deploy` from GitHub Actions | `Azure/static-web-apps-deploy` action |
| Custom domain | CNAME | CNAME + TXT verification | CNAME + TXT verification |

FAB-011 records the decision; FAB-012 to FAB-014 do the move.

## 6. Order of work

1. **M0 Stabilise** (this week): tests, CI enforcement, Netlify Forms notifications,
   real FAQ content.
2. **M1 Content by PR**: content guide and `/add-news` skill, minutes sync action, RSS
   and sitemap, pre-rendering, upcoming meetings with calendar download.
3. **M1, continued: AI readability**: sitemap and robots.txt, pre-rendering, structured data,
   llms.txt and Markdown mirrors, page metadata, a no-JavaScript check in CI (FAB-007, FAB-008,
   FAB-018 to FAB-021).
4. **M3 Polish**: bundle split, PDF mirror, delete the Supabase project, Lighthouse pass.
