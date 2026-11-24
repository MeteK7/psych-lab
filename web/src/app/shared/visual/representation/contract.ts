/**
 * S12 Representation: the contract (Stage 3, M1; docs/visual-engine-stage-3-proposal.md §2.1).
 *
 * What an application hands the engine: what a figure is about and how firmly each thing is held,
 * never how it is shown. Typed, versioned (`v: 1`), and free of language: the words for elements
 * and options are content keys beside it, in the application's content. Nothing here is named for a
 * domain, and nothing is shaped by any one figure: facets are optional, and a predicate enters only
 * when it is stated without domain words and at least two domains use it (investigation §7.2).
 *
 * Specified by the representation study (docs/visual-study/representation-v0.md, v0.2) and its
 * findings; v1 adds causation (G-17), contrast (G-26), and belief and denial (G-19).
 */

/** How firmly a statement is held, by its relation to the source. */
export type Commitment =
  /** The source asserts it. */
  | 'reported'
  /** It follows from the source's language by a pattern the application licenses. */
  | 'implied'
  /** Added by an interpreter. Never drawn. */
  | 'inferred'
  /** One of a set of two or more the source or the application offers; none preferred. */
  | 'possible'
  /** Left open by the source: a question. */
  | 'unknown'
  /** v1 (G-19): the source says it is not so. Never drawn as established. */
  | 'denied';

export const COMMITMENTS: readonly Commitment[] = ['reported', 'implied', 'inferred', 'possible', 'unknown', 'denied'];
/** Drawn as established. */
export const ESTABLISHED: readonly Commitment[] = ['reported', 'implied'];

export type ElementKind = 'presence' | 'object' | 'place' | 'process' | 'quantity' | 'quality';

export interface RepElement {
  id: string;
  kind: ElementKind;
  salience?: 'primary' | 'equal' | 'secondary';
  /** The viewer's own presence; at most one. */
  own?: boolean;
  /** A plural presence: a number, or `several`, `many`. */
  count?: number | 'several' | 'many';
}

/** What a question asks about. */
export type Asks = 'attention' | 'whether' | 'cause' | 'time' | 'intent' | 'setting' | 'fate' | 'motion';
export const ASKS: readonly Asks[] = ['attention', 'whether', 'cause', 'time', 'intent', 'setting', 'fate', 'motion'];

export type Predicate =
  | { p: 'passes'; a: string; b: string; mover?: string }
  | { p: 'exchange-absent'; kind: string; from: string; to: string }
  | { p: 'sends'; from: string; item: string; to: string }
  | { p: 'receives'; who: string; item: string }
  | { p: 'holds'; who: string; what: string }
  | { p: 'located-in'; what: string; place: string; alone?: boolean }
  | { p: 'apart'; a: string; b: string }
  | { p: 'feels'; who: string; charge: number }
  | { p: 'flows'; what: string; from: string; to: string }
  | { p: 'joins'; what: string; into: string; at: string }
  | { p: 'cycles'; what: string; through: readonly string[] }
  | { p: 'part-of'; part: string; whole: string }
  | { p: 'complete'; what: string }
  | { p: 'precedes'; a: string; b: string }
  | { p: 'depends-on'; what: string; on: string }
  | { p: 'absent'; what: string }
  | { p: 'waiting'; what: string; for: string }
  | { p: 'question'; about: string; asks: Asks }
  | { p: 'alternatives'; question: string; options: readonly string[]; origin: 'person' | 'content' | 'source' }
  | { p: 'reacts'; who: string; to: string; kind: 'laughter' | 'none' }
  | { p: 'contact'; a: string; b: string }
  | { p: 'displaced'; what: string; by: string }
  | { p: 'shifts'; what: string; by?: string; later: boolean }
  | { p: 'exceeds'; a: string; b: string; aspect: string }
  | { p: 'behind'; what: string; amount: string }
  | { p: 'above'; a: string; b: string }
  | { p: 'transforms'; what: string; from: string; to: string; at: string }
  | { p: 'form'; what: string; feature: string }
  // v1 (Stage 1 findings, S3-1): each used by two or more domains in the study's logs.
  /** G-17: one thing or statement brings about another. "So" and "because" are an application's licensed patterns. */
  | { p: 'causes'; cause: string; effect: string }
  /** G-26: the source sets two statements against each other ("but"). It may add emphasis, never content. */
  | { p: 'contrasts'; a: string; b: string }
  /** G-19: a presence holds a statement to be so; the statement is theirs, not the source's. */
  | { p: 'believes'; who: string; statement: string }
  // Proposed by interpreters only: they appear only as `inferred` statements, and nothing draws them.
  | { p: 'notices'; who: string; whom: string }
  | { p: 'expects'; who: string; what: string }
  | { p: 'intends'; who: string; what: string }
  | { p: 'releases'; what: string; at: string }
  | { p: 'late'; what: string };

export type PredicateName = Predicate['p'];

