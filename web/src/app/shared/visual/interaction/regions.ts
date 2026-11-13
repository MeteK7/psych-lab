import type { Polyline } from '../generation/curves';
import { Box, atLeast, boundsOf } from '../composition/bounds';
import { Form, Pt, distanceToOutline, formOutline, insideOutline } from '../composition/outline';
import type { ElementId, ScaleValue, SceneDefinition, StateName, Target } from '../composition/scene';
import { resolveStyle } from '../styling/resolve';
import { MIN_TARGET } from '../styling/vocabulary';
import { valueAt } from './scales';

/**
 * S6 Interaction: targets and hit testing (milestone M4). A point in scene units tells which
 * handle, region or track is under it, from each form's real outline, the topmost first. Pure: the
 * integration layer turns a pointer's position on the page into scene units (`toScenePoint`).
 */

export { MIN_TARGET };

export type Hit =
  | { kind: 'handle'; id: ElementId; target: Extract<Target, { kind: 'handle' }> }
  | { kind: 'region'; id: ElementId; target: Extract<Target, { kind: 'region' }> }
  /** The line or area a handle moves in: a click there places the handle (`handle`) at that point. */
  | { kind: 'track'; id: ElementId; handle: ElementId; target: Extract<Target, { kind: 'handle' }> };

export interface TargetArea {
  hit: Hit;
  outline: Polyline[];
  /** The form's box, grown to at least MIN_TARGET each way around its centre: a small mark is still easy to hit. */
  area: Box;
  /** How far from an open line (or a closed form's edge) still counts as on it. */
  reach: number;
  /** Smaller than MIN_TARGET either way: its least area counts too. */
  small: boolean;
}

/** The targets shown in a state, in drawing order (handles, regions, and the tracks of shown handles). */
export function targetsOf(scene: SceneDefinition, state: StateName): TargetArea[] {
  const visible = new Set(scene.states.states[state]?.visible ?? []);
  const forms = scene.layers.flatMap((l) => l.elements).filter((e): e is Form => e.kind !== 'label' && visible.has(e.id));
  const tracks = new Map<ElementId, { handle: ElementId; target: Extract<Target, { kind: 'handle' }> }>();
  for (const f of forms) if (f.target?.kind === 'handle' && f.target.track) tracks.set(f.target.track, { handle: f.id, target: f.target });
  const areas: TargetArea[] = [];
  for (const form of forms) {
    const track = tracks.get(form.id);
    const hit: Hit | null = form.target
      ? form.target.kind === 'handle'
        ? { kind: 'handle', id: form.id, target: form.target }
        : { kind: 'region', id: form.id, target: form.target }
      : track
        ? { kind: 'track', id: form.id, ...track }
        : null;
    if (!hit) continue;
    const box = boundsOf(scene, form);
    if (!box) continue;
    const outline = formOutline(scene, form, false);
    const open = outline.every((l) => !l.closed);
    areas.push({
      hit,
      outline,
      area: atLeast(box, MIN_TARGET),
      reach: open ? MIN_TARGET / 2 : resolveStyle(form.style).width / 2 + 2,
      small: !open && (box.width < MIN_TARGET || box.height < MIN_TARGET),
    });
  }
  return areas;
}

function contains(b: Box, p: Pt): boolean {
  return p[0] >= b.x && p[0] <= b.x + b.width && p[1] >= b.y && p[1] <= b.y + b.height;
}

/** Whether a point is on a target: inside its form, near its line, or within its least area. */
export function isOn(t: TargetArea, p: Pt): boolean {
  if (insideOutline(p, t.outline) || distanceToOutline(p, t.outline) <= t.reach) return true;
  // The least area makes a small mark easy to hit; a line is reached from either side instead.
  return t.small && contains(t.area, p);
}

/** The topmost target under a point, or null. */
export function hitTest(targets: readonly TargetArea[], p: Pt): Hit | null {
  for (let i = targets.length - 1; i >= 0; i--) if (isOn(targets[i], p)) return targets[i].hit;
  return null;
}

/** The values a handle takes at a point: one per axis, snapped and clamped by its scales. */
export function placeAt(scene: SceneDefinition, target: Extract<Target, { kind: 'handle' }>, p: Pt): Record<string, ScaleValue> {
  const values: Record<string, ScaleValue> = {};
  for (const [axis, at] of [
    [target.x, p[0]],
    [target.y, p[1]],
  ] as const) {
    const scale = axis && scene.scales?.[axis.scale];
    if (axis && scale) values[axis.value] = valueAt(scale, at);
  }
  return values;
}

/**
 * A position on the page (client coordinates) in scene units, for a figure drawn in `rect` at any
 * size: scaled to fit and centred, as an SVG viewBox draws it (`xMidYMid meet`).
 */
export function toScenePoint(client: { x: number; y: number }, rect: { left: number; top: number; width: number; height: number }, frame: { width: number; height: number }): Pt {
  const s = Math.min(rect.width / frame.width, rect.height / frame.height);
  const left = rect.left + (rect.width - frame.width * s) / 2;
  const top = rect.top + (rect.height - frame.height * s) / 2;
  return [(client.x - left) / s, (client.y - top) / s];
}
