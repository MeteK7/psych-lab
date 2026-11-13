import { Polyline, flattenPath } from '../generation/curves';
import { deriveSeed } from '../generation/random';
import { generate, generateEdge } from '../generation/registry';
import type { Box } from './bounds';
import type { SceneDefinition, SceneElement } from './scene';

/**
 * A form's outline as polylines, and the geometry measured on it: shared by the spacing check
 * (M3) and hit testing (M4, interaction/). In scene units.
 */
export type Form = Exclude<SceneElement, { kind: 'label' }>;
export type Pt = readonly [number, number];

/**
 * A form's outline. `asDrawn`: a plane drawn by its top edge is only that edge (what the eye sees
 * as its line); otherwise the whole form (what a pointer can land on).
 */
export function formOutline(scene: SceneDefinition, form: Form, asDrawn = true): Polyline[] {
  const seed = deriveSeed(scene.seed ?? scene.id, form.id);
  if (asDrawn && form.style.edge === 'top') {
    if (form.kind === 'generated') {
      const edge = generateEdge(form.generator, form.params, seed);
      return edge ? flattenPath(edge) : [];
    }
    if (form.geometry.type === 'rect') {
      const { x, y, width } = form.geometry;
      return [{ points: [[x, y], [x + width, y]], closed: false }];
    }
  }
  if (form.kind === 'generated') return flattenPath(generate(form.generator, form.params, seed));
  const g = form.geometry;
  switch (g.type) {
    case 'line':
      return [{ points: [[g.x1, g.y1], [g.x2, g.y2]], closed: false }];
    case 'rect': {
      const r = Math.min(g.rx ?? 0, g.width / 2, g.height / 2);
      if (!r) return [{ points: [[g.x, g.y], [g.x + g.width, g.y], [g.x + g.width, g.y + g.height], [g.x, g.y + g.height]], closed: true }];
      const { x, y, width: w, height: h } = g;
      return flattenPath(
        `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} ` +
          `H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`,
      );
    }
    case 'circle':
      return flattenPath(`M${g.cx - g.r} ${g.cy} A${g.r} ${g.r} 0 1 0 ${g.cx + g.r} ${g.cy} A${g.r} ${g.r} 0 1 0 ${g.cx - g.r} ${g.cy} Z`);
    case 'ellipse':
      return flattenPath(`M${g.cx - g.rx} ${g.cy} A${g.rx} ${g.ry} 0 1 0 ${g.cx + g.rx} ${g.cy} A${g.rx} ${g.ry} 0 1 0 ${g.cx - g.rx} ${g.cy} Z`);
    case 'path':
      return flattenPath(g.d);
  }
}

export function pointToSegment(p: Pt, a: Pt, b: Pt): number {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length)) : 0;
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

export function pointToBox(p: Pt, b: Box): number {
  const dx = Math.max(b.x - p[0], 0, p[0] - (b.x + b.width));
  const dy = Math.max(b.y - p[1], 0, p[1] - (b.y + b.height));
  return Math.hypot(dx, dy);
}

/** How far a point is from an outline's lines. */
export function distanceToOutline(p: Pt, lines: readonly Polyline[]): number {
  let d = Infinity;
  for (const { points, closed } of lines) {
    const n = closed ? points.length : points.length - 1;
    for (let k = 0; k < n; k++) d = Math.min(d, pointToSegment(p, points[k], points[(k + 1) % points.length]));
  }
  return d;
}

/** Even-odd: whether a point lies inside the closed polylines. */
export function insideOutline(p: Pt, lines: readonly Polyline[]): boolean {
  let hit = false;
  for (const { points, closed } of lines) {
    if (!closed) continue;
    for (let k = 0, j = points.length - 1; k < points.length; j = k++) {
      const [a, b] = [points[k], points[j]];
      if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit;
    }
  }
  return hit;
}
