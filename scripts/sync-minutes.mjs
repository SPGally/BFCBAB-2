#!/usr/bin/env node
// Sync src/data/minutes.json against the club's published minutes list.
//
//   node scripts/sync-minutes.mjs [--dry-run]
//
// The club page (CLUB_MINUTES_URL) renders its PDF links client-side, so we load it with
// Playwright rather than fetching the raw HTML. For every PDF link not already present (by
// file_path) in minutes.json, we download the PDF, extract its first-page text with
// pdf-parse, read the meeting date and location from the header (falling back to the club's
// own "DD.MM.YY" label when the header cannot be parsed), mirror the PDF to
// public/minutes/<yyyy-mm-dd>.pdf, and append a new entry with both the club URL (file_path)
// and the local mirror (local_path). Any existing entry missing its local mirror is backfilled
// the same way. Idempotent: running it again with nothing new and nothing missing locally
// changes nothing.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const MINUTES_PATH = resolve(ROOT, 'src/data/minutes.json');
const MINUTES_DIR = resolve(ROOT, 'public/minutes');
export const CLUB_MINUTES_URL =
  'https://www.barnsleyfc.co.uk/fans/fan-advisory-board/fab-meeting-minutes';

/** "2026-09-08" -> "/minutes/2026-09-08.pdf", the public URL of the local mirror. */
export function localPathForDate(date) {
  return `/minutes/${date}.pdf`;
}

/** "2026-09-08" -> absolute path of the local mirror on disk. */
function localDiskPathForDate(date) {
  return resolve(MINUTES_DIR, `${date}.pdf`);
}

const MONTHS = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

