import { V3, mixV } from './camera';

/**
 * S2 Generation, spatial: drawing order for what stands in a room (painter's order), by horizontal
 * slabs. The space is cut at a few heights (a seat, a table top); every face and part is cut at
 * those heights too, and drawn slab by slab, from the floor up, far to near within a slab.
 *
 * For a camera above every cut, this order is exact between slabs: something above a horizontal
 * plane can only hide what lies below it, never the other way round. Within one slab, sorting by
 * depth is enough for the furniture and people of a room. It is what keeps a knee under the table
 * and a thigh on its seat, which depth alone gets wrong at some angles.
 */

/** Which slab a height falls in: 0 below the first cut, and so on. A point on a cut belongs below it. */
export function slabOf(y: number, cuts: readonly number[]): number {
  let i = 0;
  while (i < cuts.length && y > cuts[i] + 1e-9) i++;
  return i;
}

/**
 * A polygon cut into its parts in each slab (Sutherland–Hodgman against each horizontal plane). With
 * `overlap`, each lower piece reaches that far past its cut, under the piece above it, so the two
 * meet without a hairline seam where anti-aliasing would leave one.
 */
export function splitPolygon(points: readonly V3[], cuts: readonly number[], overlap = 0): { slab: number; pts: V3[] }[] {
  const ys = points.map((p) => p[1]);
  const lo = slabOf(Math.min(...ys), cuts);
  const hi = slabOf(Math.max(...ys), cuts);
  if (lo === hi) return [{ slab: lo, pts: [...points] }];
  const pieces: { slab: number; pts: V3[] }[] = [];
  for (let s = lo; s <= hi; s++) {
    let poly: V3[] = [...points];
    if (s > 0) poly = clipY(poly, cuts[s - 1], true);
    if (s < cuts.length) poly = clipY(poly, s < hi ? cuts[s] + overlap : cuts[s], false);
    if (poly.length >= 3) pieces.push({ slab: s, pts: poly });
  }
  return pieces;
}

function clipY(points: readonly V3[], y: number, keepAbove: boolean): V3[] {
  const inside = (p: V3) => (keepAbove ? p[1] >= y : p[1] <= y);
  const out: V3[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const q = points[(i + 1) % points.length];
    if (inside(p)) out.push(p);
    if (inside(p) !== inside(q)) out.push(mixV(p, q, (y - p[1]) / (q[1] - p[1])));
  }
  return out;
}

/** A segment (with a radius at each end) cut into its pieces in each slab. */
export function splitSegment(from: V3, to: V3, r0: number, r1: number, cuts: readonly number[]): { slab: number; from: V3; to: V3; r0: number; r1: number }[] {
  const crossings = cuts
    .map((y) => (y - from[1]) / (to[1] - from[1]))
    .filter((f) => Number.isFinite(f) && f > 1e-6 && f < 1 - 1e-6)
    .sort((a, b) => a - b);
  const stops = [0, ...crossings, 1];
  const pieces: { slab: number; from: V3; to: V3; r0: number; r1: number }[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, b] = [stops[i], stops[i + 1]];
    const p = mixV(from, to, a);
    const q = mixV(from, to, b);
    pieces.push({ slab: slabOf((p[1] + q[1]) / 2, cuts), from: p, to: q, r0: r0 + (r1 - r0) * a, r1: r0 + (r1 - r0) * b });
  }
  return pieces;
}

/** Things to draw in painter's order: slab by slab from the floor up, and far to near within a slab. */
export function paintersOrder<T extends { slab: number; depth: number }>(items: readonly T[]): T[] {
  return [...items].sort((p, q) => p.slab - q.slab || q.depth - p.depth);
}
