import { expect, test } from '@playwright/test';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { GenerateRequest, generateDrafts } from '../../src/app/shared/visual/assets/generate';
import { catalogueProblems } from '../../src/app/shared/visual/assets/manifest';
import { PROVIDERS } from './providers';

// The authoring script for generated pictures (Visual System M7 stage C, `npm run visuals:generate`).
// It reads request.json beside it (a provider's name, an asset id, a seed, the content key of the
// text alternative, and a brief of words from the fixed lists), asks that provider, checks what
// comes back, and writes each picture with a draft manifest entry to web/visual-exports/generated/
// (not committed). It runs on the authoring machine only, as a Playwright run for the TypeScript,
// with no browser and no server. A draft becomes an asset the app can use only when a person copies
// its files to web/public/visuals/, enters it in the catalogue and records their review.

const OUT = join(__dirname, '../../visual-exports/generated');

test('generate drafts', async () => {
  const request = JSON.parse(readFileSync(join(__dirname, 'request.json'), 'utf8')) as GenerateRequest & { provider: string };
  // No provider by that name: nothing runs, and the script says so.
  const drafts = await generateDrafts(PROVIDERS[request.provider], request);

  // Emptied, not removed: Windows refuses to remove a folder that is open in Explorer or a terminal.
  mkdirSync(OUT, { recursive: true });
  for (const name of readdirSync(OUT)) rmSync(join(OUT, name), { recursive: true, force: true });
  const written = new Map<string, { bytes: number; sha256: string }>();
  for (const draft of drafts)
    for (const file of draft.files) {
      // An entry's path is where the file would live once adopted (visuals/generated/…).
      const target = join(OUT, file.path.replace(/^visuals\/generated\//, ''));
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, file.data);
      const entry = [draft.entry.files.light, draft.entry.files.dark].find((f) => f.path === file.path)!;
      written.set(file.path, { bytes: file.data.length, sha256: entry.sha256 });
    }
  const entries = drafts.map((d) => d.entry);
  // Every draft passes the manifest's own checks against the files just written; the text alternative is a person's to write.
  expect(catalogueProblems(entries, (path) => written.get(path) ?? null, () => 'To be written by a person.')).toEqual([]);
  expect(entries.every((e) => e.status === 'draft' && !e.review)).toBe(true);
  writeFileSync(join(OUT, 'drafts.json'), JSON.stringify({ request, entries }, null, 2) + '\n');
  console.log(`Wrote ${entries.length} draft(s) from provider '${request.provider}' to ${OUT}`);
});
