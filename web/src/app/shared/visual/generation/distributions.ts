import { Pt, fmt } from './curves';
import { rng } from './random';

/**
 * S2 Generation: distributions (milestone M2, stage C). Seeded point sets that cover an area
 * evenly without looking regular. Pure: the same parameters and seed give the same points.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Evenly spread random points (Bridson's Poisson-disc sampling): no two closer than `spacing`,
 * and no gap much larger than twice that, inside the rectangle, or inside the ellipse that fits
 * it when `round` is set. At most `max` points.
 */
export function poissonDisc(area: Rect & { spacing: number; max: number; round?: boolean }, seed: string): Pt[] {
  const next = rng(seed);
  const { x, y, width, height, spacing } = area;
  const cell = spacing / Math.SQRT2;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const grid = new Array<number>(cols * rows).fill(-1);
  const points: Pt[] = [];
  const active: number[] = [];
  const within = ([px, py]: Pt) => {
    if (px < x || px > x + width || py < y || py > y + height) return false;
    if (!area.round) return true;
    const [nx, ny] = [(px - x - width / 2) / (width / 2), (py - y - height / 2) / (height / 2)];
    return nx * nx + ny * ny <= 1;
  };
  const slot = ([px, py]: Pt) => Math.floor((py - y) / cell) * cols + Math.floor((px - x) / cell);
  const fits = (p: Pt) => {
    const ci = Math.floor((p[0] - x) / cell);
    const cj = Math.floor((p[1] - y) / cell);
    for (let j = Math.max(0, cj - 2); j <= Math.min(rows - 1, cj + 2); j++)
      for (let i = Math.max(0, ci - 2); i <= Math.min(cols - 1, ci + 2); i++) {
        const k = grid[j * cols + i];
        if (k >= 0 && Math.hypot(points[k][0] - p[0], points[k][1] - p[1]) < spacing) return false;
      }
    return true;
  };
  const add = (p: Pt) => {
    grid[slot(p)] = points.length;
    active.push(points.length);
    points.push(p);
  };

  // Start near the middle, so the first point is never at a corner.
  let first: Pt = [x + width / 2, y + height / 2];
  for (let t = 0; t < 30; t++) {
    const p: Pt = [x + width * (0.4 + 0.2 * next()), y + height * (0.4 + 0.2 * next())];
    if (within(p)) {
      first = p;
      break;
    }
  }
  add(first);
  while (active.length && points.length < area.max) {
    const pick = Math.floor(next() * active.length);
    const from = points[active[pick]];
    let placed = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      const angle = next() * Math.PI * 2;
      const distance = spacing * (1 + next());
      const p: Pt = [from[0] + Math.cos(angle) * distance, from[1] + Math.sin(angle) * distance];
      if (within(p) && fits(p)) {
        add(p);
        placed = true;
        break;
      }
    }
    if (!placed) active.splice(pick, 1);
  }
  return points;
}

/** A grid of points, each moved at random within its cell by up to `jitter` (0 to 0.5 of a cell). */
export function jitteredGrid(area: Rect & { spacing: number; jitter: number }, seed: string): Pt[] {
  const next = rng(seed);
  const jitter = Math.min(0.5, Math.max(0, area.jitter));
  const cols = Math.max(1, Math.floor(area.width / area.spacing));
  const rows = Math.max(1, Math.floor(area.height / area.spacing));
  const sx = area.width / cols;
  const sy = area.height / rows;
  const points: Pt[] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++)
      points.push([area.x + (i + 0.5 + (next() * 2 - 1) * jitter) * sx, area.y + (j + 0.5 + (next() * 2 - 1) * jitter) * sy]);
  return points;
}

/** Points as path data for small dots of radius `r` (two arcs each), to fill with the `solid` material. */
export function dotsPath(points: readonly Pt[], r: number): string {
  return points
    .map(([cx, cy]) => `M${fmt(cx - r)} ${fmt(cy)}a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(2 * r)} 0a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(-2 * r)} 0`)
    .join('');
}
