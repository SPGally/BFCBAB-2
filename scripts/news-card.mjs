#!/usr/bin/env node
// Generate a 1600x900 branded card for a news article that has no photo.
//
//   node scripts/news-card.mjs --template minutes --title "Tuesday 4 August 2026" \
//        --subtitle "South Stand Meeting Room, Oakwell Stadium" --footer "Now published" \
//        --out public/images/news/2026-09-10-august-meeting-minutes-published.jpg
//
// Templates (each sets the kicker line; everything else comes from the flags):
//   minutes    kicker "MEETING MINUTES"
//   meeting    kicker "NEXT MEETING"
//   statement  kicker "FAB STATEMENT"
//   news       kicker "FAB NEWS" (default)
//   --kicker overrides the template's kicker.
//
// Layout: club red gradient, white panel, the FAB logo (public/images/BFC-FanAdvisoryBoard.png),
// a short red rule, kicker in black, title in red, subtitle in grey, footer in black. Content is
// centred so the card survives the 16:9 hero and the square social crops.
//
// macOS only: renders the SVG with Quick Look (qlmanage) and converts with sips. No npm deps.

import { readFileSync, writeFileSync, mkdtempSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { inflateSync, deflateSync, crc32 } from 'node:zlib';

const ROOT = resolve(new URL('.', import.meta.url).pathname, '..');
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 || args[i + 1] === undefined ? fallback : args[i + 1];
};
const TEMPLATES = {
  minutes: { kicker: 'MEETING MINUTES' },
  meeting: { kicker: 'NEXT MEETING' },
  statement: { kicker: 'FAB STATEMENT' },
  news: { kicker: 'FAB NEWS' },
};
const template = TEMPLATES[opt('template', 'news')];
if (!template) { console.error(`Unknown template. Use one of: ${Object.keys(TEMPLATES).join(', ')}`); process.exit(1); }
const kicker = opt('kicker', template.kicker);
const title = opt('title', '');
const subtitle = opt('subtitle', '');
const footer = opt('footer', '');
const out = opt('out');
if (!title || !out) { console.error('--title and --out are required'); process.exit(1); }

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Wrap text to at most `maxLines`, shrinking the font until it fits `maxWidth`.
function fit(text, { size, minSize, maxWidth, maxLines, weightFactor }) {
  for (let s = size; s >= minSize; s -= 4) {
    const charW = s * weightFactor;
    const perLine = Math.floor(maxWidth / charW);
    const words = text.split(/\s+/);
    const lines = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (next.length > perLine && cur) { lines.push(cur); cur = w; } else cur = next;
    }
    if (cur) lines.push(cur);
    if (lines.length <= maxLines && lines.every((l) => l.length <= perLine)) return { size: s, lines };
  }
  return { size: minSize, lines: [text] };
}

const logoPath = resolve(ROOT, 'public/images/BFC-FanAdvisoryBoard.png');
const logo = readFileSync(logoPath).toString('base64');
const LOGO_W = 643, LOGO_H = 142; // native size of the logo PNG
const logoScale = 0.9;
const lw = LOGO_W * logoScale, lh = LOGO_H * logoScale;

const kickerFit = fit(kicker, { size: 72, minSize: 44, maxWidth: 840, maxLines: 1, weightFactor: 0.66 });
const titleFit = fit(title, { size: 50, minSize: 30, maxWidth: 840, maxLines: 2, weightFactor: 0.56 });
const subFit = fit(subtitle, { size: 32, minSize: 22, maxWidth: 840, maxLines: 2, weightFactor: 0.5 });

