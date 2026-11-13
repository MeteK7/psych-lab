import { fileFacts, listSources, readSource } from '../testing/source-files';
import { FRAMES, THEMES } from '../styling/vocabulary';
import { BRIEF_VOCABULARY, briefProblems } from './brief';
import { Candidate, ImageProvider, candidateProblems, generateDrafts } from './generate';
import { catalogueProblems } from './manifest';
import { isPng, svgProblems } from './svg-safety';

const bytes = (text: string) => new TextEncoder().encode(text);
const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 120" width="480" height="120"><circle cx="240" cy="60" r="20" fill="#3766c7"/></svg>\n';
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);

const picture = (over: Partial<Candidate> = {}): Candidate => ({ format: 'svg', width: 480, height: 120, light: bytes(SVG), dark: bytes(SVG.replace('#3766c7', '#a0c1ff')), ...over });
/** A provider for tests: a fixed picture, no network. */
const provider = (give: readonly Candidate[] = [picture()], seen: unknown[] = []): ImageProvider => ({
  id: 'test-provider',
  licence: 'Project-owned',
  generate: async (request) => {
    seen.push(request);
    return give;
  },
});
const request = { id: 'test.generated', brief: { area: 'action', frame: 'banner', subject: 'path' }, seed: 'lab-1', alt: 'asset.test.generated' };

