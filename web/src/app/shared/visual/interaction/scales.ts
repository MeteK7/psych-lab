import type { ScaleDef, ScaleValue } from '../composition/scene';

/**
 * S6 Interaction: scales (milestone M4, docs/visual-system.md §14). A scale maps a value the
 * exercise holds to a position along one axis of a figure, in scene units, and a position back to
 * the value it stands for: clamped to the scale's ends and snapped to its steps, so a figure only
 * ever reports a value the exercise can keep. Pure: no Angular, no DOM.
 */

/** Rounds away float noise, so 0.1 + 0.2 steps give 0.3. */
const clean = (v: number) => Number(v.toFixed(10));
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, Math.min(a, b)), Math.max(a, b));

/** The largest whole number of steps from the start that stays within the domain. */
function steps(scale: Extract<ScaleDef, { kind: 'linear' }>): number {
  const [d0, d1] = scale.domain;
  return Math.floor(clean(Math.abs(d1 - d0) / scale.step!));
}

/** Where a value sits along the axis; null for a value the scale doesn't have. */
export function positionOf(scale: ScaleDef, value: ScaleValue): number | null {
  const [r0, r1] = scale.range;
  if (scale.kind === 'points') {
    const i = scale.values.indexOf(value);
    return i < 0 ? null : scale.values.length === 1 ? r0 : r0 + (i / (scale.values.length - 1)) * (r1 - r0);
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const [d0, d1] = scale.domain;
  const t = (clamp(value, d0, d1) - d0) / (d1 - d0);
  return clean(r0 + t * (r1 - r0));
}

/** The value a position stands for: clamped to the scale's ends, snapped to its steps or points. */
export function valueAt(scale: ScaleDef, position: number): ScaleValue {
  const [r0, r1] = scale.range;
  const t = clamp((position - r0) / (r1 - r0), 0, 1);
  if (scale.kind === 'points') return scale.values[Math.round(t * (scale.values.length - 1))];
  const [d0, d1] = scale.domain;
  const v = d0 + t * (d1 - d0);
  if (!scale.step) return clean(v);
  const n = Math.min(Math.max(Math.round((v - d0) / (Math.sign(d1 - d0) * scale.step)), 0), steps(scale));
  return clean(d0 + Math.sign(d1 - d0) * n * scale.step);
}

/**
 * The value `by` steps on from `value` (keyboard: an arrow is one step, Page Up and Down several),
 * held at the ends. A scale without steps moves by a hundredth of its domain.
 */
export function stepFrom(scale: ScaleDef, value: ScaleValue, by: number): ScaleValue {
  if (scale.kind === 'points') {
    const i = Math.max(0, scale.values.indexOf(value));
    return scale.values[Math.min(Math.max(i + by, 0), scale.values.length - 1)];
  }
  const [d0, d1] = scale.domain;
  const size = scale.step ?? Math.abs(d1 - d0) / 100;
  const v = typeof value === 'number' ? value : d0;
  return valueAt(scale, positionOf(scale, clean(clamp(v + Math.sign(d1 - d0) * by * size, d0, d1)))!);
}

/** The first and last value of a scale (keyboard: Home and End). */
export function endsOf(scale: ScaleDef): [ScaleValue, ScaleValue] {
  if (scale.kind === 'points') return [scale.values[0], scale.values[scale.values.length - 1]];
  const [d0] = scale.domain;
  return [d0, scale.step ? clean(d0 + Math.sign(scale.domain[1] - d0) * steps(scale) * scale.step) : scale.domain[1]];
}
