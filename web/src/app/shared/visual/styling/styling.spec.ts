import { readSource } from '../testing/source-files';
import { resolveFocus, resolveLabel, resolveStyle } from './resolve';
import { THEMES, ThemeId } from './vocabulary';

describe('resolveStyle', () => {
  it('draws a line in the role colour at the role weight', () => {
    expect(resolveStyle({ role: 'subject' })).toEqual({ fill: 'none', stroke: 'var(--vis-subject)', width: 2.5, dash: null });
    expect(resolveStyle({ role: 'far' }).width).toBe(1);
  });

  it('fills tonal elements and edges planes', () => {
    expect(resolveStyle({ role: 'near', material: 'tonal' })).toMatchObject({ fill: 'var(--vis-near)', stroke: 'var(--vis-near-edge)' });
    expect(resolveStyle({ role: 'subject', material: 'tonal' })).toMatchObject({ fill: 'var(--vis-subject-fill)', stroke: 'var(--vis-subject)' });
    expect(resolveStyle({ role: 'ground', material: 'tonal' })).toMatchObject({ fill: 'var(--vis-ground)', stroke: 'none', width: 0 });
  });

  it('makes focal one step heavier, with Highlight under forced colours', () => {
    expect(resolveStyle({ role: 'subject' }, 'focal')).toMatchObject({ width: 3, stroke: 'var(--vis-focal, var(--vis-subject))' });
  });

  it('recedes to the neutral step, one weight lighter, instead of fading', () => {
    const p = resolveStyle({ role: 'subject', material: 'tonal' }, 'receded');
    expect(p).toEqual({ fill: 'var(--vis-receded-fill)', stroke: 'var(--vis-receded)', width: 2, dash: null });
  });

  it('fills solid marks in the line colour, with no stroke, following emphasis', () => {
    expect(resolveStyle({ role: 'subject', material: 'solid' })).toEqual({ fill: 'var(--vis-subject)', stroke: 'none', width: 0, dash: null });
    expect(resolveStyle({ role: 'subject', material: 'solid' }, 'receded').fill).toBe('var(--vis-receded)');
    expect(resolveStyle({ role: 'subject', material: 'solid' }, 'focal').fill).toBe('var(--vis-focal, var(--vis-subject))');
  });

  it('recedes neutral context lines by weight only, so they never get darker', () => {
    expect(resolveStyle({ role: 'context' }, 'receded')).toEqual({ fill: 'none', stroke: 'var(--vis-context)', width: 1.5, dash: null });
  });

  it('turns dashes into their patterns', () => {
    expect(resolveStyle({ role: 'ink', dash: 'intended' }).dash).toBe('7 7');
  });

  it('draws the focus ring in the focus token, at its own width whatever the emphasis', () => {
    expect(resolveFocus()).toEqual({ fill: 'none', stroke: 'var(--vis-focus)', width: 2, dash: null });
  });

  it('gives labels their tone and size', () => {
    expect(resolveLabel()).toEqual({ fill: 'var(--vis-label)', size: 14 });
    expect(resolveLabel('label-soft')).toEqual({ fill: 'var(--vis-label-soft)', size: 13 });
  });
});

// ── Contrast, computed from tokens.css (docs/visual-language.md §3.5) ──────────────────────────
let CSS = '';
beforeAll(async () => {
  CSS = await readSource('src/app/shared/visual/styling/tokens.css');
});
const PAGE = {
  light: { '--bg': '#ffffff', '--text': '#1c1c1e', '--muted': '#55575d', '--accent': '#2457c5' },
  dark: { '--bg': '#17181b', '--text': '#ececef', '--muted': '#a9abb2', '--accent': '#8fb0ff' },
};

