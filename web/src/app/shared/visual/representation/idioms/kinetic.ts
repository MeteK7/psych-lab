import type { SceneElement } from '../../composition/scene';
import { Representation, Statement } from '../contract';
import { r2, shape } from '../kit/elements';
import { Pt, ease } from '../kit/paths';
import { FRAME } from '../kit/spatial';

/**
 * S12: the kinetic sequence idiom (Stage 3, M3; the representation study's idioms.md, K1–K11): flat,
 * moving, made of forms, direct, a fixed viewpoint: the tuning its patterns read (every number a rule
 * sets, so hand finishing is a list of changes to it), and the parts the engine's patterns and an
 * application's prepared compositions share.
 */
/** R4-4 candidates: the current fixed size; (a) that size with "not to scale"; (b) a range; (c) a break. */
export type Unscaled = 'constant' | 'labelled' | 'range' | 'break';

/** What the engine's kinetic patterns read. An application's own patterns may extend it. */
export interface KineticTuning {
  /** K3: one step of a sequence, ms. */
  stepMs: number;
  /** K2: a presence's radius. */
  radius: number;
  /** K4: traces of the way so far. */
  traces: boolean;
  /** C8: labels on forms that would be ambiguous without them. */
  labelForms: boolean;
  /**
   * R4-4, adopted for this idiom (2026-11-21): an amount the text doesn't give is drawn as a range, open
   * where the amount is unknown.
   */
  unscaled: Unscaled;
  /**
   * The size an unspecified amount takes where one is drawn (the constant, `break`, `labelled`), as a
   * multiple of the rule constant. Under `range` nothing may depend on it.
   */
  unspecified: number;
}

export const KINETIC_RULES: KineticTuning = {
  stepMs: 1300,
  radius: 22,
  traces: true,
  labelForms: true,
  unscaled: 'range',
  unspecified: 1,
};

export const CX = FRAME.width / 2;
export const CY = FRAME.height / 2;

/** A presence as a flat form (K2, C2, C3): the own one lit in the area colour; another, the ground with a context line. Round: no facing. */
export function presence(id: string, at: Pt, r: number, own: boolean, cites: readonly string[], why: string): SceneElement[] {
  const g = { type: 'circle' as const, cx: r2(at[0]), cy: r2(at[1]), r };
  if (own) return [shape(id, g, { role: 'subject', material: 'lit', line: 'regular' }, cites, why)];
  return [shape(`${id}-back`, g, { role: 'ground', material: 'tonal' }, ['base:ground'], 'Keeps the form solid over the traces behind it.', {}, ['understanding']), shape(id, g, { role: 'context', line: 'regular' }, cites, why)];
}

export function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const R = Math.min(r, w / 2, h / 2);
  const f = r2;
  return `M${f(x + R)} ${f(y)}L${f(x + w - R)} ${f(y)}A${f(R)} ${f(R)} 0 0 1 ${f(x + w)} ${f(y + R)}L${f(x + w)} ${f(y + h - R)}A${f(R)} ${f(R)} 0 0 1 ${f(x + w - R)} ${f(y + h)}L${f(x + R)} ${f(y + h)}A${f(R)} ${f(R)} 0 0 1 ${f(x)} ${f(y + h - R)}L${f(x)} ${f(y + R)}A${f(R)} ${f(R)} 0 0 1 ${f(x + R)} ${f(y)}Z`;
}

/** Plural presences: `several` is four forms, `many` twelve (slice-2 common rule). */
export function countOf(c: { rep: Representation }, id: string): number {
  const n = c.rep.elements.find((e) => e.id === id)?.count;
  return n === undefined ? 1 : n === 'several' ? 4 : n === 'many' ? 12 : n;
}

/** K8: a possibility set as equal translucent marks on a ring, grown in after the movement. */
export function ring(set: Statement | undefined, centre: Pt, radius: number, mark: number, g: number, also: readonly string[]): SceneElement[] {
  if (!set || set.say.p !== 'alternatives' || g <= 0) return [];
  const n = set.say.options.length;
  return Array.from({ length: n }, (_, k) => {
    const a = -Math.PI / 2 + (k / n) * Math.PI * 2;
    return shape(`possible-${k + 1}`, { type: 'circle', cx: r2(centre[0] + Math.cos(a) * radius), cy: r2(centre[1] + Math.sin(a) * radius), r: r2(mark * ease.arrive(g)) }, { role: 'context', material: 'translucent', line: 'hair' }, [set.id, ...also], 'One of the possible explanations: equal in size, weight and distance to every other, none chosen.');
  });
}

/** R4-4 range: a band from `from` toward `to`, its near end rounded and its far end left open. */
export function openRange(from: number, to: number, top: number, bottom: number, r: number): string {
  const d = Math.sign(to - from) || 1;
  const sweep = d > 0 ? 0 : 1;
  return `M${r2(to)} ${r2(top)}H${r2(from + d * r)}A${r} ${r} 0 0 ${sweep} ${r2(from)} ${r2(top + r)}V${r2(bottom - r)}A${r} ${r} 0 0 ${sweep} ${r2(from + d * r)} ${r2(bottom)}H${r2(to)}`;
}