// Vertical layout inside the panel (y from 170 to 730), centred as a block.
const gap = 18;
const blocks = [
  { h: lh },
  { h: 8 + 26 },
  { h: kickerFit.size * 1.05 },
  ...(title ? [{ h: titleFit.lines.length * titleFit.size * 1.15 }] : []),
  ...(subtitle ? [{ h: subFit.lines.length * subFit.size * 1.2 }] : []),
  ...(footer ? [{ h: 40 }] : []),
];
const total = blocks.reduce((a, b) => a + b.h, 0) + gap * (blocks.length - 1);
let y = 450 - total / 2;
const font = 'Helvetica Neue, Helvetica, Arial, sans-serif';
let svgBody = '';
svgBody += `<image x="${800 - lw / 2}" y="${y}" width="${lw}" height="${lh}" href="data:image/png;base64,${logo}"/>`; y += lh + gap;
svgBody += `<rect x="755" y="${y + 13}" width="90" height="8" fill="#E31837"/>`; y += 34 + gap;
svgBody += `<text x="800" y="${y + kickerFit.size * 0.85}" text-anchor="middle" font-family="${font}" font-size="${kickerFit.size}" font-weight="800" fill="#1A1A1A" letter-spacing="-1">${esc(kickerFit.lines[0])}</text>`; y += kickerFit.size * 1.05 + gap;
if (title) { titleFit.lines.forEach((l, i) => { svgBody += `<text x="800" y="${y + titleFit.size * 0.85 + i * titleFit.size * 1.15}" text-anchor="middle" font-family="${font}" font-size="${titleFit.size}" font-weight="600" fill="#E31837">${esc(l)}</text>`; }); y += titleFit.lines.length * titleFit.size * 1.15 + gap; }
if (subtitle) { subFit.lines.forEach((l, i) => { svgBody += `<text x="800" y="${y + subFit.size * 0.85 + i * subFit.size * 1.2}" text-anchor="middle" font-family="${font}" font-size="${subFit.size}" fill="#4B5563">${esc(l)}</text>`; }); y += subFit.lines.length * subFit.size * 1.2 + gap; }
if (footer) { svgBody += `<text x="800" y="${y + 28}" text-anchor="middle" font-family="${font}" font-size="28" font-weight="600" fill="#1A1A1A">${esc(footer)}</text>`; }

const panelTop = Math.min(170, 450 - total / 2 - 50);
const panelH = 900 - 2 * panelTop;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 1600 900">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E31837"/><stop offset="1" stop-color="#9E0F26"/></linearGradient></defs>
  <rect width="1600" height="900" fill="url(#g)"/>
  <circle cx="1420" cy="120" r="380" fill="#ffffff" fill-opacity="0.06"/>
  <circle cx="180" cy="800" r="280" fill="#ffffff" fill-opacity="0.05"/>
  <rect x="330" y="${panelTop}" width="940" height="${panelH}" rx="24" fill="#ffffff"/>
  ${svgBody}
</svg>`;

// Render: qlmanage writes a square 1600x1600 PNG with the card at the top; crop the first 900 rows.
const tmp = mkdtempSync(join(tmpdir(), 'fab-card-'));
const svgPath = join(tmp, 'card.svg');
writeFileSync(svgPath, svg);
execFileSync('qlmanage', ['-t', '-s', '1600', '-o', tmp, svgPath], { stdio: 'ignore' });
const png = readFileSync(join(tmp, 'card.svg.png'));

function cropPngTop(buf, keepRows) {
  let i = 8, idat = [], ihdr;
  while (i < buf.length) {
    const len = buf.readUInt32BE(i); const type = buf.toString('ascii', i + 4, i + 8); const data = buf.subarray(i + 8, i + 8 + len);
    if (type === 'IHDR') ihdr = data; else if (type === 'IDAT') idat.push(data);
    i += 12 + len;
  }
  const w = ihdr.readUInt32BE(0), ct = ihdr[9];
  const bpp = ct === 6 ? 4 : 3, stride = w * bpp;
  const raw = inflateSync(Buffer.concat(idat));
  const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  let prev = Buffer.alloc(stride), pos = 0; const rows = [];
  for (let y = 0; y < keepRows; y++) {
    const f = raw[pos]; const line = Buffer.from(raw.subarray(pos + 1, pos + 1 + stride)); pos += 1 + stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? line[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      if (f === 1) line[x] = (line[x] + a) & 255; else if (f === 2) line[x] = (line[x] + b) & 255;
      else if (f === 3) line[x] = (line[x] + ((a + b) >> 1)) & 255; else if (f === 4) line[x] = (line[x] + paeth(a, b, c)) & 255;
    }
    rows.push(Buffer.concat([Buffer.from([0]), line])); prev = line;
  }
  const chunk = (type, data) => { const t = Buffer.from(type, 'ascii'); const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])) >>> 0); return Buffer.concat([len, t, data, crc]); };
  const hdr = Buffer.from(ihdr); hdr.writeUInt32BE(keepRows, 4); hdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', hdr), chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
const cropped = join(tmp, 'card-crop.png');
writeFileSync(cropped, cropPngTop(png, 900));
const outPath = resolve(out);
if (!existsSync(dirname(outPath))) mkdirSync(dirname(outPath), { recursive: true });
execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '85', cropped, '--out', outPath], { stdio: 'ignore' });
console.log(`wrote ${outPath} (${kicker} / ${titleFit.lines.join(' | ')})`);
