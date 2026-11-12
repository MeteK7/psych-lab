import { Page, expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Rendering parity (milestone M6, docs/visual-system.md §6.2): the canvas backend draws what the
// SVG backend draws. Each case is drawn by both at its design size, on an opaque ground, at device
// pixel ratios 1, 1.5 and 2, captured by the browser, and compared here, pixel by pixel:
// - d = the largest difference in red, green or blue (0–255) between the two captures;
// - a pixel differs when d > INTERIOR (measured rendering noise + 1, at most half the smallest
//   gap between two fill colours); an edge pixel is one whose neighbourhood varies by more than
//   EDGE in either capture;
// - still frames: no differing pixel away from an edge;
// - the neighbourhood rule: a differing pixel passes if each of its channels lies within the range
//   of the other capture's 3 × 3 neighbourhood, give or take INTERIOR, checked both ways. Smoothing
//   only blends the colours on either side of an edge, so it passes when both backends put the edge
//   in the same place (within a device pixel); a shift of more than a pixel, a wrong colour, or a
//   missing or extra part puts a colour where the other capture has none nearby, and fails. Pixels
//   outside it: at most 0.05% of all pixels on a still frame (thin lines crossing can be painted a
//   little darker by one backend), 0.5% at a moment of a change (crossfades and fades at fractional
//   positions; a few pixels inside fading items count here too);
// - text is compared by each label's box (within 1 device pixel) and its ink, summed in luminance
//   (within 5%), since the two backends may smooth text differently; its region is left out of the
//   pixel criteria;
// - every label, mark smaller than 24 × 24 units and subject is visibly drawn by both.

/** Measured: the largest difference inside fills between the backends was below this (see the fill test). */
const INTERIOR = 3;
const EDGE = 16;
/** Pixels outside the neighbourhood rule, as a share of all pixels (chosen 2026-11-12 from measurements). */
const OUTSIDE_STILL = 0.0005;
const OUTSIDE_CHANGE = 0.005;

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface CaseInfo {
  key: string;
  group: string;
  name: string;
  width: number;
  height: number;
  change: boolean;
  gap: number;
}

const harness = async (page: Page) => {
  await page.goto('/lab/parity?harness');
  await page.waitForFunction(() => '__parity' in globalThis);
  return page.evaluate(() => (globalThis as any).__parity.cases()) as Promise<CaseInfo[]>;
};
const show = (page: Page, key: string, scheme: 'light' | 'dark', variant: Record<string, unknown> = {}) =>
  page.evaluate(([k, s, v]) => (globalThis as any).__parity.show(k, s, v), [key, scheme, variant] as const);

/** Both captures of the shown case, in a region of the frame (CSS px), as PNG in base64. */
async function capture(page: Page, c: CaseInfo, region: Box = { x: 0, y: 0, width: c.width, height: c.height }) {
  const shot = (top: number) => page.screenshot({ clip: { x: region.x, y: top + region.y, width: region.width, height: region.height }, animations: 'allow' });
  return { svg: (await shot(0)).toString('base64'), canvas: (await shot(c.gap)).toString('base64') };
}

/** Snapped outwards to even CSS px inside the frame, so it starts on a device pixel at ratio 1.5 too. */
function snap(b: Box, c: CaseInfo): Box {
  const x = Math.max(0, Math.floor(b.x / 2) * 2);
  const y = Math.max(0, Math.floor(b.y / 2) * 2);
  const right = Math.min(c.width, Math.ceil((b.x + b.width) / 2) * 2);
  const bottom = Math.min(c.height, Math.ceil((b.y + b.height) / 2) * 2);
  return { x, y, width: Math.max(2, right - x), height: Math.max(2, bottom - y) };
}

/**
 * Runs in the page: decodes PNGs, and measures pairs. `compare` gives the parity criteria for two
 * captures; `changed` counts pixels that differ between two captures of one backend; `ink` gives
 * the box and summed difference of what differs.
 */
const MEASURE = async (job: {
  op: 'compare' | 'changed' | 'ink' | 'colours';
  a: string;
  b?: string;
  interior: number;
  edge: number;
  exclude?: Box[];
  scale?: number;
}) => {
  const decode = async (b64: string) => {
    const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
    const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bmp, 0, 0);
    return ctx.getImageData(0, 0, bmp.width, bmp.height);
  };
  const A = await decode(job.a);
  const w = A.width;
  const h = A.height;
  const at = (img: ImageData, i: number) => [img.data[i * 4], img.data[i * 4 + 1], img.data[i * 4 + 2]];
  const dist = (p: number[], q: number[]) => Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1]), Math.abs(p[2] - q[2]));
  if (job.op === 'colours') {
    const seen = new Map<string, number>();
    for (let i = 0; i < w * h; i++) {
      const k = at(A, i).join(',');
      seen.set(k, (seen.get(k) ?? 0) + 1);
    }
    return { colours: [...seen.entries()].sort((x, y) => y[1] - x[1]).slice(0, 12), pixels: w * h };
  }
  const B = await decode(job.b!);
  if (B.width !== w || B.height !== h) return { error: `sizes differ: ${w}×${h} and ${B.width}×${B.height}` };
  const d = (i: number) => dist(at(A, i), at(B, i));
  if (job.op === 'changed') {
    let n = 0;
    for (let i = 0; i < w * h; i++) if (d(i) > job.interior) n++;
    return { changed: n };
  }
  if (job.op === 'ink') {
    let [x0, y0, x1, y1, sum, n] = [w, h, -1, -1, 0, 0];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const v = d(y * w + x);
        if (v > job.edge) {
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
          n++;
        }
        // Ink in luminance (Rec. 709 weights on the encoded values): SVG text may be smoothed with
        // colour fringes, which spread a glyph's coverage over red, green and blue.
        const [p, q] = [at(A, y * w + x), at(B, y * w + x)];
        sum += Math.abs(0.2126 * (p[0] - q[0]) + 0.7152 * (p[1] - q[1]) + 0.0722 * (p[2] - q[2]));
      }
    return { box: n ? [x0, y0, x1, y1] : null, sum, n };
  }
  // compare
  const scale = job.scale ?? 1;
  const skip = new Uint8Array(w * h);
  for (const b of job.exclude ?? []) {
    for (let y = Math.max(0, Math.floor(b.y * scale)); y < Math.min(h, Math.ceil((b.y + b.height) * scale)); y++)
      for (let x = Math.max(0, Math.floor(b.x * scale)); x < Math.min(w, Math.ceil((b.x + b.width) * scale)); x++) skip[y * w + x] = 1;
  }
  const edgeIn = (img: ImageData, x: number, y: number) => {
    const p = at(img, y * w + x);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const [nx, ny] = [x + dx, y + dy];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (dist(p, at(img, ny * w + nx)) > job.edge) return true;
      }
    return false;
  };
  /** Whether every channel of P's pixel lies within the range of Q's 3 × 3 neighbourhood, give or take the threshold. */
  const inRange = (P: ImageData, Q: ImageData, x: number, y: number) => {
    const p = at(P, y * w + x);
    for (let c = 0; c < 3; c++) {
      let [lo, hi] = [255, 0];
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const [nx, ny] = [x + dx, y + dy];
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const v = Q.data[(ny * w + nx) * 4 + c];
          lo = Math.min(lo, v);
          hi = Math.max(hi, v);
        }
      if (p[c] < lo - job.interior || p[c] > hi + job.interior) return false;
    }
    return true;
  };
  let interiorFails = 0;
  let edgeDiffs = 0;
  let outside = 0;
  let maxInterior = 0;
  let worst: number[] | null = null;
  let worstOutside: number[] | null = null;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (skip[i]) continue;
      const v = d(i);
      if (v > job.interior && !(inRange(A, B, x, y) && inRange(B, A, x, y))) {
        outside++;
        if (!worstOutside || v > worstOutside[2]) worstOutside = [x, y, v, ...at(A, i), ...at(B, i)];
      }
      const edge = edgeIn(A, x, y) || edgeIn(B, x, y);
      if (!edge) {
        maxInterior = Math.max(maxInterior, v);
        if (v > job.interior) {
          interiorFails++;
          if (!worst || v > worst[2]) worst = [x, y, v, ...at(A, i), ...at(B, i)];
        }
      } else if (v > job.interior) edgeDiffs++;
    }
  return { interiorFails, edgeDiffs, share: edgeDiffs / (w * h), outside, outsideShare: outside / (w * h), worstOutside, maxInterior, worst, pixels: w * h };
};
type Measured = Awaited<ReturnType<typeof MEASURE>>;
const measure = (page: Page, job: Parameters<typeof MEASURE>[0]) => page.evaluate(MEASURE, job) as Promise<any>;

