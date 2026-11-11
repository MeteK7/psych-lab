import { Pt, arc, curveThrough, fmt, superellipsePoints } from './curves';
import { contours, flowLines } from './fields';
import { blob, ridge, rhythm } from './forms';
import { NOISE_LIMITS, fractalNoise, fractalNoise2D, gradientNoise2D, periodicNoise } from './noise';
import { deriveSeed, hashSeed, rng } from './random';
import { GENERATORS, GeneratorId, generate, generatorProblems } from './registry';

/** Every number in a path, in order. */
const numbers = (d: string) => (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);

/** The cubic segments of a path written by curveThrough: start point and three more per segment. */
function segments(d: string): [Pt, Pt, Pt, Pt][] {
  const n = numbers(d);
  const out: [Pt, Pt, Pt, Pt][] = [];
  let start: Pt = [n[0], n[1]];
  for (let i = 2; i + 5 < n.length + 0; i += 6) {
    const seg: [Pt, Pt, Pt, Pt] = [start, [n[i], n[i + 1]], [n[i + 2], n[i + 3]], [n[i + 4], n[i + 5]]];
    out.push(seg);
    start = seg[3];
  }
  return out;
}

describe('S2 Generation', () => {
  describe('seeded random', () => {
    it('gives the same sequence for the same seed, and a different one for another seed', () => {
      const a = rng('mcii'), b = rng('mcii'), c = rng('cs2');
      const take = (r: () => number) => Array.from({ length: 8 }, r);
      const first = take(a);
      expect(take(b)).toEqual(first);
      expect(take(c)).not.toEqual(first);
      expect(first.every((x) => x >= 0 && x < 1)).toBe(true);
    });

    it('hashes text to a stable 32-bit number, and derives element seeds from the scene and the id', () => {
      expect(hashSeed('')).toBe(0x811c9dc5);
      expect(hashSeed('abc')).toBe(hashSeed('abc'));
      expect(deriveSeed('scene', 'ridge')).toBe('scene/ridge');
    });
  });

  describe('curves', () => {
    it('writes numbers with at most two decimals and never "-0"', () => {
      expect([fmt(1.005), fmt(2.5), fmt(-0.001), fmt(3)]).toEqual(['1', '2.5', '0', '3']);
    });

    it('draws a smooth curve through every point, tangent-continuous at each joint', () => {
      const points: Pt[] = [[0, 0], [40, -30], [90, 10], [120, 80], [200, 60]];
      const d = curveThrough(points);
      const segs = segments(d);
      expect(segs).toHaveLength(points.length - 1);
      segs.forEach((s, i) => expect(s[3]).toEqual(points[i + 1]));
      for (let i = 0; i + 1 < segs.length; i++) {
        const [, , c2, end] = segs[i];
        const c1 = segs[i + 1][1];
        const inV = [end[0] - c2[0], end[1] - c2[1]];
        const outV = [c1[0] - end[0], c1[1] - end[1]];
        const cross = inV[0] * outV[1] - inV[1] * outV[0];
        const dot = inV[0] * outV[0] + inV[1] * outV[1];
        expect(Math.abs(cross) / (Math.hypot(...inV) * Math.hypot(...outV))).toBeLessThan(0.02); // same direction…
        expect(dot).toBeGreaterThan(0); // …not a cusp
      }
    });

    it('keeps each segment between its points: no loops, even with uneven spacing', () => {
      const points: Pt[] = [[0, 0], [5, 0], [100, 0], [105, 0], [200, 0]];
      for (const [a, c1, c2, b] of segments(curveThrough(points))) {
        const [lo, hi] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
        for (const c of [c1, c2]) {
          expect(c[0]).toBeGreaterThanOrEqual(lo - 1e-9);
          expect(c[0]).toBeLessThanOrEqual(hi + 1e-9);
        }
      }
    });

    it('closes a curve back to its first point', () => {
      const d = curveThrough([[0, 0], [10, 0], [10, 10], [0, 10]], true);
      expect(d.endsWith('Z')).toBe(true);
      expect(segments(d)).toHaveLength(4);
      expect(segments(d)[3][3]).toEqual([0, 0]);
    });

    it('puts superellipse points on the outline: |x/rx|^n + |y/ry|^n = 1', () => {
      for (const [x, y] of superellipsePoints(0, 0, 40, 20, 4, 24)) {
        expect(Math.abs(x / 40) ** 4 + Math.abs(y / 20) ** 4).toBeCloseTo(1, 6);
      }
    });

    it('draws arcs the short or long way as asked', () => {
      expect(arc(0, 0, 10, 0, 90)).toBe('M10 0A10 10 0 0 1 0 10');
      expect(arc(0, 0, 10, 0, 270)).toContain('A10 10 0 1 1');
    });
  });

  describe('noise', () => {
    it('stays in [-1, 1], wraps around without a seam, and repeats for a seed', () => {
      const n = fractalNoise('seed', 3);
      const values = Array.from({ length: 200 }, (_, i) => n(i / 200));
      expect(values.every((v) => v >= -1 && v <= 1)).toBe(true);
      expect(n(0)).toBeCloseTo(n(1), 10);
      expect(fractalNoise('seed', 3)(0.37)).toBe(n(0.37));
      expect(periodicNoise('a', 4)(0.25)).not.toBe(periodicNoise('b', 4)(0.25));
    });

    it('never goes past the limits, whatever is asked', () => {
      expect(NOISE_LIMITS).toEqual({ octaves: 3, persistence: 0.5, amplitude: 0.12 });
      // Asking for 9 octaves gives the same as 3: the extra layers are never added.
      expect(fractalNoise('s', 9)(0.4)).toBe(fractalNoise('s', 3)(0.4));
    });
  });

  describe('forms', () => {
    const shape = { cx: 100, cy: 100, rx: 60, ry: 40, exponent: 4, octaves: 2 };

    it('keeps a blob within 12% of its soft square, however much wobble is asked for', () => {
      const d = blob({ ...shape, wobble: 0.5 }, 'b');
      const pts = numbers(d);
      for (let i = 0; i < pts.length; i += 2) {
        // Every point and control point sits inside the form's box grown by the limit (with a margin for the curve's bulge).
        expect(Math.abs(pts[i] - 100)).toBeLessThanOrEqual(60 * (1 + NOISE_LIMITS.amplitude) * 1.1);
        expect(Math.abs(pts[i + 1] - 100)).toBeLessThanOrEqual(40 * (1 + NOISE_LIMITS.amplitude) * 1.1);
      }
      expect(blob({ ...shape, wobble: 0.5 }, 'b')).toBe(blob({ ...shape, wobble: NOISE_LIMITS.amplitude }, 'b'));
    });

    it('gives the same blob for the same seed, another for another seed, and the plain form without wobble', () => {
      expect(blob({ ...shape, wobble: 0.08 }, 'x')).toBe(blob({ ...shape, wobble: 0.08 }, 'x'));
      expect(blob({ ...shape, wobble: 0.08 }, 'x')).not.toBe(blob({ ...shape, wobble: 0.08 }, 'y'));
      expect(blob({ ...shape, wobble: 0 }, 'x')).toBe(blob({ ...shape, wobble: 0 }, 'y'));
    });

    it('keeps a ridge within 12% of its length from the baseline, and closes a band to its floor', () => {
      const line = ridge({ x0: 0, x1: 200, baseline: 50, amplitude: 999, octaves: 3, band: false }, 'r');
      const ys = numbers(line).filter((_, i) => i % 2 === 1);
      expect(Math.max(...ys.map((y) => Math.abs(y - 50)))).toBeLessThanOrEqual(200 * NOISE_LIMITS.amplitude * 1.2);
      const band = ridge({ x0: 0, x1: 200, baseline: 50, amplitude: 10, octaves: 2, floor: 120, band: true }, 'r');
      expect(band.endsWith('L200 120L0 120Z')).toBe(true);
    });

    it('settles a rhythm curve to its line when it decays fully', () => {
      const d = rhythm({ x0: 0, x1: 100, y: 20, amplitude: 10, periods: 2, decay: 1 });
      const n = numbers(d);
      expect([n[n.length - 2], n[n.length - 1]]).toEqual([100, 20]);
    });
  });

  describe('2D noise and fields (stage B)', () => {
    /** The anchor points of each subpath: its start and the end of every curve. */
    const anchors = (d: string): Pt[][] =>
      d.split('M').filter(Boolean).map((sub) => {
        const n = numbers(sub);
        const pts: Pt[] = [[n[0], n[1]]];
        for (let i = 2; i + 5 < n.length + 0; i += 6) pts.push([n[i + 4], n[i + 5]]);
        return pts;
      });

    it('gives 2D noise in [-1, 1], smooth (nearby points are close), the same for a seed, and not tied to its grid', () => {
      const n = fractalNoise2D('s', 3);
      for (let k = 0; k < 300; k++) {
        const [x, y] = [k * 0.137, k * 0.071];
        const v = n(x, y);
        expect(v).toBeGreaterThanOrEqual(-1);
        expect(v).toBeLessThanOrEqual(1);
        expect(Math.abs(n(x + 0.001, y) - v)).toBeLessThan(0.02);
      }
      expect(fractalNoise2D('s', 3)(4.2, 1.7)).toBe(n(4.2, 1.7));
      expect(gradientNoise2D('a')(1.5, 2.3)).not.toBe(gradientNoise2D('b')(1.5, 2.3));
      expect(fractalNoise2D('s', 9)(1.3, 0.4)).toBe(fractalNoise2D('s', 3)(1.3, 0.4));
      // Gradient noise is zero at every lattice point; spread across the cell, it isn't constant.
      expect(gradientNoise2D('g')(3, 7)).toBe(0);
      expect(new Set([0.2, 0.4, 0.6, 0.8].map((f) => gradientNoise2D('g')(3 + f, 7 + f).toFixed(4))).size).toBe(4);
    });

    const flow = { x: 0, y: 0, width: 300, height: 150, lines: 30, spacing: 12, scale: 200, turn: 60, heading: 0, octaves: 1, length: 400 };

    it('keeps flow lines inside their area, and apart from each other', () => {
      const lines = anchors(flowLines(flow, 'f'));
      expect(lines.length).toBeGreaterThan(5);
      for (const line of lines)
        for (const [x, y] of line) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(300);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(150);
        }
      let closest = Infinity;
      for (let a = 0; a < lines.length; a++)
        for (let b = a + 1; b < lines.length; b++)
          for (const p of lines[a]) for (const q of lines[b]) closest = Math.min(closest, Math.hypot(p[0] - q[0], p[1] - q[1]));
      expect(closest).toBeGreaterThanOrEqual(flow.spacing - 0.02); // the rounding of path numbers
    });

    it('gives the same flow for a seed and another for another seed', () => {
      expect(flowLines(flow, 'f')).toBe(flowLines(flow, 'f'));
      expect(flowLines(flow, 'f')).not.toBe(flowLines(flow, 'g'));
    });

    it('puts every contour point on one of its levels', () => {
      const p = { x: 0, y: 0, width: 300, height: 150, levels: 4, scale: 120, octaves: 2, cell: 6 };
      const height = fractalNoise2D('c:height', p.octaves);
      const levels = Array.from({ length: p.levels }, (_, l) => -0.6 + (1.2 * (l + 1)) / (p.levels + 1));
      const lines = anchors(contours(p, 'c'));
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines)
        for (const [x, y] of line) {
          const v = height(x / p.scale, y / p.scale);
          // Between grid points the height isn't linear, so allow a little.
          expect(Math.min(...levels.map((l) => Math.abs(v - l)))).toBeLessThan(0.05);
        }
    });
  });

  describe('registry', () => {
    it('checks every parameter: required, in range, whole where needed, and no unknown ones', () => {
      expect(generatorProblems('form.blob', { cx: 0, cy: 0, rx: 10, ry: 10 })).toEqual([]);
      expect(generatorProblems('form.nothing', {})).toEqual(["unknown generator 'form.nothing'"]);
      expect(generatorProblems('form.blob', { cx: 0, cy: 0, rx: 10 })).toEqual(["'form.blob' needs 'ry'"]);
      expect(generatorProblems('form.blob', { cx: 0, cy: 0, rx: 10, ry: 10, wobble: 0.2 })).toEqual([
        "'form.blob': 'wobble' must be from 0 to 0.12",
      ]);
      expect(generatorProblems('form.blob', { cx: 0, cy: 0, rx: 10, ry: 10, octaves: 1.5 })).toEqual([
        "'form.blob': 'octaves' must be a whole number",
      ]);
      expect(generatorProblems('curve.arc', { cx: 0, cy: 0, r: 5, from: 0, to: 90, size: 3 })).toEqual([
        "'curve.arc' has no parameter 'size'",
      ]);
    });

    it('runs every generator with its defaults, repeatably, and says what each makes', () => {
      const samples: Record<GeneratorId, Record<string, number>> = {
        'form.blob': { cx: 100, cy: 80, rx: 60, ry: 40 },
        'form.ridge': { x0: 0, x1: 300, baseline: 60 },
        'form.band': { x0: 0, x1: 300, baseline: 60, floor: 120 },
        'curve.rhythm': { x0: 0, x1: 300, y: 50, amplitude: 12 },
        'curve.arc': { cx: 50, cy: 50, r: 30, from: -90, to: 90 },
        'field.flow': { x: 0, y: 0, width: 300, height: 150 },
        'field.contours': { x: 0, y: 0, width: 300, height: 150 },
        'dots.scatter': { x: 0, y: 0, width: 300, height: 150 },
        'dots.grid': { x: 0, y: 0, width: 300, height: 150 },
        'curve.lens': { x1: 100, y1: 80, r1: 50, x2: 150, y2: 80, r2: 40 },
      };
      for (const id of Object.keys(GENERATORS) as GeneratorId[]) {
        expect(GENERATORS[id].about.length).toBeGreaterThan(10);
        expect(generatorProblems(id, samples[id])).toEqual([]);
        const d = generate(id, samples[id], 'seed');
        expect(d).toMatch(/^M/);
        expect(generate(id, samples[id], 'seed')).toBe(d);
      }
    });
  });
});
