import type { ElementId, ScaleValue, SceneDefinition, Target } from '../composition/scene';
import type { Pt } from '../composition/outline';
import { Hit, TargetArea, hitTest, placeAt } from './regions';
import { endsOf, positionOf, stepFrom } from './scales';

/**
 * S6 Interaction: what pointer and keyboard input does to a figure's values (milestone M4 stage B).
 * Pure: points are in scene units (`toScenePoint`), keys are `KeyboardEvent.key` names, and values
 * are the exercise's own, by name, never positions. The integration layer keeps the state between
 * events, captures the pointer, and hands the new values to the exercise, which draws the figure
 * again from them; so a handle is always drawn where its value is, snapped as it moves.
 *
 * A handle can be moved three ways, each without the others:
 * - dragged: press, move, release; Escape while dragging puts the value back;
 * - pressed on its track: the handle goes there at once, and a drag can go on from there;
 * - picked up and put down (WCAG 2.5.7, no dragging): a click on the handle picks it up, a click
 *   where it should go puts it there; a click on it again or Escape puts it down unchanged.
 * A region is chosen as a whole by a press on it (stage C).
 */

export type Values = Readonly<Record<string, ScaleValue>>;
type Handle = Extract<Target, { kind: 'handle' }>;

/** How far (scene units) a pressed pointer moves before a click becomes a drag. */
export const DRAG_SLOP = 3;

export type Gesture =
  /** Pressed on a handle or its track. `offset` keeps the handle where it was grabbed. */
  | { kind: 'drag'; handle: ElementId; target: Handle; before: Values; start: Pt; offset: Pt; moved: boolean }
  /** Picked up by a click: the next click in the figure puts it down there. */
  | { kind: 'picked'; handle: ElementId; target: Handle; before: Values }
  /** A drag that Escape ended: nothing happens until the pointer is released. */
  | { kind: 'cancelled' };

export interface InteractionState {
  values: Values;
  gesture: Gesture | null;
}

/** The handle being moved, if any: it takes focal emphasis while it moves. */
export function moving(state: InteractionState): ElementId | null {
  const g = state.gesture;
  return g && g.kind !== 'cancelled' ? g.handle : null;
}

function same(a: Values, b: Values): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((k) => a[k] === b[k]);
}

/** New values, or the same object when nothing changed (so a caller can tell). */
function merged(values: Values, update: Values): Values {
  const next = { ...values, ...update };
  return same(values, next) ? values : next;
}

/** Where a handle is drawn for its values, per axis (the grab offset is measured from here). */
function handleAt(scene: SceneDefinition, target: Handle, values: Values, fallback: Pt): Pt {
  const at = (axis: Handle['x'], i: 0 | 1) => {
    const scale = axis && scene.scales?.[axis.scale];
    const value = axis ? values[axis.value] : undefined;
    const position = scale && value !== undefined ? positionOf(scale, value) : null;
    return position ?? fallback[i];
  };
  return [at(target.x, 0), at(target.y, 1)];
}

/** A primary-button press at `p`. `capture` says whether the figure should capture the pointer. */
export function press(scene: SceneDefinition, targets: readonly TargetArea[], state: InteractionState, p: Pt): { state: InteractionState; capture: boolean } {
  const g = state.gesture;
  // Picked up: this click puts the handle down where it lands, held to its scales.
  if (g?.kind === 'picked') return { state: { values: merged(state.values, placeAt(scene, g.target, p)), gesture: null }, capture: false };
  const hit: Hit | null = hitTest(targets, p);
  if (hit?.kind === 'handle') {
    const at = handleAt(scene, hit.target, state.values, p);
    const gesture: Gesture = { kind: 'drag', handle: hit.id, target: hit.target, before: state.values, start: p, offset: [at[0] - p[0], at[1] - p[1]], moved: false };
    return { state: { values: state.values, gesture }, capture: true };
  }
  if (hit?.kind === 'region') {
    // A region is chosen as a whole, on the press.
    return { state: { values: merged(state.values, { [hit.target.value]: hit.target.option }), gesture: null }, capture: false };
  }
  if (hit?.kind === 'track') {
    // The handle goes where the track was pressed; a drag goes on from there, with no offset.
    const values = merged(state.values, placeAt(scene, hit.target, p));
    const gesture: Gesture = { kind: 'drag', handle: hit.handle, target: hit.target, before: state.values, start: p, offset: [0, 0], moved: true };
    return { state: { values, gesture }, capture: true };
  }
  return { state, capture: false };
}