/** Text regions to leave out of the pixel criteria (CSS px), covering where a moving label travels. */
async function textRegions(page: Page): Promise<Box[]> {
  const [boxes, moves] = await page.evaluate(() => [(globalThis as any).__parity.textBoxes(), (globalThis as any).__parity.moves()]);
  return (boxes as (Box & { id: string })[]).map((b) => {
    const m = (moves as { id: string; dx: number; dy: number }[]).find((x) => x.id === b.id);
    const [dx, dy] = m ? [m.dx, m.dy] : [0, 0];
    const x = Math.min(b.x, b.x + dx) - 3;
    const y = Math.min(b.y, b.y + dy) - 3;
    return { x, y, width: b.width + Math.abs(dx) + 6, height: b.height + Math.abs(dy) + 6 };
  });
}

/** The shapes criteria for the case shown (text left out): a still frame, or a moment of a change. */
async function expectSameShapes(page: Page, c: CaseInfo, dpr: number, where: string, moment = false) {
  const { svg, canvas } = await capture(page, c);
  const r = await measure(page, { op: 'compare', a: svg, b: canvas, interior: INTERIOR, edge: EDGE, exclude: await textRegions(page), scale: dpr });
  expect(r.error, where).toBeUndefined();
  if (!moment) expect(r.interiorFails, `${where}: differing pixels away from edges (worst x, y, d, svg rgb, canvas rgb: ${r.worst})`).toBe(0);
  expect(r.outsideShare, `${where}: ${r.outside} pixels outside the neighbourhood rule (worst x, y, d, svg rgb, canvas rgb: ${r.worstOutside})`).toBeLessThanOrEqual(
    moment ? OUTSIDE_CHANGE : OUTSIDE_STILL,
  );
  return r;
}

