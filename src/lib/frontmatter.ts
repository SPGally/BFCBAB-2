// Front-matter parser shared between the browser app (src/lib/content.ts, via
// import.meta.glob) and the Node build script (scripts/build-feeds.mjs, which reads the
// same Markdown files from disk with fs). Keeping this in one module means the RSS feed,
// sitemap and site itself always agree on which articles are published.
//
// Front matter is a small subset of YAML: one `key: value` per line, where value is a
// JSON string, true/false/null, or a bare token. Enough for what the content guide allows.
export interface FrontMatterResult {
  data: Record<string, unknown>;
  body: string;
}

export function parseFrontMatter(raw: string): FrontMatterResult {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const data: Record<string, unknown> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (value === 'true') data[key] = true;
    else if (value === 'false') data[key] = false;
    else if (value === 'null' || value === '') data[key] = null;
    else if (value.startsWith('"')) {
      try {
        data[key] = JSON.parse(value);
      } catch {
        data[key] = value;
      }
    } else data[key] = value;
  }
  return { data, body: match[2] };
}