/** The pressed pointer moved to `p`: a drag follows it, snapped by the scales. */
export function move(scene: SceneDefinition, state: InteractionState, p: Pt): InteractionState {
  const g = state.gesture;
  if (g?.kind !== 'drag') return state;
  if (!g.moved && Math.hypot(p[0] - g.start[0], p[1] - g.start[1]) < DRAG_SLOP) return state;
  const values = merged(state.values, placeAt(scene, g.target, [p[0] + g.offset[0], p[1] + g.offset[1]]));
  return { values, gesture: g.moved ? g : { ...g, moved: true } };
}

/** The pointer was released: a drag ends where it is; a click on a handle picks it up. */
export function release(state: InteractionState): InteractionState {
  const g = state.gesture;
  if (g?.kind === 'drag' && !g.moved) return { values: state.values, gesture: { kind: 'picked', handle: g.handle, target: g.target, before: g.before } };
  if (g?.kind === 'drag' || g?.kind === 'cancelled') return { values: state.values, gesture: null };
  return state;
}

/** Escape: a drag or a pick-up ends and the value goes back to what it was. `handled` when it did something. */
export function escape(state: InteractionState, pointerDown: boolean): { state: InteractionState; handled: boolean } {
  const g = state.gesture;
  if (!g || g.kind === 'cancelled') return { state, handled: false };
  const values = merged(state.values, g.before);
  return { state: { values, gesture: g.kind === 'drag' && pointerDown ? { kind: 'cancelled' } : null }, handled: true };
}

/**
 * The pointer went away without a release (the system took it, or the figure lost capture): the
 * handle stays where it is, as a native slider does. A pick-up waits for its next click.
 */
export function lost(state: InteractionState): InteractionState {
  const g = state.gesture;
  return g?.kind === 'drag' || g?.kind === 'cancelled' ? { values: state.values, gesture: null } : state;
}

/** A pick-up that a click outside the figure, or leaving it by keyboard, ends: put down unchanged. */
export function putDown(state: InteractionState): InteractionState {
  const g = state.gesture;
  return g?.kind === 'picked' ? { values: merged(state.values, g.before), gesture: null } : state;
}

/**
 * A key on one axis of a handle the figure is itself the control for (one focus stop per axis).
 * Arrows step one step (Right and Up larger; on a handle with two axes, each stop takes only the
 * arrows of its own direction, which move the handle that way on screen); Page Up and Page Down a
 * tenth of the scale, at least one step; Home and End go to the ends. Null for any other key.
 */
export function keyStep(scene: SceneDefinition, target: Handle, axis: 'x' | 'y', values: Values, key: string): Values | null {
  const a = target[axis];
  const scale = a && scene.scales?.[a.scale];
  if (!a || !scale) return null;
  const value = values[a.value] ?? endsOf(scale)[0];
  const both = !!target.x && !!target.y;
  // On screen: does a larger value lie further right (x) or further up (y)?
  const [r0, r1] = scale.range;
  const forward = axis === 'x' ? Math.sign(r1 - r0) : Math.sign(r0 - r1);
  const count = scale.kind === 'points' ? scale.values.length - 1 : scale.step ? Math.abs(scale.domain[1] - scale.domain[0]) / scale.step : 100;
  const page = Math.max(1, Math.round(count / 10));
  let next: ScaleValue | null = null;
  const arrows: Record<string, number> = both
    ? axis === 'x'
      ? { ArrowRight: forward, ArrowLeft: -forward }
      : { ArrowUp: forward, ArrowDown: -forward }
    : { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };
  if (key in arrows) next = stepFrom(scale, value, arrows[key]);
  else if (key === 'PageUp' || key === 'PageDown') next = stepFrom(scale, value, key === 'PageUp' ? page : -page);
  else if (key === 'Home' || key === 'End') next = endsOf(scale)[key === 'Home' ? 0 : 1];
  if (next === null) return null;
  return merged(values, { [a.value]: next });
}

/**
 * A key on one option of a choice the figure is itself the control for (a radio group): the arrows
 * move to the next or previous option and choose it, wrapping round; Space chooses the focused one.
 * Gives the option to focus and the new values; null for any other key.
 */
export function keyChoice(value: string, options: readonly ScaleValue[], focused: ScaleValue, values: Values, key: string): { option: ScaleValue; values: Values } | null {
  const i = Math.max(0, options.indexOf(focused));
  const by = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : key === ' ' ? 0 : null;
  if (by === null) return null;
  const option = options[(i + by + options.length) % options.length];
  return { option, values: merged(values, { [value]: option }) };
}
