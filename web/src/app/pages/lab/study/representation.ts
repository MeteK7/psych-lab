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
  /** Slice 2 (G-04): a plural presence: a number, or `several`, `many`. */
  count?: number | 'several' | 'many';
}

/** What a question asks about. */
export type Asks = 'attention' | 'whether' | 'cause' | 'time' | 'intent' | 'setting' | 'fate' | 'motion';

/** The predicates the four depth cases use (representation-v0.md §3, and two found in pass B). */
export type Predicate =
  /**
   * a and b came close and went on. `mover` (v0.1, after review of P1): the one the account says moved;
   * the other is the point of reference, whose own motion is not stated.
   */
  | { p: 'passes'; a: string; b: string; mover?: string }
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
  /** Revision 3 (G-27): a part of a whole. Parts of one whole sit together in every idiom. */
  | { p: 'part-of'; part: string; whole: string }
  | { p: 'complete'; what: string }
  | { p: 'precedes'; a: string; b: string }
  | { p: 'depends-on'; what: string; on: string }
  | { p: 'absent'; what: string }
  | { p: 'waiting'; what: string; for: string }
  | { p: 'question'; about: string; asks: Asks }
  | { p: 'alternatives'; question: string; options: readonly string[]; origin: 'person' | 'content' | 'source' }
  // Slice 2: predicates the eight new cases need (logs.md G-03, G-06, G-11, G-16), each domain-neutral.
  /** a responds to an event: `kind` from a closed list. */
  | { p: 'reacts'; who: string; to: string; kind: 'laughter' | 'none' }
  /** a touches or holds onto b. */
  | { p: 'contact'; a: string; b: string }
  /** a is moved off its place by a force, not by its own will. */
  | { p: 'displaced'; what: string; by: string }
  /** a's place in time moves later (or earlier) by someone; the amount may be unknown. */
  | { p: 'shifts'; what: string; by?: string; later: boolean }
  /** a exceeds b in one aspect. */
  | { p: 'exceeds'; a: string; b: string; aspect: string }
  /** a is behind its plan in time. */
  | { p: 'behind'; what: string; amount: string }
  /** R4-2 (G-29): a is above b. */
  | { p: 'above'; a: string; b: string }
  /** a changes form from one state to another, at a place. */
  | { p: 'transforms'; what: string; from: string; to: string; at: string }
  /**
   * v0.2 (revision 5): what a thing's form is, as the text gives it: one feature per statement, with
   * its commitment and basis like any other. Open: a feature no idiom knows is drawn as the neutral
   * form, and the coverage says so (FORM_FEATURES lists the ones the kit draws).
   */
  | { p: 'form'; what: string; feature: string }
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

/** v0.2: the form features the study kit draws. Any other feature is drawn as the neutral form. */
export const FORM_FEATURES = ['round', 'block', 'slope', 'upright', 'flat', 'long'] as const;

export interface Facets {
  /**
   * `place` is open (v0.2): the kind of place the text reports or the idiom stands in. Some places have
   * a built setting (home, meeting-room, carriage); any other is built from the statements' relations.
   */
  space?: { setting: 'reported' | 'stand-in'; place?: string; viewpoints: readonly Stance[] };
  dynamics?: { pace: 'still' | 'slow' | 'moderate' };
  field?: { quality: 'clarity' | 'density' | 'agitation'; source: string; evolves: boolean };
  /** The `path` frame: stations along a way; a gate on it, if something blocks it. */
  metaphor?: { frame: 'path'; stations: readonly string[]; gate?: string };
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
