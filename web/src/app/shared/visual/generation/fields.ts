import { Pt, curveThrough } from './curves';
import { fractalNoise2D } from './noise';
import { rng } from './random';

/**
 * S2 Generation: fields (milestone M2, stage B). Seeded 2D noise read as a direction (flow lines)
 * or as a height (contour lines). Both return SVG path data made of several smooth subpaths, in
 * scene units, inside their rectangle. Pure: the same parameters and seed give the same path.
 */

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const inside = (a: Area, [x, y]: Pt) => x >= a.x && x <= a.x + a.width && y >= a.y && y <= a.y + a.height;

/**
 * Flow lines: streamlines through a calm direction field. Lines start at seeded places, follow
 * the field both ways, and stop at the area's edge or before coming closer than `spacing` to a
 * line already drawn, so they never bunch up or cross.
 *
 * - `scale`: the size of the field's features, in scene units (larger is calmer)
 * - `turn`: how far the direction can swing from the main heading, in degrees
 * - `heading`: the main direction, in degrees from three o'clock, clockwise
 */
export function flowLines(
  p: Area & { lines: number; spacing: number; scale: number; turn: number; heading: number; octaves: number; length: number },
  seed: string,
): string {
  const field = fractalNoise2D(`${seed}:field`, p.octaves);
  const angle = (x: number, y: number) =>
    ((p.heading + p.turn * field((x - p.x) / p.scale, (y - p.y) / p.scale)) * Math.PI) / 180;
  const step = Math.max(2, p.spacing / 2);
  const cell = p.spacing;
  const taken = new Map<string, Pt[]>();
  const key = (x: number, y: number) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`;
  const crowded = ([x, y]: Pt, own: Set<Pt>) => {
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++)
        for (const q of taken.get(key(x + i * cell, y + j * cell)) ?? [])
          if (!own.has(q) && Math.hypot(q[0] - x, q[1] - y) < p.spacing) return true;
    return false;
  };

  const next = rng(`${seed}:starts`);
  const paths: string[] = [];
  const maxSteps = Math.max(2, Math.round(p.length / step));
  for (let n = 0, tries = 0; n < p.lines && tries < p.lines * 20; tries++) {
    const start: Pt = [p.x + next() * p.width, p.y + next() * p.height];
    const own = new Set<Pt>();
    if (crowded(start, own)) continue;
    const trace = (direction: 1 | -1): Pt[] => {
      const points: Pt[] = [];
      let at = start;
      for (let s = 0; s < maxSteps / 2; s++) {
        const a = angle(at[0], at[1]);
        const to: Pt = [at[0] + direction * step * Math.cos(a), at[1] + direction * step * Math.sin(a)];
        if (!inside(p, to) || crowded(to, own)) break;
        points.push(to);
        own.add(to);
        at = to;
      }
      return points;
    };
    own.add(start);
    const back = trace(-1).reverse();
    const forward = trace(1);
    const line = [...back, start, ...forward];
    if (line.length < 4) continue;
    for (const q of line) {
      const k = key(q[0], q[1]);
      taken.set(k, [...(taken.get(k) ?? []), q]);
    }
    paths.push(curveThrough(line));
    n++;
  }
  return paths.join('');
}

/**
 * Contour lines: where a calm height field crosses each of `levels` evenly spaced heights, like the
 * lines on a map. Traced on a grid (marching squares, `cell` units apart), joined into lines, and
 * drawn as smooth curves.
 *
 * - `scale`: the size of the hills and hollows, in scene units
 */
export function contours(p: Area & { levels: number; scale: number; octaves: number; cell: number }, seed: string): string {
  const height = fractalNoise2D(`${seed}:height`, p.octaves);
  const cols = Math.max(2, Math.round(p.width / p.cell));
  const rows = Math.max(2, Math.round(p.height / p.cell));
  const dx = p.width / cols;
  const dy = p.height / rows;
  const value: number[][] = [];
  for (let j = 0; j <= rows; j++) {
    value.push([]);
    for (let i = 0; i <= cols; i++) value[j].push(height((i * dx) / p.scale, (j * dy) / p.scale));
  }
  const corner = (i: number, j: number): Pt => [p.x + i * dx, p.y + j * dy];
  const lerp = (a: Pt, b: Pt, va: number, vb: number, level: number): Pt => {
    const t = va === vb ? 0.5 : (level - va) / (vb - va);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };

  const paths: string[] = [];
  for (let l = 1; l <= p.levels; l++) {
    const level = -0.6 + (1.2 * l) / (p.levels + 1);
    // Each crossing point is keyed by the grid edge it sits on, so segments join exactly.
    const segments: [string, string][] = [];
    const points = new Map<string, Pt>();
    const edge = (name: string, a: Pt, b: Pt, va: number, vb: number) => {
      points.set(name, lerp(a, b, va, vb, level));
      return name;
    };
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const [v0, v1, v2, v3] = [value[j][i], value[j][i + 1], value[j + 1][i + 1], value[j + 1][i]];
        const [c0, c1, c2, c3] = [corner(i, j), corner(i + 1, j), corner(i + 1, j + 1), corner(i, j + 1)];
        const crossings: string[] = [];
        if (v0 < level !== v1 < level) crossings.push(edge(`h${i},${j}`, c0, c1, v0, v1));
        if (v1 < level !== v2 < level) crossings.push(edge(`v${i + 1},${j}`, c1, c2, v1, v2));
        if (v3 < level !== v2 < level) crossings.push(edge(`h${i},${j + 1}`, c3, c2, v3, v2));
        if (v0 < level !== v3 < level) crossings.push(edge(`v${i},${j}`, c0, c3, v0, v3));
        if (crossings.length === 2) segments.push([crossings[0], crossings[1]]);
        else if (crossings.length === 4) {
          // A saddle: decide by the centre value, so the lines don't cross.
          const centre = (v0 + v1 + v2 + v3) / 4 < level;
          const first = v0 < level === centre;
          segments.push(first ? [crossings[0], crossings[1]] : [crossings[0], crossings[3]]);
          segments.push(first ? [crossings[2], crossings[3]] : [crossings[1], crossings[2]]);
        }
      }
    // Join segments that share a crossing into lines.
    const ends = new Map<string, number[]>();
    segments.forEach(([a, b], k) => {
      for (const e of [a, b]) ends.set(e, [...(ends.get(e) ?? []), k]);
    });
    const used = new Set<number>();
    for (let k = 0; k < segments.length; k++) {
      if (used.has(k)) continue;
      used.add(k);
      const chain = [segments[k][0], segments[k][1]];
      for (const grow of ['end', 'start'] as const) {
        for (;;) {
          const tip = grow === 'end' ? chain[chain.length - 1] : chain[0];
          const nextSeg = (ends.get(tip) ?? []).find((s) => !used.has(s));
          if (nextSeg === undefined) break;
          used.add(nextSeg);
          const [a, b] = segments[nextSeg];
          const other = a === tip ? b : a;
          if (grow === 'end') chain.push(other);
          else chain.unshift(other);
        }
      }
      const closed = chain.length > 3 && chain[0] === chain[chain.length - 1];
      const line = (closed ? chain.slice(0, -1) : chain).map((name) => points.get(name)!);
      if (line.length >= 3) paths.push(curveThrough(line, closed));
    }
  }
  return paths.join('');
}
