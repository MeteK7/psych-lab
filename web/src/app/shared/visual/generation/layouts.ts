import { Pt } from './curves';
import { Rect } from './distributions';

/**
 * S2 Generation: layouts (milestone M2, stage C). Where a composition built from data places its
 * elements: positions and sizes, never drawing. Pure and deterministic; none needs a seed.
 * Instruments call these directly (docs/visual-system.md §3.4 rule 5b).
 */

/** `count` cells in rows of `columns`, filling the area, `gap` apart. */
export function gridLayout(p: Rect & { count: number; columns: number; gap: number }): Rect[] {
  const columns = Math.max(1, Math.min(p.columns, p.count));
  const rows = Math.ceil(p.count / columns);
  const width = (p.width - (columns - 1) * p.gap) / columns;
  const height = (p.height - (rows - 1) * p.gap) / rows;
  return Array.from({ length: p.count }, (_, k) => ({
    x: p.x + (k % columns) * (width + p.gap),
    y: p.y + Math.floor(k / columns) * (height + p.gap),
    width,
    height,
  }));
}

/** `count` places evenly around a circle, the first at `start` degrees (default: twelve o'clock), clockwise. */
export function radialLayout(p: { count: number; cx: number; cy: number; r: number; start?: number }): Pt[] {
  const start = ((p.start ?? -90) * Math.PI) / 180;
  return Array.from({ length: p.count }, (_, k) => {
    const a = start + (k * Math.PI * 2) / p.count;
    return [p.cx + p.r * Math.cos(a), p.cy + p.r * Math.sin(a)];
  });
}

/**
 * Items of the given widths in reading order, wrapping into rows `rowHeight` tall that never run
 * wider than the area: like words in a paragraph. Each row is aligned start, middle or end.
 */
export function flowLayout(
  p: Rect & { widths: readonly number[]; rowHeight: number; gap: number; align?: 'start' | 'middle' | 'end' },
): Rect[] {
  const rows: { start: number; end: number; width: number }[] = [];
  let row = { start: 0, end: 0, width: 0 };
  p.widths.forEach((w, k) => {
    const width = Math.min(w, p.width);
    const grown = row.end === row.start ? width : row.width + p.gap + width;
    if (row.end > row.start && grown > p.width) {
      rows.push(row);
      row = { start: k, end: k + 1, width };
    } else {
      row = { start: row.start, end: k + 1, width: grown };
    }
  });
  if (row.end > row.start) rows.push(row);
  const out: Rect[] = [];
  rows.forEach((r, j) => {
    const spare = p.width - r.width;
    let x = p.x + (p.align === 'middle' ? spare / 2 : p.align === 'end' ? spare : 0);
    for (let k = r.start; k < r.end; k++) {
      const width = Math.min(p.widths[k], p.width);
      out.push({ x, y: p.y + j * (p.rowHeight + p.gap), width, height: p.rowHeight });
      x += width + p.gap;
    }
  });
  return out;
}

export interface Circle {
  x: number;
  y: number;
  r: number;
}

/**
 * Circles of the given radii packed closely around a centre, none overlapping (`padding` apart),
 * in the given order: each goes to the free place closest to the centre, touching those already
 * placed. Returns them in the order given.
 */
export function packCircles(p: { radii: readonly number[]; cx: number; cy: number; padding: number }): Circle[] {
  const placed: Circle[] = [];
  const free = (c: Circle) => placed.every((q) => Math.hypot(q.x - c.x, q.y - c.y) >= q.r + c.r + p.padding - 1e-9);
  for (const r of p.radii) {
    if (!placed.length) {
      placed.push({ x: p.cx, y: p.cy, r });
      continue;
    }
    // Candidates touch one placed circle (at fine angles) or two (exactly); the closest free one wins.
    const candidates: Circle[] = [];
    for (const q of placed)
      for (let k = 0; k < 72; k++) {
        const a = (k * Math.PI * 2) / 72;
        const d = q.r + r + p.padding;
        candidates.push({ x: q.x + d * Math.cos(a), y: q.y + d * Math.sin(a), r });
      }
    for (let a = 0; a < placed.length; a++)
      for (let b = a + 1; b < placed.length; b++) candidates.push(...touchingBoth(placed[a], placed[b], r + p.padding).map(([x, y]) => ({ x, y, r })));
    let best: Circle | null = null;
    let bestDistance = Infinity;
    for (const c of candidates) {
      const d = Math.hypot(c.x - p.cx, c.y - p.cy);
      if (d < bestDistance - 1e-9 && free(c)) {
        best = c;
        bestDistance = d;
      }
    }
    placed.push(best ?? { x: p.cx, y: p.cy + placed.reduce((s, q) => s + 2 * q.r + p.padding, 0) + r, r });
  }
  return placed;
}

/** Centres at distance `a.r + extra` from a and `b.r + extra` from b: where a circle touches both. */
function touchingBoth(a: Circle, b: Circle, extra: number): Pt[] {
  const ra = a.r + extra;
  const rb = b.r + extra;
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  if (d === 0 || d > ra + rb || d < Math.abs(ra - rb)) return [];
  const along = (ra * ra - rb * rb + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, ra * ra - along * along));
  const [ux, uy] = [(b.x - a.x) / d, (b.y - a.y) / d];
  const [mx, my] = [a.x + along * ux, a.y + along * uy];
  return [
    [mx - h * uy, my + h * ux],
    [mx + h * uy, my - h * ux],
  ];
}
