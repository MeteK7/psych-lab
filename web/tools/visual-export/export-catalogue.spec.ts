import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { AssetEntry, catalogueProblems } from '../../src/app/shared/visual/assets/manifest';

// The export script (Visual System M7, `npm run visuals:export`): every scene state, instrument
// answer set and Lab reference as a standalone SVG and as PNGs at 1× and 2×, in light and dark,
// written to web/visual-exports/ (not committed), with a draft manifest entry for each. It runs as
// a Playwright run so it uses the same servers and the same browser as the browser tests, and the
// same export code the Lab's parity page uses. An asset the app is to use is then copied to
// web/public/visuals/ and entered in the catalogue (shared/visual/assets/catalogue.ts) once reviewed.

const OUT = join(__dirname, '../../visual-exports');

interface CaseInfo {
  key: string;
  name: string;
  width: number;
  height: number;
  exportable: boolean;
}
interface Facts {
  id: string;
  version: number;
  state?: string;
  theme: string;
  themeVersion: number;
  seed?: string;
  alt: string;
}

const facts = (data: Buffer) => ({ bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') });

test('export the catalogue', async ({ page }) => {
  test.setTimeout(900_000);
  await page.goto('/lab/parity?harness');
  await page.waitForFunction(() => '__parity' in globalThis);
  const cases = ((await page.evaluate(() => (globalThis as any).__parity.cases())) as CaseInfo[]).filter((c) => c.exportable);
  expect(cases.length).toBeGreaterThan(0);

  // Emptied, not removed: Windows refuses to remove a folder that is open in Explorer or a terminal.
  mkdirSync(OUT, { recursive: true });
  // The drafts of generated pictures (npm run visuals:generate) live in a folder of their own here, and stay.
  for (const name of readdirSync(OUT)) if (name !== 'generated') rmSync(join(OUT, name), { recursive: true, force: true });
  const files: { path: string; bytes: number; sha256: string }[] = [];
  const save = (name: string, data: Buffer) => {
    writeFileSync(join(OUT, name), data);
    const f = { path: name, ...facts(data) };
    files.push(f);
    return f;
  };
  const entries: AssetEntry[] = [];
  const text: Record<string, string> = {};

  for (const c of cases) {
    const made: Record<string, { path: string; bytes: number; sha256: string }> = {};
    let what: Facts | null = null;
    for (const scheme of ['light', 'dark'] as const) {
      const [svg, png, png2, f] = (await page.evaluate(
        async ([key, s]) => {
          const api = (globalThis as any).__parity;
          return [api.exportSvg(key, s), await api.exportPng(key, s, 1), await api.exportPng(key, s, 2), api.exportFacts(key, s)];
        },
        [c.key, scheme] as const,
      )) as [string, string, string, Facts];
      what = f;
      made[scheme] = save(`${c.key}.${scheme}.svg`, Buffer.from(svg, 'utf8'));
      save(`${c.key}.${scheme}.png`, Buffer.from(png, 'base64'));
      save(`${c.key}.${scheme}@2x.png`, Buffer.from(png2, 'base64'));
    }
    const alt = `asset.${c.key}`;
    text[alt] = what!.alt;
    // A draft entry in the manifest's own shape, with the path the files would have once adopted.
    entries.push({
      id: c.key,
      version: 1,
      files: {
        light: { ...made['light'], path: `visuals/${made['light'].path}` },
        dark: { ...made['dark'], path: `visuals/${made['dark'].path}` },
      },
      width: c.width,
      height: c.height,
      alt,
      origin: { kind: 'exported', composition: what!.id, version: what!.version, ...(what!.state ? { state: what!.state } : {}), theme: what!.theme, themeVersion: what!.themeVersion, ...(what!.seed ? { seed: what!.seed } : {}) },
      licence: 'Project-owned',
      status: 'draft',
    });
  }
  // Every draft entry passes the manifest's own checks against the files just written.
  const written = new Map(files.map((f) => [`visuals/${f.path}`, f]));
  expect(catalogueProblems(entries, (path) => written.get(path) ?? null, (key) => text[key])).toEqual([]);
  writeFileSync(join(OUT, 'manifest.draft.json'), JSON.stringify({ exporter: 'visual-system.svg-export.v1', entries, text, files }, null, 2) + '\n');
  console.log(`Exported ${cases.length} compositions (${files.length} files) to ${OUT}`);
});
