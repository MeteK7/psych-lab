import { audit } from '../../pages/lab/study/pass-c-audit';
import { ASKS, COMMITMENTS, PREDICATES, STANCES } from './representation/contract';
import { PINNED_DEEP_IMPORTS } from './testing/pinned-deep-imports';
import { listSources, readSource } from './testing/source-files';

/**
 * The Visual System's dependency rules (docs/visual-system.md §3.4), checked on the source. They
 * keep the six core capabilities independent and stop exercises from growing private renderers.
 */
const ROOT = 'src/app/shared/visual';
const APP = 'src/app';

interface Source {
  path: string;
  imports: string[];
}

function resolveImport(from: string, spec: string): string {
  if (!spec.startsWith('.')) return spec;
  const parts = from.split('/').slice(0, -1);
  for (const p of spec.split('/')) {
    if (p === '..') parts.pop();
    else if (p !== '.') parts.push(p);
  }
  return parts.join('/');
}

async function sources(folder: string): Promise<Source[]> {
  const files = (await listSources(folder)).filter((p) => p.endsWith('.ts') && !p.endsWith('.spec.ts'));
  return Promise.all(
    files.map(async (path) => {
      const code = await readSource(path);
      const specs = [...code.matchAll(/(?:from|import)\s*\(?\s*'([^']+)'/g)].map((m) => m[1]);
      return { path, imports: specs.map((s) => resolveImport(path, s)) };
    }),
  );
}

/** Which Visual System folder a resolved import points into, or the import itself. */
function area(target: string): string {
  return target.startsWith(`${ROOT}/`) ? target.slice(ROOT.length + 1).split('/')[0] : target;
}

function outside(files: Source[], allowed: string[]): string[] {
  return files.flatMap(({ path, imports }) =>
    imports.filter((i) => !allowed.includes(area(i))).map((i) => `${path} imports ${i}`),
  );
}

let visual: Source[] = [];
let app: Source[] = [];
beforeAll(async () => {
  visual = await sources(ROOT);
  app = await sources(APP);
});

const inFolder = (name: string) => visual.filter((s) => s.path.startsWith(`${ROOT}/${name}/`));

describe('Visual System dependency rules', () => {
  it('1. generation imports nothing outside itself: no Angular, no DOM, no other capability', () => {
    // The folder exists only while a composition uses a generator (the pull rule).
    expect(outside(inFolder('generation'), ['generation'])).toEqual([]);
  });

  it('2. styling imports only itself', () => {
    expect(outside(inFolder('styling'), ['styling'])).toEqual([]);
  });

  it('3. composition imports only styling vocabulary and generator ids', () => {
    expect(outside(inFolder('composition'), ['composition', 'styling', 'generation'])).toEqual([]);
  });

  it('4. state imports only composition and styling types', () => {
    expect(outside(inFolder('state'), ['state', 'composition', 'styling'])).toEqual([]);
  });

  it('4b. motion imports only composition and state types and the styling tokens', () => {
    expect(outside(inFolder('motion'), ['motion', 'state', 'composition', 'styling'])).toEqual([]);
  });

  it('4c. instruments are compositions built from data: they import only composition, styling and generation (no Angular, no rendering)', () => {
    expect(outside(inFolder('instruments'), ['instruments', 'composition', 'styling', 'generation'])).toEqual([]);
  });

  it('4d. interaction maps input to values, purely: it imports only composition, styling and generation (no Angular, no DOM, no rendering)', () => {
    expect(outside(inFolder('interaction'), ['interaction', 'composition', 'styling', 'generation'])).toEqual([]);
  });

  it('4e. stimuli are pure: they import only S1 colours, S2 seeded randomness and the frame types (no Angular, no DOM, no backend)', () => {
    const files = inFolder('stimulus');
    const bad = files.flatMap(({ path, imports }) =>
      imports.filter((i) => !['stimulus', 'styling', 'generation'].includes(area(i)) && i !== `${ROOT}/rendering/frame`).map((i) => `${path} imports ${i}`),
    );
    expect(bad).toEqual([]);
  });

  it('4f. the asset manifest is pure data and checks: it imports only itself (no Angular, no DOM, no file access)', () => {
    expect(outside(inFolder('assets'), ['assets'])).toEqual([]);
  });

  it('4g. the app never reaches the generation path: nothing in it imports assets/generate or the authoring tools', () => {
    // Only the authoring script (web/tools/visual-generate) runs a provider, so no session can.
    const users = app.flatMap(({ path, imports }) => imports.filter((i) => i === `${ROOT}/assets/generate` || i.startsWith('tools/')).map((i) => `${path} imports ${i}`));
    expect(users).toEqual([]);
  });

  it('5. rendering imports only itself and Angular, and only integration imports a backend', () => {
    expect(outside(inFolder('rendering'), ['rendering', '@angular/core'])).toEqual([]);
    const users = app
      .filter((s) => !s.path.startsWith(`${ROOT}/rendering/`))
      .flatMap(({ path, imports }) =>
        imports.filter((i) => i.startsWith(`${ROOT}/rendering/`) && i !== `${ROOT}/rendering/frame`).map(() => path),
      );
    expect(users.every((p) => p.startsWith(`${ROOT}/integration/`)), users.join(', ')).toBe(true);
  });

  it('6. exercises use only the contract, the slot and integration', () => {
    const exercises = app.filter((s) => s.path.startsWith(`${APP}/experiences/`));
    const reaches = exercises.flatMap(({ path, imports }) =>
      imports
        .filter((i) => i.startsWith(`${ROOT}/`))
        .filter((i) => ![`${ROOT}/visual`, `${ROOT}/visual-slot`].includes(i) && area(i) !== 'integration')
        .map((i) => `${path} imports ${i}`),
    );
    expect(reaches).toEqual([]);
  });

  it('7. exercise logic and stores import nothing from the Visual System', () => {
    const core = app.filter((s) => /-(logic|store)\.ts$/.test(s.path));
    expect(core).not.toHaveLength(0);
    expect(core.flatMap(({ path, imports }) => imports.filter((i) => i.startsWith(`${ROOT}/`)).map((i) => `${path} imports ${i}`))).toEqual([]);
  });

  it('9. every figure is drawn through the Visual System: no exercise or page draws its own (M8)', async () => {
    // Outside the Visual Lab, which is the system's own tooling. Icons (shared/icon.ts) are outside scope.
    const files = (await Promise.all([listSources(`${APP}/experiences`), listSources(`${APP}/pages`)]))
      .flat()
      .filter((p) => /\.(ts|html)$/.test(p) && !p.endsWith('.spec.ts') && !p.startsWith(`${APP}/pages/lab/`));
    expect(files.length).toBeGreaterThan(10);
    const drawing: string[] = [];
    const canvases: string[] = [];
    const DRAWS = /<(svg|path|circle|rect)[\s>]|getContext\(|new Path2D|createElementNS/;
    const CANVAS = /<canvas[\s>]/;
    // The patterns work: they find a drawing and a canvas in text that has them.
    expect([DRAWS.test('<svg viewBox="0 0 1 1">'), DRAWS.test('ctx = c.getContext("2d")'), CANVAS.test('<canvas\n #c>'), DRAWS.test('<section>')]).toEqual([true, true, true, false]);
    for (const path of files) {
      const code = await readSource(path);
      if (DRAWS.test(code)) drawing.push(path);
      if (CANVAS.test(code)) canvases.push(path);
    }
    expect(drawing).toEqual([]);
    // The one canvas an exercise owns is the dot game's, and the system's own surface draws on it.
    expect(canvases).toEqual([`${APP}/experiences/state-reset/tracking-game.ts`]);
    expect(await readSource(canvases[0])).toContain("from '../../shared/visual/integration/tracking'");
  });

  it('10. code outside the engine reaches it through its entry points (index.ts, start.ts); deep imports only as pinned, a list that may only shrink (Stage 3, M0)', () => {
    const entry = [ROOT, `${ROOT}/index`, `${ROOT}/start`];
    const deep = [
      ...new Set(
        app
          .filter((s) => !s.path.startsWith(`${ROOT}/`))
          .flatMap(({ path, imports }) => imports.filter((i) => i.startsWith(`${ROOT}/`) && !entry.includes(i)).map((i) => `${path} -> ${i.slice(ROOT.length + 1)}`)),
      ),
    ].sort();
    // A new deep import fails here: import from `shared/visual` (or `shared/visual/start`) instead.
    expect(deep.filter((d) => !PINNED_DEEP_IMPORTS.includes(d))).toEqual([]);
    // A pinned import that no longer exists fails here too: take it off the list, so it only shrinks.
    expect(PINNED_DEEP_IMPORTS.filter((d) => !deep.includes(d))).toEqual([]);
  });

  it('12a. representation (S12) imports only composition, styling, generation and itself: no Angular, no DOM, no backend, nothing from the app (Stage 3, M1)', () => {
    const files = inFolder('representation');
    expect(files.length).toBeGreaterThan(0);
    expect(outside(files, ['representation', 'composition', 'styling', 'generation'])).toEqual([]);
  });

  it('12b. nothing else in the engine imports representation (S12): it sits above S1–S11', () => {
    const others = visual.filter((s) => !s.path.startsWith(`${ROOT}/representation/`) && s.path !== `${ROOT}/index.ts`);
    expect(others.flatMap(({ path, imports }) => imports.filter((i) => area(i) === 'representation').map((i) => `${path} imports ${i}`))).toEqual([]);
  });

  it('12d. representation (S12) names no domain: no case id and no word of the study corpus in its code (the pass C audit)', async () => {
    const files = Object.fromEntries(await Promise.all(inFolder('representation').map(async (s) => [s.path, await readSource(s.path)] as const)));
    // Comments may cite the study's findings by name (G-17, P1 …); the audit strips them and reads only code.
    // The contract's own vocabulary (stances, question kinds, commitments, predicates) is structure, not a domain.
    const vocabulary = new Set<string>([...STANCES, ...ASKS, ...COMMITMENTS, ...Object.keys(PREDICATES)]);
    // Plain words, allowed in their plain sense only (Stage 3 M3, the user's decision; proposal §14):
    // `other`, `left` and `right` as contrasts and directions (pass C treats them as generic), `room` as
    // space, `meeting` as two things meeting, `land` as coming to rest. A plain word used to name a
    // domain thing is still a finding. The list may only shrink: a word no longer used fails.
    const plain = ['other', 'left', 'right', 'room', 'meeting', 'land'];
    const hits = audit(files).filter((h) => !vocabulary.has(h.word));
    expect(hits.filter((h) => !plain.includes(h.word)).map((h) => `${h.file}:${h.line} ${h.word} (${h.where})`)).toEqual([]);
    expect(plain.filter((w) => !hits.some((h) => h.word === w))).toEqual([]);
  });

  it('10b. the start-up entry point holds no component, so the initial bundle stays small', () => {
    const start = visual.find((s) => s.path === `${ROOT}/start.ts`)!;
    expect(start.imports.map((i) => area(i)).sort()).toEqual(['integration', 'styling']);
    const reached = visual.filter((s) => start.imports.includes(s.path.replace(/\.ts$/, '')));
    expect(reached.length).toBe(2);
    expect(reached.flatMap((s) => s.imports).filter((i) => i.startsWith('@angular'))).toEqual([]);
  });
});