describe('S8 the brief: fixed lists, never typed text (M7 stage C)', () => {
  it('accepts one listed word per field', () => {
    expect(briefProblems(request.brief)).toEqual([]);
  });

  it('refuses a sentence, an unlisted word, a missing field and an extra field', () => {
    expect(briefProblems({ area: 'action', frame: 'banner', subject: 'A calm path through a forest at dawn, in the style of a painting' })).toEqual([
      "'A calm path through a forest at dawn, in' isn't a listed subject (path, horizon, stones)",
    ]);
    expect(briefProblems({ area: 'action', frame: 'banner' })).toEqual(['a brief says its subject']);
    expect(briefProblems({ ...request.brief, prompt: 'anything' })).toEqual(["a brief has no field 'prompt'"]);
    expect(briefProblems({ ...request.brief, subject: 7 })[0]).toMatch(/isn't a listed subject/);
  });

  it('lists the areas and frames the visual language has', () => {
    expect([...BRIEF_VOCABULARY.area]).toEqual(Object.keys(THEMES));
    expect([...BRIEF_VOCABULARY.frame]).toEqual(Object.keys(FRAMES));
  });
});

describe('S8 a file from outside is distrusted (M7 stage C)', () => {
  it('accepts a plain, self-contained SVG, with references inside itself', () => {
    expect(svgProblems(SVG)).toEqual([]);
    expect(svgProblems('<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"/></defs><path d="M0 0" fill="url(#g)"/></svg>')).toEqual([]);
  });

  it('refuses anything that runs or fetches', () => {
    const svg = (inner: string, attrs = '') => `<svg xmlns="http://www.w3.org/2000/svg"${attrs}>${inner}</svg>`;
    expect(svgProblems(svg('<script>alert(1)</script>'))).toEqual(['it has a script']);
    expect(svgProblems(svg('<circle r="1" onclick="x()"/>'))).toEqual(['it has an event handler']);
    expect(svgProblems(svg('', ' onload="x()"'))).toEqual(['it has an event handler']);
    expect(svgProblems(svg('<foreignObject><div/></foreignObject>'))).toEqual(['it has embedded content']);
    expect(svgProblems(svg('<image href="https://example.com/a.png"/>'))).toEqual(['it has an embedded image', 'it refers to something outside itself', 'it names a web address']);
    expect(svgProblems(svg('<use href="other.svg#a"/>'))).toEqual(['it refers to something outside itself']);
    expect(svgProblems(svg('<path fill="url(https://example.com/p)"/>'))).toEqual(['it refers to something outside itself', 'it names a web address']);
    expect(svgProblems(svg('<style>@import "a.css";</style>'))).toEqual(['it has an imported stylesheet']);
    expect(svgProblems(svg('<a href="javascript:x()"><circle r="1"/></a>'))).toEqual(['it has a javascript link', 'it has a link or an animation', 'it refers to something outside itself']);
    expect(svgProblems('<!DOCTYPE svg [<!ENTITY x "y">]>' + svg(''))).toContain('it has a DOCTYPE or an entity');
    expect(svgProblems('<html><svg/></html>')).toContain("it isn't one SVG element");
    expect(svgProblems('<svg><circle r="1"/></svg>')).toEqual(['it lacks the SVG namespace']);
  });

  it('knows a PNG by its first bytes', () => {
    expect(isPng(PNG)).toBe(true);
    expect(isPng(bytes(SVG))).toBe(false);
  });

  it('bounds what a provider gives back', () => {
    expect(candidateProblems(picture())).toEqual([]);
    expect(candidateProblems(picture({ format: 'png', light: PNG, dark: PNG }))).toEqual([]);
    expect(candidateProblems(picture({ width: 99999, dark: new Uint8Array() }))).toEqual(['its size is whole numbers up to 4096', 'its dark file is empty']);
    expect(candidateProblems(picture({ format: 'png' }))).toEqual(["its light file isn't a PNG", "its dark file isn't a PNG"]);
    expect(candidateProblems(picture({ light: bytes(SVG.replace('<circle', '<script/><circle')) }))).toEqual(['its light file: it has a script']);
    expect(candidateProblems(picture({ light: new Uint8Array([0xff, 0xfe, 0xfd]) }))).toEqual(["its light file isn't text"]);
  });
});

describe('S8 the generation path, closed by default (M7 stage C)', () => {
  it('does nothing without a provider, and says why', async () => {
    await expect(generateDrafts(undefined, request)).rejects.toThrow(/^No provider is configured: generated images are off/);
  });

  it('turns what a provider makes into a draft asset with its provider, brief and seed on record', async () => {
    const seen: unknown[] = [];
    const [draft, ...rest] = await generateDrafts(provider([picture()], seen), request);
    expect(rest).toEqual([]);
    // The provider got the brief and the seed, and nothing else.
    expect(seen).toEqual([{ brief: request.brief, seed: 'lab-1' }]);
    expect(draft.entry).toMatchObject({
      id: 'test.generated',
      version: 1,
      status: 'draft',
      origin: { kind: 'generated', provider: 'test-provider', brief: request.brief, seed: 'lab-1' },
      licence: 'Project-owned',
      files: { light: { path: 'visuals/generated/test.generated.light.svg', bytes: SVG.length }, dark: { path: 'visuals/generated/test.generated.dark.svg' } },
    });
    expect(draft.entry.review).toBeUndefined();
    expect(draft.files.map((f) => f.path)).toEqual(['visuals/generated/test.generated.light.svg', 'visuals/generated/test.generated.dark.svg']);
    // The draft passes the manifest's own checks against the files it comes with.
    const facts = new Map(draft.files.map((f) => [f.path, f.data.length]));
    const found = (path: string) => {
      const file = [draft.entry.files.light, draft.entry.files.dark].find((x) => x.path === path);
      return file && facts.has(path) ? { bytes: facts.get(path)!, sha256: file.sha256 } : null;
    };
    expect(catalogueProblems([draft.entry], found, () => 'A generated picture.')).toEqual([]);
    expect(draft.entry.files.light.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('never approves: every picture is a draft, however many come back', async () => {
    const drafts = await generateDrafts(provider([picture(), picture(), picture()]), request);
    expect(drafts.map((d) => [d.entry.id, d.entry.status])).toEqual([
      ['test.generated', 'draft'],
      ['test.generated-2', 'draft'],
      ['test.generated-3', 'draft'],
    ]);
  });

  it('refuses typed text in a brief before the provider is asked', async () => {
    const seen: unknown[] = [];
    await expect(generateDrafts(provider([picture()], seen), { ...request, brief: { ...request.brief, subject: 'my own sentence about my wish' } })).rejects.toThrow(
      /^The brief isn't from the lists: 'my own sentence about my wish' isn't a listed subject/,
    );
    expect(seen).toEqual([]);
  });

  it('refuses a picture that isn’t safe to keep, a provider that gives nothing, and one without an id or a licence', async () => {
    await expect(generateDrafts(provider([picture({ light: bytes(SVG.replace('<circle', '<script/><circle')) })]), request)).rejects.toThrow(
      "Picture 1 made by 'test-provider' can't be kept: its light file: it has a script.",
    );
    await expect(generateDrafts(provider([]), request)).rejects.toThrow("Provider 'test-provider' gave nothing back.");
    await expect(generateDrafts({ ...provider(), id: 'Some Provider' }, request)).rejects.toThrow(/^A provider has an id/);
    await expect(generateDrafts({ ...provider(), licence: ' ' }, request)).rejects.toThrow(/^A provider has an id/);
    await expect(generateDrafts(provider(), { ...request, seed: 'A typed seed!' })).rejects.toThrow(/^A seed is/);
  });
});

describe('the platform catalogue: every SVG is a plain picture (M7 stage C)', () => {
  it('has no SVG in public/visuals that runs or fetches anything', async () => {
    const files = (await listSources('public/visuals')).filter((p) => p.endsWith('.svg'));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(svgProblems(await readSource(file)), file).toEqual([]);
      expect(await fileFacts(file)).not.toBeNull();
    }
  });
});
