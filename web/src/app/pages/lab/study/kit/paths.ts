import { r2 } from './elements';

/**
 * STUDY CODE: flat paths for the kinetic and field idioms. A track is a smooth curve through
 * points, sampled densely, so a form can be placed at any fraction of its length and a trace drawn
 * up to it.
 */
export type Pt = readonly [number, number];

/** Uniform Catmull-Rom through the points, sampled `per` times a segment. */
export function smooth(points: readonly Pt[], closed = false, per = 24): Pt[] {
  const n = points.length;
  if (n < 2) return [...points];
  const at = (i: number): Pt => {
    if (closed) return points[((i % n) + n) % n];
    if (i < 0) return [2 * points[0][0] - points[1][0], 2 * points[0][1] - points[1][1]];
    if (i >= n) return [2 * points[n - 1][0] - points[n - 2][0], 2 * points[n - 1][1] - points[n - 2][1]];
    return points[i];
  };
  const out: Pt[] = [];
  const segments = closed ? n : n - 1;
  for (let i = 0; i < segments; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let k = 0; k < per; k++) {
      const u = k / per;
      const c = (a: number, b: number, c2: number, d: number) =>
        0.5 * (2 * b + (-a + c2) * u + (2 * a - 5 * b + 4 * c2 - d) * u * u + (-a + 3 * b - 3 * c2 + d) * u * u * u);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(closed ? points[0] : points[n - 1]);
  return out;
}

export class Track {
  readonly points: readonly Pt[];
  private readonly cum: number[];
  readonly length: number;

  constructor(points: readonly Pt[]) {
    this.points = points;
    this.cum = [0];
    for (let i = 1; i < points.length; i++) this.cum.push(this.cum[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
    this.length = this.cum[this.cum.length - 1] || 1;
  }

  /** The point at fraction `u` (0–1) of the track's length. */
  at(u: number): Pt {
    const d = Math.min(Math.max(u, 0), 1) * this.length;
    let i = 1;
    while (i < this.cum.length - 1 && this.cum[i] < d) i++;
    const span = this.cum[i] - this.cum[i - 1] || 1;
    const f = (d - this.cum[i - 1]) / span;
    const [a, b] = [this.points[i - 1], this.points[i]];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  }

  /** The track from fraction `u0` to `u1`, as points. */
  slice(u0: number, u1: number): Pt[] {
    const [a, b] = [Math.max(0, Math.min(u0, u1)), Math.min(1, Math.max(u0, u1))];
    const out: Pt[] = [this.at(a)];
    for (let i = 1; i < this.points.length - 1; i++) {
      const f = this.cum[i] / this.length;
      if (f > a && f < b) out.push(this.points[i]);
    }
    out.push(this.at(b));
    return out;
  }
}

/** Points as path data: a polyline, closed with Z when asked. */
export function polyline(points: readonly Pt[], closed = false): string {
  if (!points.length) return '';
  let d = `M${r2(points[0][0])} ${r2(points[0][1])}`;
  for (let i = 1; i < points.length; i++) d += `L${r2(points[i][0])} ${r2(points[i][1])}`;
  return closed ? `${d}Z` : d;
}

/** A circle as one closed path, so it can be one of several marks in a path (two arcs, the same way round). */
export function circlePath(c: Pt, r: number): string {
  const [x, y] = c;
  return `M${r2(x - r)} ${r2(y)}A${r2(r)} ${r2(r)} 0 1 0 ${r2(x + r)} ${r2(y)}A${r2(r)} ${r2(r)} 0 1 0 ${r2(x - r)} ${r2(y)}Z`;
}

/** A smooth closed blob through `count` points around a centre, each radius from `radiusAt`. */
export function blobPath(c: Pt, radiusAt: (angle: number) => number, count = 36): string {
  const pts: Pt[] = Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    const r = radiusAt(a);
    return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r];
  });
  return polyline(smooth(pts, true, 4), true);
}

export const ease = {
  /** visual-language.md motion easing `move`: cubic-bezier(0.4, 0, 0.2, 1), close enough for a study. */
  move: (u: number) => {
    const t = Math.min(Math.max(u, 0), 1);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },
  arrive: (u: number) => 1 - Math.pow(1 - Math.min(Math.max(u, 0), 1), 3),
};

/** The fraction through phase `k` of `n`, for an overall progress `u` (0–1). */
export function phaseProgress(u: number, k: number, n: number): number {
  return Math.min(Math.max(u * n - k, 0), 1);
}
