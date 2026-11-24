import { DrawContext, Registry, Representation, dispatch, isRefused, registerGeneral } from '../../../../shared/visual';
import type { StudyCase } from '../cases';
import { Figure, IdiomId, settingOf } from './contract';
import { fieldPatterns } from './field';
import { kineticPatterns } from './kinetic';
import { Pattern, Refused } from './registry';
import { spatialPatterns } from './spatial';

/**
 * STUDY CODE, Stage 3 M2–M3: the study as an application of the engine (S12). It registers its
 * one-case patterns, once, as an application registers its prepared compositions, and then the
 * engine's general patterns, bases and additions (`registerGeneral`), so ties still go to its own.
 * Each idiom dispatches through the engine; what the general patterns draw is the engine's.
 */

/** The choice as the study's checks read it: the engine's, with the composition named as the pattern. */
export interface Choice {
  pattern: string;
  /** Established statements the chosen figure leaves undrawn. */
  undrawn: number;
  /** The other patterns that could have drawn it, with their undrawn counts. */
  others: { pattern: string; undrawn: number }[];
  /** Revision 8: patterns whose needs held but which failed on the case (a defect, even when another drew it). */
  failed: { pattern: string; reason: string }[];
}

/** What the study passes its patterns: the engine's draw context, and the case its one-case patterns read. */
export interface StudyContext extends DrawContext {
  case: StudyCase;
  rep: Representation;
}

/** The case a pattern draws: the one asked for, or, for a composition's base, the case narrowed to its statements. */
const caseOf = (rep: Representation, x: StudyContext): StudyCase => (rep === x.rep ? x.case : { ...x.case, rep });

const IDIOMS: [IdiomId, () => Pattern<object>[]][] = [
  ['kinetic', () => kineticPatterns() as Pattern<object>[]],
  ['spatial', () => spatialPatterns() as Pattern<object>[]],
  ['field', () => fieldPatterns() as Pattern<object>[]],
];

let registered: Registry<StudyContext, Figure> | undefined;

/** Lazily, because the idioms and this module import each other. */
export function studyRegistry(): Registry<StudyContext, Figure> {
  if (registered) return registered;
  const r = new Registry<StudyContext, Figure>();
  for (const [idiom, patterns] of IDIOMS)
    for (const p of patterns())
      r.register({ name: p.name, idiom, draws: p.draws, single: p.single, lacks: (rep, x) => p.lacks(caseOf(rep, x)), draw: (rep, x) => p.draw(caseOf(rep, x), x.tuning) });
  return (registered = registerGeneral(r));
}

/** The context a case is drawn in, for an idiom's tuning and the finishing asked for. */
export function contextOf(c: StudyCase, tuning: object, finish: object): StudyContext {
  return { case: c, rep: c.rep, setting: settingOf(c), tuning, finish };
}

/**
 * An idiom's figure for a case, through the engine's dispatch, or the study's refusal (thrown).
 * `without`: patterns left out, and `composition` to leave composition out, for the checks.
 */
export function studyChoice(idiom: IdiomId, c: StudyCase, tuning: object, finish: object, without: readonly string[] = []): { figure: Figure; choice: Choice } {
  const d = dispatch(studyRegistry(), idiom, c.rep, contextOf(c, tuning, finish), { without, compose: !without.includes('composition') });
  if (isRefused(d)) throw new Refused({ caseId: c.id, idiom, tried: d.refusal.tried });
  const { pattern, undrawn, alsoAble, failed, composition } = d.choice;
  return { figure: d.figure, choice: { pattern: composition ? `composed: ${composition.base} + ${composition.added.length}` : pattern, undrawn, others: alsoAble, failed } };
}