/** Labels: the same box within a device pixel, the same ink within 5%; and every checked item visibly drawn by both. */
async function expectVisibleAndText(page: Page, c: CaseInfo, scheme: 'light' | 'dark', dpr: number) {
  await show(page, c.key, scheme);
  const checked = (await page.evaluate(() => (globalThis as any).__parity.checked())) as { id: string; kind: string; box: Box }[];
  const covered: string[] = [];
  for (const item of checked) {
    const region = snap(item.box, c);
    const full = await capture(page, c, region);
    await show(page, c.key, scheme, { without: item.id });
    const without = await capture(page, c, region);
    await show(page, c.key, scheme, { only: item.id });
    const only = await capture(page, c, region);
    await show(page, c.key, scheme, { none: true });
    const none = await capture(page, c, region);
    const where = `${c.key} (${scheme}, ×${dpr}): ${item.id}`;
    const count = async (side: 'svg' | 'canvas') => ({
      shown: (await measure(page, { op: 'changed', a: full[side], b: without[side], interior: INTERIOR, edge: EDGE })).changed as number,
      own: (await measure(page, { op: 'changed', a: only[side], b: none[side], interior: INTERIOR, edge: EDGE })).changed as number,
    });
    const [s, k] = [await count('svg'), await count('canvas')];
    expect(s.own, `${where}: drawn by SVG at all`).toBeGreaterThan(0);
    expect(k.own, `${where}: drawn by canvas at all`).toBeGreaterThan(0);
    expect(Math.abs(s.shown - k.shown), `${where}: visible pixels, SVG ${s.shown}, canvas ${k.shown}`).toBeLessThanOrEqual(0.3 * Math.max(s.shown, k.shown) + 2);
    if (s.shown < 0.3 * s.own) covered.push(item.id);
    else expect(k.shown, `${where}: canvas shows at least 30% of it (${k.shown} of ${k.own})`).toBeGreaterThanOrEqual(0.3 * k.own);
    if (item.kind === 'text') {
      const ink = async (side: 'svg' | 'canvas') => measure(page, { op: 'ink', a: full[side], b: without[side], interior: INTERIOR, edge: EDGE });
      const [si, ki] = [await ink('svg'), await ink('canvas')];
      expect(si.box && ki.box, `${where}: ink found`).toBeTruthy();
      for (let e = 0; e < 4; e++) expect(Math.abs(si.box[e] - ki.box[e]), `${where}: box edge ${e} (svg ${si.box}, canvas ${ki.box})`).toBeLessThanOrEqual(1);
      expect(Math.abs(si.sum - ki.sum) / Math.max(si.sum, ki.sum), `${where}: ink (svg ${si.sum}, canvas ${ki.sum})`).toBeLessThanOrEqual(0.05);
    }
    await show(page, c.key, scheme);
  }
  return covered;
}

