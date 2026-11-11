/**
 * S2 Generation: curves (docs/visual-language.md §8). Pure geometry, in scene units.
 * - Curves through points are centripetal Catmull-Rom (alpha 0.5) as cubic Béziers: tangent-
 *   continuous, with no loops or cusps.
 * - Soft constructed forms are superellipses, exponent 4 by default.
 * Path data uses at most two decimals, so the same input always gives the same string.
 */
export type Pt = readonly [number, number];

/** A number as path data: at most two decimals, no trailing zeros, never "-0". */
export function fmt(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/**
 * Bézier control points for the centripetal Catmull-Rom segment p1 → p2 (neighbours p0, p3).
 * Centripetal knots (alpha 0.5) are what keep the curve free of loops and cusps.
 */
function controls(p0: Pt, p1: Pt, p2: Pt, p3: Pt): [Pt, Pt] {
  const eps = 1e-6;
  const d1 = Math.max(Math.sqrt(dist(p0, p1)), eps);
  const d2 = Math.max(Math.sqrt(dist(p1, p2)), eps);
  const d3 = Math.max(Math.sqrt(dist(p2, p3)), eps);
  const c1: Pt = [
    (d1 * d1 * p2[0] - d2 * d2 * p0[0] + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1[0]) / (3 * d1 * (d1 + d2)),
    (d1 * d1 * p2[1] - d2 * d2 * p0[1] + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1[1]) / (3 * d1 * (d1 + d2)),
  ];
  const c2: Pt = [
    (d3 * d3 * p1[0] - d2 * d2 * p3[0] + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2[0]) / (3 * d3 * (d3 + d2)),
    (d3 * d3 * p1[1] - d2 * d2 * p3[1] + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2[1]) / (3 * d3 * (d3 + d2)),
  ];
  return [c1, c2];
}

/** A smooth path through the points: open (ends at the last point) or closed (back to the first). */
export function curveThrough(points: readonly Pt[], closed = false): string {
  if (points.length < 2) return '';
  if (points.length === 2 && !closed) return `M${fmt(points[0][0])} ${fmt(points[0][1])}L${fmt(points[1][0])} ${fmt(points[1][1])}`;
  const n = points.length;
  const at = (i: number): Pt => {
    if (closed) return points[((i % n) + n) % n];
    if (i < 0) return [2 * points[0][0] - points[1][0], 2 * points[0][1] - points[1][1]];
    if (i >= n) return [2 * points[n - 1][0] - points[n - 2][0], 2 * points[n - 1][1] - points[n - 2][1]];
    return points[i];
  };
  let d = `M${fmt(points[0][0])} ${fmt(points[0][1])}`;
  const segments = closed ? n : n - 1;
  for (let i = 0; i < segments; i++) {
    const [c1, c2] = controls(at(i - 1), at(i), at(i + 1), at(i + 2));
    const end = at(i + 1);
    d += `C${fmt(c1[0])} ${fmt(c1[1])} ${fmt(c2[0])} ${fmt(c2[1])} ${fmt(end[0])} ${fmt(end[1])}`;
  }
  return closed ? `${d}Z` : d;
}

/** Points around a superellipse: |x/rx|^n + |y/ry|^n = 1. Exponent 2 is an ellipse, 4 the soft square. */
export function superellipsePoints(cx: number, cy: number, rx: number, ry: number, exponent = 4, count = 32): Pt[] {
  const points: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    points.push([
      cx + rx * Math.sign(c) * Math.abs(c) ** (2 / exponent),
      cy + ry * Math.sign(s) * Math.abs(s) ** (2 / exponent),
    ]);
  }
  return points;
}

/** An arc of a circle, as path data; angles in degrees, 0 at three o'clock, clockwise. */
export function arc(cx: number, cy: number, r: number, from: number, to: number): string {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const sweep = to - from;
  const start: Pt = [cx + r * Math.cos(rad(from)), cy + r * Math.sin(rad(from))];
  const end: Pt = [cx + r * Math.cos(rad(to)), cy + r * Math.sin(rad(to))];
  const large = Math.abs(sweep) > 180 ? 1 : 0;
  const clockwise = sweep >= 0 ? 1 : 0;
  return `M${fmt(start[0])} ${fmt(start[1])}A${fmt(r)} ${fmt(r)} 0 ${large} ${clockwise} ${fmt(end[0])} ${fmt(end[1])}`;
}
