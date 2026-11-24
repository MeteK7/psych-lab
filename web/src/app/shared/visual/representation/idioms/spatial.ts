import type { SceneElement } from '../../composition/scene';
import type { V3 } from '../../generation/spatial/camera';
import { Representation, Stance } from '../contract';
import { Key, Space } from '../kit/spatial';

/**
 * S12: the spatial scene idiom (Stage 3, M3; the representation study's idioms.md, S1–S9): a
 * constructed place in perspective, still, made of forms, with a viewpoint the person moves along one
 * path, built on the engine's spatial geometry (kit/spatial.ts).
 */
/** What the engine's spatial patterns read. An application's own patterns may extend it. */
export interface SpatialTuning {
  /** S7: a key per stance; replaced whole by a finish. */
  keys: Partial<Record<Stance, Key>>;
  /** C8. */
  labels: boolean;
  /**
   * Revision 7 (composition): additions drawn into a base pattern's scene, given where it placed its
   * elements. Only composition (compose.ts) sets it; unset, a figure is drawn exactly as before.
   */
  add3?: (space: Space, anchors: Readonly<Record<string, V3>>) => SceneElement[];
}

export const SPATIAL_RULES: SpatialTuning = {
  keys: {},
  labels: true,
};

/** A box's eight corners. */
export function corners(min: V3, max: V3): V3[] {
  const out: V3[] = [];
  for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) out.push([x, y, z]);
  return out;
}

export function centreOf(points: readonly V3[]): V3 {
  return [0, 1, 2].map((k) => points.reduce((s, p) => s + p[k], 0) / points.length) as unknown as V3;
}

export function stances(c: { rep: Representation }): readonly Stance[] {
  return c.rep.facets.space?.viewpoints ?? ['across'];
}

export function keysFor(c: { rep: Representation }, t: SpatialTuning, rules: Partial<Record<Stance, Key>>): Key[] {
  // Revision 7: a stance a pattern has no camera for falls back to its first one (was: across, or nothing).
  return stances(c).map((s) => t.keys[s] ?? rules[s] ?? rules.across ?? Object.values(rules)[0]!);
}