export interface Statement {
  id: string;
  say: Predicate;
  commitment: Commitment;
  /** The phases in which it holds; all phases when absent. */
  phases?: readonly string[];
  /** Where it came from: a span, a licensed pattern, a reason. For review and tracing; never drawn. */
  basis?: string;
}

/** Viewpoint stances, named for the viewpoint, not for a person. */
export const STANCES = ['own', 'behind', 'across', 'outside', 'within', 'above', 'front', 'side'] as const;
export type Stance = (typeof STANCES)[number];

/** Optional facets; each is versioned with the contract. */
export interface Facets {
  /** Where things are, and where the viewer looks from. `place` is an open word. */
  space?: { setting: 'reported' | 'stand-in'; place?: string; viewpoints: readonly Stance[] };
  /** What happens over time. */
  dynamics?: { pace: 'still' | 'slow' | 'moderate' };
  /** A quality spread over an extent: its kind, its source (an element or a statement), whether it changes. */
  field?: { quality: 'clarity' | 'density' | 'agitation'; source: string; evolves: boolean };
  /** A familiar frame standing for the meaning. */
  metaphor?: { frame: 'path'; stations: readonly string[]; gate?: string };
}

export interface Representation {
  /** The contract's version. */
  v: 1;
  id: string;
  elements: readonly RepElement[];
  statements: readonly Statement[];
  time: { phases: readonly string[]; repeats?: boolean };
  facets: Facets;
}

/**
 * Each predicate's arguments, by what they name. The one authoritative description: the
 * well-formedness check reads it, and so can anything that needs to build or walk statements.
 * - `element`: an element id. `element?`: optional.
 * - `ref`: an element or a statement id.
 * - `statement`: a statement id.
 * - `place`: an element id or an open word for a place.
 * - `elements`: a list of element ids. `options`: option keys (words beside the representation).
 * - `word`: an open word (a kind, an aspect, an amount, a state, a feature). `number`, `boolean`.
 * - `asks`, `origin`, `reaction`: a value from the closed list the type gives.
 */
export type ArgKind = 'element' | 'element?' | 'ref' | 'statement' | 'place' | 'elements' | 'options' | 'word' | 'number' | 'boolean' | 'boolean?' | 'asks' | 'origin' | 'reaction';

export const PREDICATES: Readonly<Record<PredicateName, Readonly<Record<string, ArgKind>>>> = {
  passes: { a: 'element', b: 'element', mover: 'element?' },
  'exchange-absent': { kind: 'word', from: 'element', to: 'element' },
  sends: { from: 'element', item: 'element', to: 'element' },
  receives: { who: 'element', item: 'element' },
  holds: { who: 'element', what: 'element' },
  'located-in': { what: 'element', place: 'place', alone: 'boolean?' },
  apart: { a: 'element', b: 'element' },
  feels: { who: 'element', charge: 'number' },
  flows: { what: 'element', from: 'element', to: 'element' },
  joins: { what: 'element', into: 'element', at: 'element' },
  cycles: { what: 'element', through: 'elements' },
  'part-of': { part: 'element', whole: 'element' },
  complete: { what: 'element' },
  precedes: { a: 'element', b: 'element' },
  'depends-on': { what: 'element', on: 'element' },
  absent: { what: 'element' },
  waiting: { what: 'element', for: 'element' },
  question: { about: 'ref', asks: 'asks' },
  alternatives: { question: 'statement', options: 'options', origin: 'origin' },
  reacts: { who: 'element', to: 'statement', kind: 'reaction' },
  contact: { a: 'element', b: 'element' },
  displaced: { what: 'element', by: 'element' },
  shifts: { what: 'element', by: 'element?', later: 'boolean' },
  exceeds: { a: 'element', b: 'element', aspect: 'word' },
  behind: { what: 'element', amount: 'word' },
  above: { a: 'element', b: 'element' },
  transforms: { what: 'element', from: 'word', to: 'word', at: 'element' },
  form: { what: 'element', feature: 'word' },
  causes: { cause: 'ref', effect: 'ref' },
  contrasts: { a: 'statement', b: 'statement' },
  believes: { who: 'element', statement: 'statement' },
  notices: { who: 'element', whom: 'element' },
  expects: { who: 'element', what: 'word' },
  intends: { who: 'element', what: 'word' },
  releases: { what: 'element', at: 'place' },
  late: { what: 'element' },
};

/** Predicates an interpreter may propose; they appear only as `inferred` statements. */
export const INFERRED_ONLY: readonly PredicateName[] = ['notices', 'expects', 'intends', 'releases', 'late'];

/** Statements a figure may draw, or must account for: everything but the inferred. */
export function drawable(rep: Representation): Statement[] {
  return rep.statements.filter((s) => s.commitment !== 'inferred');
}

export function isEstablished(s: Statement): boolean {
  return ESTABLISHED.includes(s.commitment);
}

/** The drawable statements of one predicate, typed by it. */
export function find<P extends PredicateName>(rep: Representation, p: P): (Statement & { say: Extract<Predicate, { p: P }> })[] {
  return drawable(rep).filter((s): s is Statement & { say: Extract<Predicate, { p: P }> } => s.say.p === p);
}
