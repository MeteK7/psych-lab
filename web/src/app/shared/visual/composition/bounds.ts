import { pathBounds } from '../generation/curves';
import { deriveSeed } from '../generation/random';
import { generate } from '../generation/registry';
import type { SceneDefinition, SceneElement } from './scene';

/** A bounding box in scene units. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * An element's bounding box, for the validator's rules on materials (milestone M3). Labels have
 * none here. Path boxes include control points, so they can be slightly larger than the form.
 */
export function boundsOf(scene: SceneDefinition, element: SceneElement): Box | null {
  if (element.kind === 'label') return null;
  if (element.kind === 'generated') return pathBounds(generate(element.generator, element.params, deriveSeed(scene.seed ?? scene.id, element.id)));
  const g = element.geometry;
  switch (g.type) {
    case 'circle':
      return { x: g.cx - g.r, y: g.cy - g.r, width: 2 * g.r, height: 2 * g.r };
    case 'ellipse':
      return { x: g.cx - g.rx, y: g.cy - g.ry, width: 2 * g.rx, height: 2 * g.ry };
    case 'rect':
      return { x: g.x, y: g.y, width: g.width, height: g.height };
    case 'line':
      return { x: Math.min(g.x1, g.x2), y: Math.min(g.y1, g.y2), width: Math.abs(g.x2 - g.x1), height: Math.abs(g.y2 - g.y1) };
    case 'path':
      return pathBounds(g.d);
  }
}

export function boxesOverlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** A box grown to at least `size` each way, around its centre: a target's least area (M4). */
export function atLeast(box: Box, size: number): Box {
  const width = Math.max(box.width, size);
  const height = Math.max(box.height, size);
  return { x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height };
}
