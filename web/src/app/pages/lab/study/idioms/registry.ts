import type { StudyCase } from '../cases';
import { Predicate, Statement, drawable, find, isEstablished } from '../representation';
import type { Figure, IdiomId } from './contract';

/**
 * STUDY CODE, revision 5 (docs/visual-study/findings-revision-5.md §1): composition dispatch.
 *
 * Before revision 5 each idiom tested one predicate at a time and the first match won, so a
 * representation reached a pattern written for one case and broke on what it didn't have (pass C,
 * OI-20). Now each pattern says what it needs. Every pattern whose needs hold is drawn, and the one
 * that leaves the fewest established statements undrawn is chosen; ties go to the earlier pattern,
 * which keeps the corpus's choices. When no pattern's needs hold, the idiom refuses: it says what
 * each pattern lacked, and draws nothing, rather than a figure meant for another case.
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

/** A drawable statement's kind, as `draws` names it. */
export function kindOf(s: Statement): string {
  return s.say.p === 'question' ? `question:${s.say.asks}` : s.say.p;
}

/** The needs a pattern's lists give for a case: kinds it doesn't draw, and repeats of kinds it draws once. */
export function listLacks(c: StudyCase, draws: readonly string[], single: readonly string[] = []): string[] {
  const kinds = drawable(c.rep).map(kindOf);
  const covered = (k: string) => draws.includes(k) || (k.startsWith('question:') && draws.includes('question:*'));
  const missing = [...new Set(kinds.filter((k) => !covered(k)))];
  const repeated = [...new Set(kinds.filter((k) => single.includes(k) && kinds.filter((x) => x === k).length > 1))];
  return [...missing.map((k) => `a way to draw '${k}'`), ...repeated.map((k) => `a single '${k}'`)];
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

/** The pattern each idiom chose for a case, for the checks and the report. */
export interface Choice {
  pattern: string;
  /** Established statements the chosen figure leaves undrawn. */
  undrawn: number;
  /** The other patterns that could have drawn it, with their undrawn counts. */
  others: { pattern: string; undrawn: number }[];
  /** Revision 8: patterns whose needs held but which failed on the case (a defect, even when another drew it). */
  failed?: { pattern: string; reason: string }[];
}

/** Established statements a figure doesn't show (questions and possibility sets aren't established). */
function undrawnBy(c: StudyCase, f: Figure): number {
  const shown = new Set(f.coverage.shown.map((x) => x.id));
  return drawable(c.rep).filter((s) => isEstablished(s) && !shown.has(s.id)).length;
}

export function choose<T>(idiom: IdiomId, c: StudyCase, t: T, patterns: readonly Pattern<T>[]): { figure: Figure; choice: Choice } {
  const tried = patterns.map((p) => ({ p, lacks: [...listLacks(c, p.draws, p.single), ...p.lacks(c)] }));
  // Revision 7 (found by U8–U10): a pattern whose needs hold may still fail on a case its author never
  // saw (its needs were read from one case). Able means: its needs hold and it draws the case, every
  // statement accounted for. A failure is a reason in the refusal, named, never hidden.
  const drawn = tried
    .filter((x) => x.lacks.length === 0)
    .flatMap((x) => {
      try {
        const figure = x.p.draw(c, t);
        return [{ p: x.p, figure, undrawn: undrawnBy(c, figure) }];
      } catch (e) {
        x.lacks = [`fails on this case: ${e instanceof Error ? e.message : String(e)}`];
        return [];
      }
    });
  if (!drawn.length) throw new Refused({ caseId: c.id, idiom, tried: tried.map((x) => ({ pattern: x.p.name, lacks: x.lacks })) });
  // Fewest undrawn wins; on a tie the earlier pattern (sort is stable).
  const best = [...drawn].sort((a, b) => a.undrawn - b.undrawn)[0];
  return {
    figure: best.figure,
    choice: {
      pattern: best.p.name,
      undrawn: best.undrawn,
      others: drawn.filter((d) => d !== best).map((d) => ({ pattern: d.p.name, undrawn: d.undrawn })),
      failed: tried.filter((x) => x.lacks.some((l) => l.startsWith('fails on this case'))).map((x) => ({ pattern: x.p.name, reason: x.lacks[0] })),
    },
  };
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

// Needs, in words. Each returns what is lacking, or nothing.

export const needs = {
  /** An established statement of this predicate. */
  a(c: StudyCase, p: Predicate['p']): string[] {
    return find(c.rep, p).length ? [] : [`a '${p}' statement`];
  },
  /** A plural presence (a crowd, a group): an element with a count. */
  plural(c: StudyCase): string[] {
    return c.rep.elements.some((e) => e.kind === 'presence' && e.count !== undefined) ? [] : ['a plural presence'];
  },
  /** The viewer's own presence. */
  own(c: StudyCase): string[] {
    return c.rep.elements.some((e) => e.own) ? [] : ['the viewer’s own presence'];
  },
  /** A question of this kind. */
  question(c: StudyCase, asks: string): string[] {
    return c.rep.statements.some((s) => s.say.p === 'question' && s.say.asks === asks) ? [] : [`a question about ${asks}`];
  },
  /** The field facet's quality. */
  quality(c: StudyCase, q: string): string[] {
    return c.rep.facets.field?.quality === q ? [] : [`a field of ${q}`];
  },
  /** The space facet's place. */
  place(c: StudyCase, place: string): string[] {
    return c.rep.facets.space?.place === place ? [] : [`a place reported as ${place}`];
  },
  all(...lists: string[][]): string[] {
    return lists.flat();
  },
};