for (const dpr of [1, 1.5, 2]) {
  test.describe(`rendering parity at device pixel ratio ${dpr}`, () => {
    test.use({ deviceScaleFactor: dpr });
    test.describe.configure({ timeout: 600_000 });

    test(`still frames: shapes and fills (×${dpr})`, async ({ page }) => {
      const cases = (await harness(page)).filter((c) => !c.change);
      for (const scheme of ['light', 'dark'] as const)
        for (const c of cases) {
          await show(page, c.key, scheme);
          await expectSameShapes(page, c, dpr, `${c.key} (${scheme}, ×${dpr})`);
        }
    });

    test(`changes, at a quarter, half and three quarters (×${dpr})`, async ({ page }) => {
      const cases = (await harness(page)).filter((c) => c.change);
      for (const c of cases) {
        await show(page, c.key, 'light', { play: true });
        const end = (await page.evaluate(() => (globalThis as any).__parity.end())) as number;
        for (const f of [0.25, 0.5, 0.75]) {
          await page.evaluate((ms) => (globalThis as any).__parity.at(ms), f * end);
          await expectSameShapes(page, c, dpr, `${c.key} at ${Math.round(f * end)} ms (×${dpr})`, true);
        }
      }
    });

    if (dpr !== 1.5)
      test(`labels, small marks and the subject are visibly drawn by both (×${dpr})`, async ({ page }) => {
        const cases = (await harness(page)).filter((c) => !c.change && !c.key.startsWith('calibration.'));
        const covered: string[] = [];
        for (const c of cases) covered.push(...(await expectVisibleAndText(page, c, 'light', dpr)).map((id) => `${c.key}: ${id}`));
        test.info().annotations.push({ type: 'covered by design', description: covered.join('; ') || 'none' });
      });
  });
}

