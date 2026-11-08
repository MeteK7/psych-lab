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

  it('4c. instruments import only composition types, styling and the resolved-frame types: no Angular, no backend', () => {
    const files = inFolder('instruments');
    expect(outside(files, ['instruments', 'composition', 'styling', 'rendering'])).toEqual([]);
    const reaches = files.flatMap(({ path, imports }) =>
      imports.filter((i) => area(i) === 'rendering' && i !== `${ROOT}/rendering/frame`).map((i) => `${path} imports ${i}`),
    );
    expect(reaches).toEqual([]);
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
});