/** "Tuesday 8 September 2026" / "17th Dec 2024" / "26 March 2026" -> "2026-09-08", or null. */
export function parseDateText(raw) {
  if (!raw) return null;
  const m = raw.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\.?\s+(\d{4})/);
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  if (!month) return null;
  const day = Number(m[1]);
  const year = Number(m[3]);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** "08.09.26" (the club's DD.MM.YY label) -> "2026-09-08", or null. */
export function parseClubLabel(label) {
  if (!label) return null;
  const m = label.trim().match(/^(\d{2})\.(\d{2})\.(\d{2})$/);
  if (!m) return null;
  const [, dd, mm, yy] = m;
  return `20${yy}-${mm}-${dd}`;
}

/**
 * Read the meeting date and location from a PDF's first-page text. Handles the four header
 * styles seen across the club's minutes to date:
 *  - "Date of Meeting <date>" ... "Location <place>" (most of the 2024/2025 PDFs)
 *  - "Meeting held: <date>, <time>, <place>" (one line, e.g. 4 August 2026)
 *  - "Meeting of <date>" ... "Held online via <place>." (e.g. 9 June 2026)
 *  - "Date: <date>" ... "Location: <place>" or "Format: <place>" (e.g. 26 March / 8 September 2026)
 * Returns { date, location, style } or null if none of the styles match.
 */
export function parseHeader(text) {
  if (!text) return null;

  let m = text.match(/Meeting held:\s*(.+?),\s*\d{1,2}[.:]\d{2}\s*[ap]\.?m\.?,\s*(.+)/i);
  if (m) {
    const date = parseDateText(m[1]);
    if (date) return { date, location: m[2].trim(), style: 'meeting-held' };
  }

  m = text.match(/Date of Meeting[:\s]+([^\n]+)/i);
  if (m) {
    const date = parseDateText(m[1]);
    if (date) {
      const loc = text.match(/Location[:\s]+([^\n]+)/i);
      return { date, location: loc ? loc[1].trim() : null, style: 'date-of-meeting' };
    }
  }

  m = text.match(/Meeting of\s+([^\n|]+)/i);
  if (m) {
    const date = parseDateText(m[1]);
    if (date) {
      const loc = text.match(/Held\s+(?:online via|at)\s+([^\n.]+)\.?/i);
      return { date, location: loc ? loc[1].trim() : null, style: 'meeting-of' };
    }
  }

  m = text.match(/(?:^|\n)\s*(?:[•●]\s*)?Date:\s*([^\n]+)/i);
  if (m) {
    const date = parseDateText(m[1]);
    if (date) {
      const loc =
        text.match(/(?:[•●]\s*)?Location:\s*([^\n]+)/i) || text.match(/Format:\s*([^\n]+)/i);
      return { date, location: loc ? loc[1].trim() : null, style: 'date-colon' };
    }
  }

  return null;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "2026-09-08" -> "FAB Meeting Minutes - 8 September 2026" */
export function titleForDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return `FAB Meeting Minutes - ${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

/**
 * Build a new minutes.json entry for one PDF. `clubLabel` is the "DD.MM.YY" text the club
 * site shows next to the link; the PDF's own header date wins when the two differ.
 */
export function buildEntry({ href, clubLabel, pdfText }) {
  const header = parseHeader(pdfText);
  const date = header?.date ?? parseClubLabel(clubLabel);
  if (!date) return null;
  return {
    id: date,
    title: titleForDate(date),
    meeting_date: date,
    location: header?.location ?? 'Not recorded',
    file_path: href,
    local_path: localPathForDate(date),
    club_label: clubLabel ?? null,
    content_text: pdfText ?? null,
  };
}

function loadMinutes() {
  return JSON.parse(readFileSync(MINUTES_PATH, 'utf8'));
}

function saveMinutes(entries) {
  const sorted = entries.slice().sort((a, b) => b.meeting_date.localeCompare(a.meeting_date));
  writeFileSync(MINUTES_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
}

async function fetchListing() {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(CLUB_MINUTES_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('a[href*="images.gc.barnsleyfcservices.co.uk"]', { timeout: 30000 });
    const links = await page.$$eval('a', (as) =>
      as
        .filter((a) => a.href.includes('images.gc.barnsleyfcservices.co.uk'))
        .map((a) => ({ href: a.href, text: a.textContent?.trim() ?? '' })),
    );
    // Dedupe by href (the page sometimes repeats a link with a bare "Read here" label).
    const byHref = new Map();
    for (const link of links) {
      const label = link.text.replace(/Read\s*here$/i, '').trim();
      const existing = byHref.get(link.href);
      if (!existing || (!existing.clubLabel && label)) {
        byHref.set(link.href, { href: link.href, clubLabel: label || null });
      }
    }
    return [...byHref.values()];
  } finally {
    await browser.close();
  }
}

async function downloadPdf(href) {
  const res = await fetch(href);
  if (!res.ok) throw new Error(`failed to download ${href}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function extractPdfText(buffer) {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const { text } = await parser.getText();
    return text.trim();
  } finally {
    await parser.destroy();
  }
}

function saveLocalCopy(date, buffer) {
  mkdirSync(MINUTES_DIR, { recursive: true });
  writeFileSync(localDiskPathForDate(date), buffer);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const existing = loadMinutes();
  const known = new Set(existing.map((e) => e.file_path));

  const listing = await fetchListing();
  const toAdd = listing.filter((link) => !known.has(link.href));

  const added = [];
  for (const link of toAdd) {
    console.log(`sync-minutes: downloading ${link.href}`);
    const buffer = await downloadPdf(link.href);
    const pdfText = await extractPdfText(buffer);
    const entry = buildEntry({ href: link.href, clubLabel: link.clubLabel, pdfText });
    if (!entry) {
      console.warn(`sync-minutes: could not determine a meeting date for ${link.href}, skipping`);
      continue;
    }
    if (existing.some((e) => e.id === entry.id) || added.some((e) => e.id === entry.id)) {
      console.warn(`sync-minutes: ${entry.id} already exists, skipping ${link.href}`);
      continue;
    }
    if (!dryRun) saveLocalCopy(entry.id, buffer);
    added.push(entry);
  }

  // Backfill a local mirror for any existing entry that does not have one on disk yet
  // (e.g. entries added before this script mirrored PDFs locally).
  const backfilled = [];
  for (const entry of existing) {
    if (entry.local_path && existsSync(localDiskPathForDate(entry.id))) continue;
    console.log(`sync-minutes: backfilling local copy for ${entry.id}`);
    const buffer = await downloadPdf(entry.file_path);
    if (!dryRun) saveLocalCopy(entry.id, buffer);
    entry.local_path = localPathForDate(entry.id);
    backfilled.push(entry.id);
  }

  if (added.length === 0 && backfilled.length === 0) {
    console.log('sync-minutes: nothing new, minutes.json is up to date');
    return;
  }

  if (added.length > 0) {
    console.log(`sync-minutes: adding ${added.length} entr${added.length === 1 ? 'y' : 'ies'}`);
    for (const entry of added) console.log(`  - ${entry.id} (${entry.file_path})`);
  }
  if (backfilled.length > 0) {
    console.log(`sync-minutes: backfilled ${backfilled.length} local cop${backfilled.length === 1 ? 'y' : 'ies'}`);
  }

  if (dryRun) {
    console.log('sync-minutes: --dry-run, not writing minutes.json');
    return;
  }

  saveMinutes([...existing, ...added]);
  console.log(`sync-minutes: wrote ${MINUTES_PATH}`);
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
