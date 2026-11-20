import type { Geometry, Point, Purpose, PurposeKind, SceneElement } from '../../../../shared/visual/composition/scene';
import type { LabelTone, StyleRef } from '../../../../shared/visual/styling/vocabulary';

/**
 * STUDY CODE: element helpers. Every element cites what it stands for (rule C4): statement ids, or
 * `base:<what>` for a declared neutral base. The citation leads its purpose's `why`, as
 * `[s1,q3] …`, so the study spec can read it back.
 */
export type Cites = readonly string[];

export function purpose(cites: Cites, why: string, serves: readonly PurposeKind[] = ['concept']): Purpose {
  return { serves, why: `[${cites.join(',')}] ${why}` };
}

/** The citations an element's purpose begins with. */
export function citesOf(p: Purpose): string[] {
  const m = /^\[([^\]]*)\]/.exec(p.why);
  return m ? m[1].split(',').filter(Boolean) : [];
}

type Extra = Partial<Pick<Extract<SceneElement, { kind: 'shape' }>, 'grounds' | 'overlapOf' | 'moves'>>;

export function shape(id: string, geometry: Geometry, style: StyleRef, cites: Cites, why: string, extra: Extra = {}, serves?: readonly PurposeKind[]): SceneElement {
  return { kind: 'shape', id, geometry, style, purpose: purpose(cites, why, serves), ...extra };
}

export function path(id: string, d: string, style: StyleRef, cites: Cites, why: string, extra: Extra = {}, serves?: readonly PurposeKind[]): SceneElement {
  return shape(id, { type: 'path', d }, style, cites, why, extra, serves);
}

export function label(
  id: string,
  key: string,
  at: Point,
  align: 'start' | 'middle' | 'end',
  cites: Cites,
  why: string,
  options: { tone?: LabelTone; names?: readonly string[]; halo?: boolean; width?: number } = {},
): SceneElement {
  return {
    kind: 'label',
    id,
    text: key,
    at,
    align,
    ...(options.tone ? { tone: options.tone } : {}),
    ...(options.names?.length ? { names: options.names } : {}),
    ...(options.halo ? { halo: true } : {}),
    ...(options.width ? { width: options.width } : {}),
    purpose: purpose(cites, why, ['understanding']),
  };
}

/** Rounds to hundredths, so paths stay short and the same inputs give the same bytes. */
export const r2 = (n: number) => Math.round(n * 100) / 100;
