import type { Box } from '../composition/bounds';
import type { ElementId, ScaleValue, SceneDefinition, Target, TextLookup } from '../composition/scene';
import { TargetArea } from './regions';
import { endsOf } from './scales';

/**
 * S6 Interaction: the controls a figure stands for (milestone M4 stage C), in words and values, in
 * reading order. Read by the figure when it is itself the control (its focus stops) and by native
 * controls that hold the same values beside it, so both say the same thing. Pure.
 */

type Handle = Extract<Target, { kind: 'handle' }>;

/** One axis of a handle: a slider. */
export interface SliderControl {
  kind: 'slider';
  key: string;
  handle: ElementId;
  target: Handle;
  axis: 'x' | 'y';
  /** The exercise's value it sets. */
  value: string;
  label: string;
  /** Numbers for a slider: the value itself, or its place among a points scale's values. */
  now: number;
  min: number;
  max: number;
  /** A native slider's step; `any` for a scale without steps. */
  step: number | 'any';
  /** For a points scale: its values, which `now` counts through. */
  points?: readonly ScaleValue[];
  text: string;
  orientation: 'horizontal' | 'vertical';
  /** The handle's least area, where its focus stop lies. */
  area: Box;
}

/** The regions that set one value: a radio group. */
export interface ChoiceControl {
  kind: 'choice';
  key: string;
  value: string;
  label: string;
  options: { id: ElementId; option: ScaleValue; label: string; checked: boolean; area: Box }[];
}

export type Control = SliderControl | ChoiceControl;

/** The value a slider's number stands for. */
export function sliderValue(control: SliderControl, n: number): ScaleValue {
  return control.points ? control.points[Math.min(Math.max(Math.round(n), 0), control.points.length - 1)] : n;
}

export function controlsOf(scene: SceneDefinition, targets: readonly TargetArea[], values: Readonly<Record<string, ScaleValue>>, text: TextLookup): Control[] {
  const controls: Control[] = [];
  const choices = new Map<string, ChoiceControl>();
  for (const t of targets) {
    if (t.hit.kind === 'region') {
      const { id, target } = t.hit;
      let choice = choices.get(target.value);
      if (!choice) {
        const words = scene.choices?.[target.value];
        choice = { kind: 'choice', key: target.value, value: target.value, label: (words && text(words.label)) ?? target.value, options: [] };
        choices.set(target.value, choice);
        controls.push(choice);
      }
      choice.options.push({ id, option: target.option, label: text(target.label) ?? String(target.option), checked: values[target.value] === target.option, area: t.area });
      continue;
    }
    if (t.hit.kind !== 'handle') continue;
    const { id, target } = t.hit;
    for (const axis of ['x', 'y'] as const) {
      const a = target[axis];
      const scale = a && scene.scales?.[a.scale];
      if (!a || !scale) continue;
      const value = values[a.value] ?? endsOf(scale)[0];
      const name = text(target.label) ?? '';
      const base = {
        kind: 'slider' as const,
        key: `${id}-${axis}`,
        handle: id,
        target,
        axis,
        value: a.value,
        label: a.label ? `${name}, ${text(a.label) ?? ''}` : name,
        text: String(value),
        orientation: axis === 'x' ? ('horizontal' as const) : ('vertical' as const),
        area: t.area,
      };
      if (scale.kind === 'points') {
        controls.push({ ...base, now: Math.max(0, scale.values.indexOf(value)), min: 0, max: scale.values.length - 1, step: 1, points: scale.values });
      } else {
        const [a0, a1] = endsOf(scale) as [number, number];
        controls.push({ ...base, now: Number(value), min: Math.min(a0, a1), max: Math.max(a0, a1), step: scale.step ?? 'any' });
      }
    }
  }
  return controls;
}