/** The smallest difference between two distinct colours a fill can take, from tokens.css (largest channel difference). */
function smallestFillGap(): { gap: number; where: string } {
  const css = readFileSync(join(__dirname, '../src/app/shared/visual/styling/tokens.css'), 'utf8');
  const PAGE = {
    light: { '--bg': '#ffffff', '--text': '#1c1c1e', '--muted': '#55575d', '--accent': '#2457c5' },
    dark: { '--bg': '#17181b', '--text': '#ececef', '--muted': '#a9abb2', '--accent': '#8fb0ff' },
  };
  const block = (sel: string) => {
    const i = css.indexOf(sel);
    const o = css.indexOf('{', i);
    return css.slice(o + 1, css.indexOf('}', o));
  };
  const decls = (b: string) => Object.fromEntries([...b.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const host = [...css.matchAll(/:host\s*\{([^}]*)\}/g)].map((m) => m[1]).join('\n');
  const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  let best = { gap: 256, where: '' };
  for (const theme of ['action', 'cognitive', 'attention', 'regulation', 'recovery'])
    for (const scheme of ['light', 'dark'] as const) {
      const vars: Record<string, string> = { ...PAGE[scheme], ...decls(host), ...decls(block(`:host([data-vis-theme='${theme}'])`)) };
      if (scheme === 'dark') Object.assign(vars, decls(block(":host([data-vis-scheme='dark'])")));
      const resolve = (v: string): number[] => {
        const ref = v.match(/^var\((--[\w-]+)\)$/);
        if (ref) return resolve(vars[ref[1]]);
        const mix = v.match(/^color-mix\(in srgb, (?:var\((--[\w-]+)\)|(black)) (\d+)%, transparent\)$/);
        if (mix) {
          const c = mix[1] ? resolve(vars[mix[1]]) : [0, 0, 0];
          const a = Number(mix[3]) / 100;
          const bg = hex(vars['--bg']);
          return c.map((x, i) => Math.round(x * a + bg[i] * (1 - a)));
        }
        return hex(v);
      };
      const colours = new Map<string, string[]>();
      for (const token of ['ground', 'far', 'far-edge', 'mid', 'mid-edge', 'near', 'near-edge', 'subject-fill', 'subject', 'context', 'ink', 'receded', 'receded-fill', 'subject-lit', 'subject-shade', 'translucent', 'overlap']) {
        const k = resolve(vars[`--vis-${token}`]).join(',');
        colours.set(k, [...(colours.get(k) ?? []), token]);
      }
      const list = [...colours.keys()].map((k) => k.split(',').map(Number));
      for (let i = 0; i < list.length; i++)
        for (let j = i + 1; j < list.length; j++) {
          const gap = Math.max(...list[i].map((x, c) => Math.abs(x - list[j][c])));
          if (gap < best.gap) best = { gap, where: `${theme} ${scheme}: ${colours.get(list[i].join(','))} and ${colours.get(list[j].join(','))}` };
        }
    }
  return best;
}

test('fill colours: rendering noise is below the threshold, which is at most half the smallest colour gap, and a neighbouring colour fails', async ({ page }) => {
  const { gap, where } = smallestFillGap();
  expect(INTERIOR, `the interior threshold must be at most half the smallest gap between fill colours (${gap}, ${where})`).toBeLessThanOrEqual(gap / 2);
  const cases = (await harness(page)).filter((c) => c.key.startsWith('calibration.'));
  let noise = 0;
  for (const scheme of ['light', 'dark'] as const)
    for (const c of cases) {
      await show(page, c.key, scheme);
      const { svg, canvas } = await capture(page, c);
      const r = await measure(page, { op: 'compare', a: svg, b: canvas, interior: INTERIOR, edge: EDGE });
      noise = Math.max(noise, r.maxInterior);
    }
  test.info().annotations.push({ type: 'measured', description: `largest difference inside fills between the backends: ${noise}; smallest gap between fill colours: ${gap} (${where})` });
  expect(noise + 1, 'measured noise + 1 is within the threshold').toBeLessThanOrEqual(INTERIOR);
  // Deliberate failures: the canvas fills one swatch in the nearest other colour.
  const swaps: [string, 'light' | 'dark', string, string][] = [
    ['calibration.cognitive', 'light', 'var(--vis-near)', 'var(--vis-translucent)'],
    ['calibration.action', 'light', 'var(--vis-far)', 'var(--vis-mid)'],
    ['calibration.action', 'dark', 'var(--vis-far)', 'var(--vis-mid)'],
  ];
  const c = (await harness(page)).find((x) => x.key === 'calibration.action')!;
  for (const [key, scheme, from, to] of swaps) {
    await show(page, key, scheme, { swap: [from, to] });
    const { svg, canvas } = await capture(page, c);
    const r = await measure(page, { op: 'compare', a: svg, b: canvas, interior: INTERIOR, edge: EDGE });
    expect(r.interiorFails, `${key} ${scheme}: ${from} drawn as ${to} must fail`).toBeGreaterThan(1000);
  }
});

test('the neighbourhood rule: a mark moved by two pixels fails, by half a pixel passes', async ({ page }) => {
  const c = (await harness(page)).find((x) => x.key === 'interaction.rating')!;
  const run = async (dx: number) => {
    await show(page, c.key, 'light', { nudge: { id: 'mark', dx } });
    const { svg, canvas } = await capture(page, c);
    return measure(page, { op: 'compare', a: svg, b: canvas, interior: INTERIOR, edge: EDGE, exclude: await textRegions(page) });
  };
  const moved = await run(2);
  expect(moved.outsideShare, `moved by 2 px: ${moved.outside} pixels outside`).toBeGreaterThan(OUTSIDE_STILL);
  const nudged = await run(0.5);
  expect(nudged.outsideShare, `moved by half a pixel: ${nudged.outside} pixels outside`).toBeLessThanOrEqual(OUTSIDE_STILL);
  expect(nudged.interiorFails, 'moved by half a pixel: nothing inside fills differs').toBe(0);
});

test('forced colours: both backends draw in system colours only', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const cases = (await harness(page)).filter((c) => !c.change && !c.key.startsWith('calibration.'));
  const system = await page.evaluate(() =>
    ['Canvas', 'CanvasText', 'GrayText', 'Highlight'].map((name) => {
      const probe = document.createElement('span');
      probe.style.color = name;
      document.body.append(probe);
      const c = getComputedStyle(probe).color.match(/\d+/g)!.slice(0, 3).map(Number);
      probe.remove();
      return c;
    }),
  );
  for (const c of cases.filter((_, i) => i % 3 === 0)) {
    await show(page, c.key, 'light');
    const { svg, canvas } = await capture(page, c);
    for (const [side, png] of [['svg', svg], ['canvas', canvas]] as const) {
      const r = await measure(page, { op: 'compare', a: png, b: png, interior: INTERIOR, edge: EDGE });
      expect(r.error, c.key).toBeUndefined();
      // Away from edges, every pixel is a system colour.
      const off = await page.evaluate(
        async ({ png, system }) => {
          const blob = await (await fetch(`data:image/png;base64,${png}`)).blob();
          const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none' });
          const cv = new OffscreenCanvas(bmp.width, bmp.height);
          const ctx = cv.getContext('2d')!;
          ctx.drawImage(bmp, 0, 0);
          const { data, width, height } = ctx.getImageData(0, 0, bmp.width, bmp.height);
          const px = (x: number, y: number) => [data[(y * width + x) * 4], data[(y * width + x) * 4 + 1], data[(y * width + x) * 4 + 2]];
          const same = (p: number[], q: number[]) => Math.max(...p.map((v, i) => Math.abs(v - q[i]))) <= 2;
          let off = 0;
          for (let y = 1; y < height - 1; y++)
            for (let x = 1; x < width - 1; x++) {
              const p = px(x, y);
              const flat = [[-1, 0], [1, 0], [0, -1], [0, 1]].every(([dx, dy]) => same(p, px(x + dx, y + dy)));
              if (flat && !system.some((s) => same(p, s))) off++;
            }
          return off;
        },
        { png, system },
      );
      expect(off, `${c.key}, ${side}: pixels away from edges not in a system colour`).toBe(0);
    }
  }
});

export type { Measured };
