import type { PredicateName } from '../../../shared/visual';
import type { Derivation } from './account';

/**
 * STUDY CODE, Track A (TRACK-A: AI-generated, development only, not validated). The annotation
 * guide's licensed patterns (docs/interpretation-trial/guide.md §4) as data, so code can check an
 * implied statement instead of trusting the interpreter. `guide` is the pattern exactly as the guide
 * words it; a spec keeps the two lists equal. Triggers and exclusions are word-level heuristics, run
 * on text with its quotes and apostrophes made plain and its case ignored.
 */
export interface Licence {
  id: string;
  /** The pattern as guide §4 words it. */
  guide: string;
  /** What it licenses, in the guide's words. */
  licenses: string;
  /** Fires when it matches within the statement's quotes. */
  trigger: RegExp;
  /** Senses the pattern does not cover: a match here, within the quotes, stops it. */
  excludes?: RegExp;
  derivations: readonly Derivation[];
  /** The representation predicates it may give (A3 maps to them). */
  maps: readonly PredicateName[];
}

const IMPLICATIONS: readonly Derivation[] = ['entailment', 'presupposition', 'conventional meaning'];

export const LICENCES: readonly Licence[] = [
  {
    id: 'passes',
    guide: '"X passed / walked past Y"',
    licenses: 'X moved past Y: X came close to Y and went on. Nothing about whether Y moved',
    trigger: /\b(walk(s|ed|ing)? past|pass(es|ed|ing)?)\b/,
    // "passed the exam", "passed away", "passed on the news": not movement past something.
    excludes: /\bpass(es|ed|ing)? (the |an? |my |her |his |their |our )?(\w+ )?(exam|test|course|year|level|bill|motion|law)s?\b|\bpass(es|ed|ing)? (away|on|over|out|round|around)\b/,
    derivations: IMPLICATIONS,
    maps: ['passes'],
  },
  {
    id: 'not-done',
    guide: '"X didn\'t do Z"',
    licenses: 'X did not do Z. Not that Z didn\'t take place: someone else may have done it',
    trigger: /\b(didn't|did not|hasn't|has not|haven't|have not|never)\b/,
    derivations: IMPLICATIONS,
    maps: ['exchange-absent', 'absent'],
  },
  {
    id: 'but',
    guide: '"but"',
    licenses: 'The writer marks a contrast between the clauses. Not what the contrast is about',
    trigger: /\bbut\b/,
    derivations: IMPLICATIONS,
    maps: ['contrasts'],
  },
  {
    id: 'cant-start-until',
    guide: '"X can\'t start until Y"',
    licenses: 'X depends on Y; while Y is absent, X is waiting for Y',
    trigger: /\b(can't|cannot|can not) (start|begin) until\b/,
    derivations: IMPLICATIONS,
    maps: ['depends-on', 'waiting', 'absent'],
  },
  {
    id: 'not-said-when',
    guide: '"X hasn\'t said when"',
    licenses: 'When is an open question',
    trigger: /\b(hasn't|has not|haven't|have not|didn't|did not) (said|say|told us|tell us) when\b/,
    derivations: IMPLICATIONS,
    maps: ['question'],
  },
  {
    id: 'finished',
    guide: '"X is finished / done"',
    licenses: 'X is complete',
    trigger: /\b(is|are|was|were|has been|have been|'s) (finished|done|complete|completed)\b/,
    derivations: IMPLICATIONS,
    maps: ['complete'],
  },
  {
    id: 'returns-to',
    guide: '"returns to"',
    licenses: 'X goes back to where, or what, it was before',
    trigger: /\b(return(s|ed|ing)?|went back|goes back|go back|came back|comes back) to\b/,
    derivations: IMPLICATIONS,
    maps: ['cycles', 'flows'],
  },
  {
    id: 'takes-up',
    guide: '"takes up / picks up", in the physical sense ("picks up the box")',
    licenses: 'The taken thing is now held by, or with, the taker',
    trigger: /\b(pick(s|ed|ing)? up|take(s|n)? up|took up|taking up)\b/,
    // Not the physical sense: a hobby, space, time, an offer, a language, a habit …
    excludes: /\b(pick(s|ed|ing)?|take(s|n)?|took|taking) up (a |an |the |my |her |his |their |our |some |new )*(hobby|hobbies|space|time|room|offer|job|post|position|challenge|sport|language|skill|habit|idea|case|cause|role|subject)s?\b/,
    derivations: IMPLICATIONS,
    maps: ['joins', 'holds'],
  },
  {
    id: 'felt',
    guide: '"it felt …"',
    licenses: 'A feeling, attributed to the writer',
    trigger: /\b(it |that |this )?felt\b/,
    derivations: IMPLICATIONS,
    maps: ['feels'],
  },
  {
    id: 'form',
    guide: 'A noun whose ordinary sense fixes a shape ("a ball", "a box", "a ramp")',
    licenses: 'That shape, and nothing else about it (under review)',
    trigger: /\b(ball|box|ramp|ring|tube|cube|sphere|wheel|disc|stick)s?\b/,
    derivations: IMPLICATIONS,
    maps: ['form'],
  },
];

export function licence(id: string): Licence | undefined {
  return LICENCES.find((l) => l.id === id);
}