function declarations(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}
function blockAfter(selector: string): string {
  const start = CSS.indexOf(selector);
  if (start < 0) throw new Error(`tokens.css has no ${selector}`);
  const open = CSS.indexOf('{', start);
  return CSS.slice(open + 1, CSS.indexOf('}', open));
}
/** Every --vis- token as a hex value, for a theme and scheme. */
function tokens(theme: ThemeId, scheme: 'light' | 'dark'): Record<string, string> {
  const hostBlocks = [...CSS.matchAll(/:host\s*\{([^}]*)\}/g)].map((m) => m[1]).join('\n');
  const vars: Record<string, string> = {
    ...PAGE[scheme],
    ...declarations(hostBlocks),
    ...declarations(blockAfter(`:host([data-vis-theme='${theme}'])`)),
    ...(scheme === 'dark' ? declarations(blockAfter(`:host([data-vis-scheme='dark'])`)) : {}),
  };
  const value = (v: string): string => {
    const ref = v.match(/^var\((--[\w-]+)\)$/);
    if (!ref) return v;
    if (!(ref[1] in vars)) throw new Error(`${ref[1]} isn't defined for ${theme} ${scheme}`);
    return value(vars[ref[1]]);
  };
  return Object.fromEntries(Object.keys(vars).map((k) => [k, value(vars[k])]));
}
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (h: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(h.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/** Pairs a scene may use, with their minimum (3:1 graphics, 4.5:1 labels). */
const PAIRS: [fg: string, bg: string, min: number][] = [
  ...['ground', 'far', 'mid', 'near', 'subject-fill', 'subject-lit', 'subject-shade'].map((bg) => ['subject', bg, 3] as [string, string, number]),
  ...['ground', 'near'].map((bg) => ['ink', bg, 3] as [string, string, number]),
  ...['ground', 'far', 'mid'].map((bg) => ['context', bg, 3] as [string, string, number]),
  ...['ground', 'far', 'mid', 'near'].map((bg) => ['receded', bg, 3] as [string, string, number]),
  ...['ground', 'far', 'mid', 'near'].map((bg) => ['label', bg, 4.5] as [string, string, number]),
  ...['ground', 'far', 'mid'].map((bg) => ['label-soft', bg, 4.5] as [string, string, number]),
  // The focus ring sits just outside a target, on whatever is behind it (M4).
  ...['ground', 'far', 'mid', 'near'].map((bg) => ['focus', bg, 3] as [string, string, number]),
];

describe('tokens.css', () => {
  for (const theme of Object.keys(THEMES) as ThemeId[]) {
    for (const scheme of ['light', 'dark'] as const) {
      it(`meets every contrast pair in ${theme}, ${scheme}`, () => {
        const t = tokens(theme, scheme);
        const failures = PAIRS.filter(([fg, bg, min]) => contrast(t[`--vis-${fg}`], t[`--vis-${bg}`]) < min).map(
          ([fg, bg, min]) => `${fg} on ${bg}: ${contrast(t[`--vis-${fg}`], t[`--vis-${bg}`]).toFixed(2)} < ${min}`,
        );
        expect(failures).toEqual([]);
      });
    }
  }

  it('keeps every figure colour below the UI accent in chroma, so controls stay strongest', () => {
    // OKLCH chroma from sRGB (Björn Ottosson's OKLab matrices).
    const chroma = (h: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(h.slice(i, i + 2), 16) / 255));
      const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
      const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
      const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
      const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
      const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
      return Math.hypot(A, B);
    };
    const hex = [...CSS.matchAll(/#[0-9a-f]{6}/gi)].map((m) => m[0]);
    expect(hex.length).toBeGreaterThan(50);
    const accent = chroma('#2457c5');
    expect(accent).toBeCloseTo(0.181, 2);
    for (const h of hex) expect(chroma(h), h).toBeLessThan(accent);
  });

  it('maps every role to a system colour under forced colours', () => {
    const forced = declarations(blockAfter('@media (forced-colors: active)'));
    const roles = Object.keys(declarations([...CSS.matchAll(/:host\s*\{([^}]*)\}/g)].map((m) => m[1]).join('\n'))).filter(
      (k) => !/^--vis-[an]-\d/.test(k),
    );
    const system = ['Canvas', 'CanvasText', 'GrayText', 'Highlight'];
    for (const role of [...roles, '--vis-focal']) expect(system, role).toContain(forced[role]);
    expect(CSS).toContain('forced-color-adjust: none');
  });
});
