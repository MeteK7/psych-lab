import { GENERATORS } from '../../shared/visual/generation/registry';
import { INSTRUMENTS } from '../../shared/visual/integration/instruments';
import { SCENES } from '../../shared/visual/scenes';
import { COLOR_ROLES, DASHES, EXIT_EFFECTS, FRAMES, LABEL_SIZES, LINE_WEIGHTS, MATERIALS, MOTION_EFFECTS, THEMES } from '../../shared/visual/styling/vocabulary';
import { fileFacts, listSources, readSource } from '../../shared/visual/testing/source-files';
import { CATALOG, SECTIONS } from './lab-catalog-data';

const capabilities = CATALOG.flatMap((s) => s.capabilities.map((c) => ({ ...c, subsystem: s.id })));
const covered = new Set(capabilities.flatMap((c) => c.covers ?? []));

/** Everything the system has by name, as the catalog names it. */
async function everything(): Promise<string[]> {
  const layouts = [...(await readSource('src/app/shared/visual/generation/layouts.ts')).matchAll(/^export function (\w+)/gm)].map((m) => m[1]);
  const backends = (await listSources('src/app/shared/visual/rendering')).flatMap((p) => p.match(/^src\/app\/shared\/visual\/rendering\/(svg|canvas)\/\1-backend\.ts$/)?.[1] ?? []);
  return [
    ...Object.keys(GENERATORS).map((n) => `generator:${n}`),
    ...layouts.map((n) => `layout:${n}`),
    ...MATERIALS.map((n) => `material:${n}`),
    ...Object.keys(LINE_WEIGHTS).map((n) => `line:${n}`),
    ...Object.keys(DASHES).map((n) => `dash:${n}`),
    ...Object.keys(MOTION_EFFECTS).map((n) => `enter:${n}`),
    ...Object.keys(EXIT_EFFECTS).map((n) => `exit:${n}`),
    ...Object.keys(FRAMES).map((n) => `frame:${n}`),
    ...Object.keys(THEMES).map((n) => `theme:${n}`),
    ...COLOR_ROLES.map((n) => `role:${n}`),
    ...Object.keys(LABEL_SIZES).map((n) => `tone:${n}`),
    ...SCENES.map((s) => `scene:${s.scene.id}`),
    ...Object.keys(INSTRUMENTS).map((n) => `instrument:${n}`),
    ...backends.map((n) => `backend:${n}`),
  ];
}

describe('the Visual System catalog (M8)', () => {
  it('covers everything the system has by name: nothing exists outside the catalog', async () => {
    const all = await everything();
    expect(all.length).toBeGreaterThan(50);
    expect(all.filter((name) => !covered.has(name))).toEqual([]);
  });

  it('claims nothing the system doesn’t have', async () => {
    const all = new Set(await everything());
    expect([...covered].filter((name) => !all.has(name))).toEqual([]);
  });

  it('names each thing once', () => {
    const names = capabilities.flatMap((c) => c.covers ?? []);
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
    const titles = capabilities.map((c) => c.name);
    expect(titles.filter((n, i) => titles.indexOf(n) !== i)).toEqual([]);
  });

  it('points only at tests that exist', async () => {
    const files = [...new Set(capabilities.flatMap((c) => c.tests))];
    for (const c of capabilities) expect(c.tests.length, c.name).toBeGreaterThan(0);
    for (const file of files) expect(await fileFacts(file), file).not.toBeNull();
  });

  it('points only at places the Lab has', async () => {
    const lab = (await Promise.all((await listSources('src/app/pages/lab')).filter((p) => p.endsWith('.ts') && !p.endsWith('.spec.ts')).map((p) => readSource(p)))).join('\n');
    const routes = await readSource('src/app/app.routes.ts');
    // A scene's heading gets its id from the scene's own id.
    const sceneAnchors = new Set(SCENES.map((s) => `lab-${s.scene.id.replace(/\W/g, '-')}`));
    for (const where of [...SECTIONS, ...capabilities.map((c) => c.where)]) {
      if ('route' in where) expect(routes, where.route).toContain(`path: '${where.route.slice(1)}'`);
      else expect(sceneAnchors.has(where.anchor) || lab.includes(`id="${where.anchor}"`), where.anchor).toBe(true);
    }
  });

  it('lists every section of the Lab page in its contents', async () => {
    const lab = (await Promise.all((await listSources('src/app/pages/lab')).filter((p) => p.endsWith('.ts') && !p.endsWith('.spec.ts') && !p.includes('parity')).map((p) => readSource(p)))).join('\n');
    const ids = [...lab.matchAll(/<h[23] id="(lab-[a-z-]+)"/g)].map((m) => m[1]);
    const listed = new Set(SECTIONS.flatMap((s) => ('anchor' in s ? [s.anchor] : [])));
    expect(ids.length).toBeGreaterThan(8);
    expect(ids.filter((id) => !listed.has(id))).toEqual([]);
  });

  it('has a row for each of the eleven subsystems', () => {
    expect(CATALOG.map((s) => s.id)).toEqual(['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11']);
    for (const s of CATALOG) expect(s.capabilities.length, s.id).toBeGreaterThan(0);
  });
});
