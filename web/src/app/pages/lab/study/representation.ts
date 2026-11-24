/**
 * STUDY CODE (docs/visual-study, decision D3): the representation the study wrote, v0 to v0.2
 * (docs/visual-study/representation-v0.md). It specified the engine's contract (S12, Stage 3 M1), and
 * since Stage 3 M3 the study's representations are v1 representations: these are the engine's types,
 * named as the study names them.
 */
import type { Representation } from '../../../shared/visual';

export type { Asks, Commitment, ElementKind, Facets, Predicate, RepElement, Representation, Stance, Statement } from '../../../shared/visual';
export { ESTABLISHED, FORM_FEATURES, drawable, find, isEstablished } from '../../../shared/visual';

/** The words beside a representation: element names and possibility wordings, by key. Never inside it. */
export type Words = Readonly<Record<string, string>>;

export function statement(rep: Representation, id: string): Representation['statements'][number] {
  const s = rep.statements.find((x) => x.id === id);
  if (!s) throw new Error(`${rep.id}: no statement '${id}'`);
  return s;
}

export function element(rep: Representation, id: string): Representation['elements'][number] {
  const e = rep.elements.find((x) => x.id === id);
  if (!e) throw new Error(`${rep.id}: no element '${id}'`);
  return e;
}
