import { AssetSource } from '../integration/asset-source';
import { fileFacts, listSources } from '../testing/source-files';
import { ASSETS, assetText } from './catalogue';
import { AssetEntry, FileFacts, assetProblems, assetVisualId, catalogueProblems } from './manifest';

const SHA = 'a'.repeat(64);
const file = (path: string) => ({ path, bytes: 100, sha256: SHA });
const entry = (over: Partial<AssetEntry> = {}): AssetEntry => ({
  id: 'test.asset',
  version: 2,
  files: { light: file('visuals/test/a-light.svg'), dark: file('visuals/test/a-dark.svg') },
  width: 480,
  height: 120,
  alt: 'alt',
  origin: { kind: 'authored', author: 'A person' },
  licence: 'Project-owned',
  status: 'approved',
  review: { by: 'A reviewer', on: '2026-11-12' },
  ...over,
});
const there = (): FileFacts => ({ bytes: 100, sha256: SHA });
const text = (key: string) => ({ alt: 'A picture of a test.' })[key];

describe('S8 the asset manifest (M7)', () => {
  it('accepts a complete entry whose files match', () => {
    expect(assetProblems(entry(), there, text)).toEqual([]);
    expect(assetVisualId(entry())).toBe('asset:test.asset@2');
  });

  it('checks every file: there, the same size, the same checksum', () => {
    expect(assetProblems(entry(), () => null, text)).toEqual([
      "asset 'test.asset', light file: 'visuals/test/a-light.svg' isn't there",
      "asset 'test.asset', dark file: 'visuals/test/a-dark.svg' isn't there",
    ]);
    expect(assetProblems(entry(), () => ({ bytes: 101, sha256: 'b'.repeat(64) }), text).slice(0, 2)).toEqual([
      "asset 'test.asset', light file: 101 bytes, the manifest says 100",
      "asset 'test.asset', light file: its checksum isn't the manifest's; a changed file is a new version",
    ]);
    expect(assetProblems(entry({ files: { light: file('../secrets.svg'), dark: file('visuals/x.gif') } }), there, text)).toEqual([
      "asset 'test.asset', light file: a path is under 'visuals/', lower case, ending .svg or .png",
      "asset 'test.asset', dark file: a path is under 'visuals/', lower case, ending .svg or .png",
    ]);
  });

  it('asks for an id, a version, a size, a text alternative and a licence', () => {
    expect(assetProblems(entry({ id: 'Bad Id', version: 0, width: 0, alt: 'missing', licence: ' ' }), there, text)).toEqual([
      "asset 'Bad Id': an id is lower-case words joined by dots or hyphens",
      "asset 'Bad Id': a version is a whole number from 1",
      "asset 'Bad Id': it has a size",
      "asset 'Bad Id': no content for its text alternative 'missing'",
      "asset 'Bad Id': no licence",
    ]);
  });

  it('asks each origin for what makes the asset traceable', () => {
    expect(assetProblems(entry({ origin: { kind: 'exported', composition: 'mcii.path', version: 4, theme: 'action', themeVersion: 1 } }), there, text)).toEqual([]);
    expect(assetProblems(entry({ origin: { kind: 'exported', composition: '', version: 4, theme: 'action', themeVersion: 1 } }), there, text)).toEqual([
      "asset 'test.asset': an exported asset names its composition, theme and their versions",
    ]);
    expect(assetProblems(entry({ origin: { kind: 'authored', author: '' } }), there, text)).toEqual(["asset 'test.asset': an authored asset names its author"]);
  });

  it('keeps the brief of a generated asset to words from the fixed lists, never typed text', () => {
    const generated = (brief: Record<string, string>) => entry({ origin: { kind: 'generated', provider: 'test-provider', brief } });
    expect(assetProblems(generated({ area: 'action', frame: 'banner', subject: 'path' }), there, text)).toEqual([]);
    expect(assetProblems(generated({ area: 'action', frame: 'banner', subject: 'A long sentence someone typed.' }), there, text)).toEqual([
      "asset 'test.asset': a brief holds words from the fixed lists only, never typed text ('A long sentence someone typed.' isn't a listed subject (path, horizon, stones))",
    ]);
    expect(assetProblems(generated({}), there, text)).toEqual(["asset 'test.asset': a generated asset keeps its brief"]);
  });

  it('asks an approved asset who reviewed it and when', () => {
    expect(assetProblems(entry({ review: undefined }), there, text)).toEqual(["asset 'test.asset': an approved asset says who reviewed it and when"]);
    expect(assetProblems(entry({ status: 'draft', review: undefined }), there, text)).toEqual([]);
  });

  it('flags an id or a file used twice in a catalogue', () => {
    const other = entry({ id: 'test.other' });
    expect(catalogueProblems([entry(), entry(), other], there, text)).toEqual([
      "asset 'test.asset': its id is used 2 times",
      "asset 'test.other': 'visuals/test/a-light.svg' already belongs to 'test.asset'",
      "asset 'test.other': 'visuals/test/a-dark.svg' already belongs to 'test.asset'",
    ]);
  });
});

describe('the platform catalogue (M7)', () => {
  it('matches the files in public/visuals, byte for byte', async () => {
    const facts = new Map<string, FileFacts | null>();
    for (const e of ASSETS) for (const f of [e.files.light, e.files.dark]) facts.set(f.path, await fileFacts(`public/${f.path}`));
    expect(catalogueProblems(ASSETS, (path) => facts.get(path) ?? null, assetText)).toEqual([]);
  });

  it('has an entry for every file in public/visuals: no file without a record', async () => {
    const known = new Set(ASSETS.flatMap((e) => [e.files.light.path, e.files.dark.path]));
    const files = (await listSources('public/visuals')).filter((p) => /\.(svg|png)$/.test(p)).map((p) => p.replace(/^public\//, ''));
    expect(files.filter((f) => !known.has(f))).toEqual([]);
  });
});

describe('the asset source (M7)', () => {
  const approved = entry();
  const source = (entries: AssetEntry[], id = 'test.asset') => new AssetSource(id, 'exercise.step', entries, text);

  it('serves an approved asset through the image contract, and says exactly what it served', async () => {
    const s = source([approved]);
    expect(s.id).toBe('asset:test.asset');
    expect(await s.resolve({ scene: 'exercise.step' })).toEqual({
      kind: 'image',
      src: 'visuals/test/a-light.svg',
      srcDark: 'visuals/test/a-dark.svg',
      alt: 'A picture of a test.',
      width: 480,
      height: 120,
    });
    expect(s.id).toBe('asset:test.asset@2');
  });

  it('shows nothing for a draft, an unknown asset or another request, and records no version', async () => {
    for (const s of [source([entry({ status: 'draft', review: undefined })]), source([approved], 'test.unknown')]) {
      expect(await s.resolve({ scene: 'exercise.step' })).toEqual({ kind: 'none' });
      expect(s.id).not.toContain('@');
    }
    expect(await source([approved]).resolve({ scene: 'exercise.other' })).toEqual({ kind: 'none' });
  });

  it('gives one file for both schemes when the asset has one', async () => {
    const one = entry({ files: { light: file('visuals/test/a.png'), dark: file('visuals/test/a.png') } });
    expect(await source([one]).resolve({ scene: 'exercise.step' })).not.toHaveProperty('srcDark');
  });
});
