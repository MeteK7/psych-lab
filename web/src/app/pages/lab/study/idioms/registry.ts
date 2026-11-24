import { listLacks as engineListLacks } from '../../../../shared/visual';
import type { StudyCase } from '../cases';
import type { Figure, IdiomId } from './contract';

export { kindOf, needs } from '../../../../shared/visual';

/**
 * STUDY CODE, revision 5 (docs/visual-study/findings-revision-5.md §1): composition dispatch.
 *
 * Before revision 5 each idiom tested one predicate at a time and the first match won, so a
 * representation reached a pattern written for one case and broke on what it didn't have (pass C,
 * OI-20). Now each pattern says what it needs. Every pattern whose needs hold is drawn, and the one
 * that leaves the fewest established statements undrawn is chosen; ties go to the earlier pattern,
 * which keeps the corpus's choices. When no pattern's needs hold, the idiom refuses: it says what
 * each pattern lacked, and draws nothing, rather than a figure meant for another case.
 *
 * Stage 3, M2: the mechanism (needs, choice, named failure, composition, refusal) is the engine's
 * dispatch (S12, shared/visual/representation/dispatch.ts). The study registers its patterns with it
 * (dispatch.ts here); what stays here is the study's own pattern shape and its refusal. Since M3 the
 * needs, and the study's representations, are the engine's too.
 */
export interface Pattern<T> {
  name: string;
  /** What this pattern lacks for this case, in words; empty when it can draw it. */
  lacks(c: StudyCase): string[];
  draw(c: StudyCase, t: T): Figure;
  /**
   * Revision 8 (OI-39): the kinds of statement its coverage accounts for, shown or declared not
   * shown. A kind is a predicate, `question:<asks>` for an open question (`question:*` for every
   * question), or `alternatives` for a possibility set. Any drawable statement of another kind is a
   * declared need. Read from the pattern's coverage code; inferred statements never count.
   */
  draws: readonly string[];
  /** Kinds it accounts for only once: a second statement of one is a declared need. */
  single?: readonly string[];
}

/** The needs a pattern's lists give for a case (the engine's): kinds it doesn't draw, and repeats of kinds it draws once. */
export function listLacks(c: StudyCase, draws: readonly string[], single: readonly string[] = []): string[] {
  return engineListLacks(c.rep, draws, single);
}

export interface Refusal {
  caseId: string;
  idiom: IdiomId;
  /** Each pattern, and what it lacked. */
  tried: { pattern: string; lacks: string[] }[];
}

/** Thrown by an idiom that refuses; carries the refusal, so a caller can show it. */
export class Refused extends Error {
  constructor(readonly refusal: Refusal) {
    super(`${refusal.idiom}: no pattern can draw ${refusal.caseId} (${refusal.tried.map((x) => `${x.pattern}: ${x.lacks.join(', ')}`).join('; ')})`);
  }
}

/** Whether a case can be drawn by an idiom: the figure, or the refusal. */
export function attempt(draw: () => Figure): Figure | Refusal {
  try {
    return draw();
  } catch (e) {
    if (e instanceof Refused) return e.refusal;
    throw e;
  }
}

export function isRefusal(x: Figure | Refusal): x is Refusal {
  return 'tried' in x;
}
