import type { Pt } from './paths';

/**
 * S12 drawing kit (Stage 3, M3; written by the representation study): fields for the field idiom. The engine's `field.flow` and `field.contours` take their
 * shape from seeded noise; a field that carries meaning needs its shape from a function the idiom
 * defines (primitives log: "fields from a function"). Pure and deterministic.
 */
export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A direction at a point (any length; normalised here), or null where the field stops. */
export type Vector = (p: Pt) => readonly [number, number] | null;

/** A streamline from `start`, in steps of `step`, until it leaves the area, stops, or reaches `max` length. */
export function streamline(start: Pt, field: Vector, area: Area, step = 4, max = 2000): Pt[] {
  const out: Pt[] = [start];
  let p = start;
  for (let len = 0; len < max; len += step) {
    const v = field(p);
    if (!v) break;
    const m = Math.hypot(v[0], v[1]);
    if (m < 1e-6) break;
    // Midpoint step: smoother than Euler at the same cost, which keeps the lines calm.
    const mid: Pt = [p[0] + (v[0] / m) * step * 0.5, p[1] + (v[1] / m) * step * 0.5];
    const w = field(mid);
    if (!w) break;
    const n = Math.hypot(w[0], w[1]) || 1;
    p = [p[0] + (w[0] / n) * step, p[1] + (w[1] / n) * step];
    if (p[0] < area.x || p[0] > area.x + area.width || p[1] < area.y || p[1] > area.y + area.height) break;
    out.push(p);
  }
  return out;
}

/**
 * Where a scalar function crosses `level`, by marching squares on a grid of `cell`, joined into
 * polylines. Lines that close end where they began.
 */
export function contour(fn: (x: number, y: number) => number, area: Area, cell: number, level: number): Pt[][] {
  const cols = Math.ceil(area.width / cell);
  const rows = Math.ceil(area.height / cell);
  const v: number[][] = [];
  for (let j = 0; j <= rows; j++) {
    v.push([]);
    for (let i = 0; i <= cols; i++) v[j].push(fn(area.x + i * cell, area.y + j * cell) - level);
  }
  const key = (p: Pt) => `${Math.round(p[0] * 100)},${Math.round(p[1] * 100)}`;
  const segments: [Pt, Pt][] = [];
  const lerp = (a: Pt, b: Pt, va: number, vb: number): Pt => {
    const t = va / (va - vb);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const x0 = area.x + i * cell;
      const y0 = area.y + j * cell;
      const c: Pt[] = [[x0, y0], [x0 + cell, y0], [x0 + cell, y0 + cell], [x0, y0 + cell]];
      const s = [v[j][i], v[j][i + 1], v[j + 1][i + 1], v[j + 1][i]];
      const crossings: Pt[] = [];
      for (let k = 0; k < 4; k++) {
        const a = s[k];
        const b = s[(k + 1) % 4];
        if ((a < 0) !== (b < 0)) crossings.push(lerp(c[k], c[(k + 1) % 4], a, b));
      }
      if (crossings.length === 2) segments.push([crossings[0], crossings[1]]);
      else if (crossings.length === 4) {
        segments.push([crossings[0], crossings[1]]);
        segments.push([crossings[2], crossings[3]]);
      }
    }
  // Join segments that share an end.
  const byEnd = new Map<string, number[]>();
  segments.forEach(([a, b], i) => {
    for (const p of [a, b]) byEnd.set(key(p), [...(byEnd.get(key(p)) ?? []), i]);
  });
  const used = new Set<number>();
  const lines: Pt[][] = [];
  for (let i = 0; i < segments.length; i++) {
    if (used.has(i)) continue;
    used.add(i);
    const line: Pt[] = [segments[i][0], segments[i][1]];
    for (const grow of ['end', 'start'] as const) {
      for (;;) {
        const tip = grow === 'end' ? line[line.length - 1] : line[0];
        const next = (byEnd.get(key(tip)) ?? []).find((n) => !used.has(n));
        if (next === undefined) break;
        used.add(next);
        const [a, b] = segments[next];
        const partner = key(a) === key(tip) ? b : a;
        if (grow === 'end') line.push(partner);
        else line.unshift(partner);
      }
    }
    lines.push(line);
  }
  return lines;
}

/** Every `keep`-th point, and the last: contour lines at a fine cell are denser than a path needs. */
export function thin(points: readonly Pt[], keep = 2): Pt[] {
  return points.filter((_, i) => i % keep === 0 || i === points.length - 1);
}
