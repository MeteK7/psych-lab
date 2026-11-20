/**
 * STUDY CODE (docs/visual-study, decision D3): the representation v0 under test, as types. Not the
 * engine's: nothing under shared/visual/ imports it, and Stage 3 would design that layer afresh.
 * Mirrors docs/visual-study/representation-v0.md.
 */

/** How firmly a statement is held, by its relation to the source text (representation-v0.md §1). */
export type Commitment = 'reported' | 'implied' | 'inferred' | 'possible' | 'unknown';

/** Drawn as established: reported, or implied by a licensed pattern. */
export const ESTABLISHED: readonly Commitment[] = ['reported', 'implied'];

export type ElementKind = 'presence' | 'object' | 'place' | 'process' | 'quantity' | 'quality';

export interface RepElement {
  id: string;
  kind: ElementKind;
  salience?: 'primary' | 'equal' | 'secondary';
  /** The viewer's own presence (at most one). */
  own?: boolean;
}

/** What a question asks about. */
export type Asks = 'attention' | 'whether' | 'cause' | 'time' | 'intent' | 'setting' | 'fate';

/** The predicates the four depth cases use (representation-v0.md §3, and two found in pass B). */
export type Predicate =
  | { p: 'passes'; a: string; b: string }
  | { p: 'exchange-absent'; kind: string; from: string; to: string }
  | { p: 'sends'; from: string; item: string; to: string }
  | { p: 'receives'; who: string; item: string }
  /** Found in pass B (G-29): holding or using an object. */
  | { p: 'holds'; who: string; what: string }
  | { p: 'located-in'; what: string; place: string; alone?: boolean }
  | { p: 'apart'; a: string; b: string }
  /** A reported feeling, always the presence's own; `charge` is how much it presses (0–1). */
  | { p: 'feels'; who: string; charge: number }
  | { p: 'flows'; what: string; from: string; to: string }
  | { p: 'joins'; what: string; into: string; at: string }
  | { p: 'cycles'; what: string; through: readonly string[] }
  | { p: 'complete'; what: string }
  | { p: 'precedes'; a: string; b: string }
  | { p: 'depends-on'; what: string; on: string }
  | { p: 'absent'; what: string }
  | { p: 'waiting'; what: string; for: string }
  | { p: 'question'; about: string; asks: Asks }
  | { p: 'alternatives'; question: string; options: readonly string[]; origin: 'person' | 'content' | 'source' }
  // Predicates an interpreter might propose. They appear only as `inferred` statements: no idiom draws them.
  | { p: 'notices'; who: string; whom: string }
  | { p: 'expects'; who: string; what: string }
  | { p: 'intends'; who: string; what: string }
  | { p: 'releases'; what: string; at: string }
  | { p: 'late'; what: string };

export interface Statement {
  id: string;
  say: Predicate;
  commitment: Commitment;
  /** The phases in which it holds; all phases when absent. */
  phases?: readonly string[];
  /** The text span, the licensed pattern, or the content it came from. */
  basis: string;
}

/** Generic viewpoint stances (G-13: the person-centred names of v0 didn't fit a system). */
export type Stance = 'own' | 'behind' | 'across' | 'outside' | 'within' | 'above' | 'front' | 'side';

export interface Facets {
  space?: { setting: 'reported' | 'stand-in'; place?: 'home' | 'open-floor' | 'ground'; viewpoints: readonly Stance[] };
  dynamics?: { pace: 'still' | 'slow' | 'moderate' };
  field?: { quality: 'clarity' | 'density' | 'agitation'; source: string; evolves: boolean };
  metaphor?: { frame: 'path'; stations: readonly string[]; gate: string };
}

export interface Representation {
  id: string;
  elements: readonly RepElement[];
  statements: readonly Statement[];
  time: { phases: readonly string[]; repeats?: boolean };
  facets: Facets;
}

/** The words beside a representation: element names and possibility wordings, by key. Never inside it. */
export type Words = Readonly<Record<string, string>>;

export function statement(rep: Representation, id: string): Statement {
  const s = rep.statements.find((x) => x.id === id);
  if (!s) throw new Error(`${rep.id}: no statement '${id}'`);
  return s;
}

export function element(rep: Representation, id: string): RepElement {
  const e = rep.elements.find((x) => x.id === id);
  if (!e) throw new Error(`${rep.id}: no element '${id}'`);
  return e;
}

/** The statements an idiom may draw, with the register each is drawn in (C1). `inferred` never appears. */
export function drawable(rep: Representation): Statement[] {
  return rep.statements.filter((s) => s.commitment !== 'inferred');
}

export function find<P extends Predicate['p']>(rep: Representation, p: P): (Statement & { say: Extract<Predicate, { p: P }> })[] {
  return drawable(rep).filter((s): s is Statement & { say: Extract<Predicate, { p: P }> } => s.say.p === p);
}

export function isEstablished(s: Statement): boolean {
  return ESTABLISHED.includes(s.commitment);
}
