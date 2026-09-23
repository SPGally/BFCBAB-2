import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

// `src/data/minutes.json` is one file per the content guide (contributors add
// `content_text` inline), but `content_text` is the bulk of its ~250 kB: fine for a single
// authoring file, too heavy to ship on every page. This plugin splits it in two virtual
// modules at build/dev/test time, so nothing on disk changes:
//   - virtual:minutes-meta    small, everything except content_text, imported eagerly
//   - virtual:minutes-content { [id]: content_text }, imported only where it's needed
// (minutes search, the meeting preview), each becoming its own on-demand chunk.
const MINUTES_META_ID = 'virtual:minutes-meta';
const MINUTES_CONTENT_ID = 'virtual:minutes-content';
const RESOLVED_META_ID = `\0${MINUTES_META_ID}`;
const RESOLVED_CONTENT_ID = `\0${MINUTES_CONTENT_ID}`;

export function minutesSplitPlugin(): Plugin {
  const minutesPath = fileURLToPath(new URL('../src/data/minutes.json', import.meta.url));

  const readMinutes = () => JSON.parse(readFileSync(minutesPath, 'utf8')) as Array<
    Record<string, unknown> & { id: string; content_text: string | null }
  >;

  return {
    name: 'minutes-split',
    resolveId(id) {
      if (id === MINUTES_META_ID) return RESOLVED_META_ID;
      if (id === MINUTES_CONTENT_ID) return RESOLVED_CONTENT_ID;
      return null;
    },
    load(id) {
      if (id === RESOLVED_META_ID) {
        const meta = readMinutes().map(({ content_text, ...rest }) => {
          void content_text;
          return rest;
        });
        return `export default ${JSON.stringify(meta)};`;
      }
      if (id === RESOLVED_CONTENT_ID) {
        const content: Record<string, string> = {};
        for (const minute of readMinutes()) {
          if (minute.content_text) content[minute.id] = minute.content_text;
        }
        return `export default ${JSON.stringify(content)};`;
      }
      return null;
    },
    handleHotUpdate({ file, server }) {
      if (file !== minutesPath) return;
      const modules = [RESOLVED_META_ID, RESOLVED_CONTENT_ID]
        .map((id) => server.moduleGraph.getModuleById(id))
        .filter((m): m is NonNullable<typeof m> => Boolean(m));
      for (const mod of modules) server.moduleGraph.invalidateModule(mod);
      return modules.length ? modules : undefined;
    },
  };
}
