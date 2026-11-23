import { PredicateName, Representation, Statement, drawable, isEstablished } from './contract';
import { Coverage, coverageProblems } from './invariants';

/**
 * S12 Representation: the dispatch (Stage 3, M2; docs/visual-engine-stage-3-proposal.md §2.3).
 *
 * Which registered pattern draws a representation, or why none can. Patterns are registered, not
 * enumerated: the engine registers none of its own here, and an application adds what it has. An
 * idiom is an open name, so a new idiom is a new name and the patterns registered under it.
 *
 * - **Needs.** A pattern declares what it can account for (`draws`, `single`) and what else it can't
 *   do without (`lacks`). A drawable statement of a kind outside its lists is a need it declares.
 * - **Choice.** An able pattern is one whose needs hold and which draws the case, every statement
 *   accounted for. Of the able ones, the one leaving the fewest established statements undrawn wins;
 *   on a tie, the one registered first.
 * - **Named failure.** A pattern whose needs hold but which fails on the case is named, with the
 *   reason, both in a refusal and beside a choice that another pattern made. It is never hidden.
 * - **Composition.** Only when no single pattern is able: one base draws the statements it can,
 *   narrowed to them, and the idiom's additions draw each remaining one.
 * - **Refusal** is a result, not an exception: every pattern and what it lacked.
 *
 * Specified by the representation study's revisions 5–8, which built it case by case (its
 * registry and lists; its composition is the engine's since M3, compose.ts).
 */

/** What the dispatch reads of a figure: what it says it shows and doesn't. */
export interface Dispatchable {
  coverage: Coverage;
}

/** A pattern: what it can account for, what else it needs, and how it draws. `C` is whatever the application passes its patterns. */
export interface Pattern<C, F extends Dispatchable> {
  name: string;
  idiom: string;
  /**
   * The kinds of statement its coverage accounts for, shown or declared not shown. A kind is a
   * predicate, `question:<asks>` for an open question (`question:*` for every question), or
   * `alternatives` for a possibility set. Inferred statements never count.
   */
  draws: readonly string[];
  /** Kinds it accounts for only once: a second statement of one is a need. */
  single?: readonly string[];
  /** What else it lacks for this representation, in words; empty when it has everything. */
  lacks(rep: Representation, context: C): string[];
  draw(rep: Representation, context: C): F;
}

/** A pattern that can serve as a composition's base, in one idiom. */
export interface Base<C> {
  name: string;
  idiom: string;
  draws: readonly string[];
  single?: readonly string[];
  /** The statements of a representation it draws as a base; none when it can't serve. */
  domain(rep: Representation, context: C): readonly Statement[];
  /** What it lacks as a base, given its narrowed representation and the statements left to the additions. */
  lacks(sub: Representation, rest: readonly Statement[], context: C): string[];
}

/** What composition hands the additions: the base, its narrowed representation, and what is left. */
export interface Plan {
  base: string;
  sub: Representation;
  rest: readonly Statement[];
}

/** An idiom's additions: the predicates they can draw, and the composed figure (the base drawn with them). */
export interface Additions<C, F extends Dispatchable> {
  adds: readonly PredicateName[];
  draw(plan: Plan, rep: Representation, context: C): F;
}

export interface Choice {
  /** The pattern chosen, or the base of a composition. */
  pattern: string;
  /** Established statements the figure leaves undrawn. */
  undrawn: number;
  /** The other able patterns, with their undrawn counts. */
  alsoAble: { pattern: string; undrawn: number }[];
  /** Patterns whose needs held but which failed on the case: a defect, even when another drew it. */
  failed: { pattern: string; reason: string }[];
  /** When composed: the base, and the statements the additions drew. */
  composition?: { base: string; added: string[] };
}

export interface Refusal {
  idiom: string;
  /** Each pattern, and what it lacked; `composition` last, when it was tried. */
  tried: { pattern: string; lacks: string[] }[];
}

export type Dispatched<F> = { figure: F; choice: Choice } | { refusal: Refusal };

export function isRefused<F>(d: Dispatched<F>): d is { refusal: Refusal } {
  return 'refusal' in d;
}

export interface DispatchOptions {
  /** Patterns left out, by name (to show what an idiom does without one). */
  without?: readonly string[];
  /** Whether composition may be tried; it is, by default. */
  compose?: boolean;
}

/** The patterns, bases and additions an application registers, in the order that breaks ties. */
export class Registry<C, F extends Dispatchable> {
  private readonly patterns: Pattern<C, F>[] = [];
  private readonly bases: Base<C>[] = [];
  private readonly additions = new Map<string, Additions<C, F>>();

  register(pattern: Pattern<C, F>): this {
    if (this.patterns.some((p) => p.idiom === pattern.idiom && p.name === pattern.name)) throw new Error(`${pattern.idiom}: a pattern named '${pattern.name}' is already registered`);
    this.patterns.push(pattern);
    return this;
  }

  registerBase(base: Base<C>): this {
    if (this.bases.some((b) => b.idiom === base.idiom && b.name === base.name)) throw new Error(`${base.idiom}: a base named '${base.name}' is already registered`);
    this.bases.push(base);
    return this;
  }

  registerAdditions(idiom: string, additions: Additions<C, F>): this {
    if (this.additions.has(idiom)) throw new Error(`${idiom}: additions are already registered`);
    this.additions.set(idiom, additions);
    return this;
  }

  patternsOf(idiom: string): readonly Pattern<C, F>[] {
    return this.patterns.filter((p) => p.idiom === idiom);
  }

  basesOf(idiom: string): readonly Base<C>[] {
    return this.bases.filter((b) => b.idiom === idiom);
  }

  additionsOf(idiom: string): Additions<C, F> | undefined {
    return this.additions.get(idiom);
  }
}

/** A drawable statement's kind, as `draws` names it. */
export function kindOf(s: Statement): string {
  return s.say.p === 'question' ? `question:${s.say.asks}` : s.say.p;
}

/** The needs a pattern's lists give: kinds it doesn't draw, and repeats of kinds it draws once. */
export function listLacks(rep: Representation, draws: readonly string[], single: readonly string[] = []): string[] {
  const kinds = drawable(rep).map(kindOf);
  const covered = (k: string) => draws.includes(k) || (k.startsWith('question:') && draws.includes('question:*'));
  const missing = [...new Set(kinds.filter((k) => !covered(k)))];
  const repeated = [...new Set(kinds.filter((k) => single.includes(k) && kinds.filter((x) => x === k).length > 1))];
  return [...missing.map((k) => `a way to draw '${k}'`), ...repeated.map((k) => `a single '${k}'`)];
}

/** Established statements a figure doesn't show (questions and possibility sets aren't established). */
function undrawnBy(rep: Representation, f: Dispatchable): number {
  const shown = new Set(f.coverage.shown.map((x) => x.id));
  return drawable(rep).filter((s) => isEstablished(s) && !shown.has(s.id)).length;
}

/** An error's own text: what follows its name (`Error: …`). */
const textOf = (e: unknown) => (e instanceof Error ? String(e).slice(e.name.length + 2) : String(e));
const failure = (e: unknown) => `fails on this case: ${textOf(e)}`;

/** Draws, and checks the figure's coverage: a figure that doesn't account for its representation fails. */
function drawChecked<F extends Dispatchable>(draw: () => F, rep: Representation): F {
  const figure = draw();
  const problems = coverageProblems(figure.coverage, rep);
  if (problems.length) throw new Error(`its coverage: ${problems.join('; ')}`);
  return figure;
}

/** Which registered pattern draws `rep` in `idiom`, or, failing all, a composition; else the refusal. */
export function dispatch<C, F extends Dispatchable>(registry: Registry<C, F>, idiom: string, rep: Representation, context: C, options: DispatchOptions = {}): Dispatched<F> {
  const patterns = registry.patternsOf(idiom).filter((p) => !options.without?.includes(p.name));
  const tried = patterns.map((p) => ({ p, lacks: [...listLacks(rep, p.draws, p.single), ...p.lacks(rep, context)] }));
  const drawn = tried
    .filter((x) => x.lacks.length === 0)
    .flatMap((x) => {
      try {
        const figure = drawChecked(() => x.p.draw(rep, context), rep);
        return [{ p: x.p, figure, undrawn: undrawnBy(rep, figure) }];
      } catch (e) {
        x.lacks = [failure(e)];
        return [];
      }
    });
  const failed = tried.filter((x) => x.lacks.some((l) => l.startsWith('fails on this case'))).map((x) => ({ pattern: x.p.name, reason: x.lacks[0] }));
  if (drawn.length) {
    // Fewest undrawn wins; on a tie the earlier pattern (sort is stable).
    const best = [...drawn].sort((a, b) => a.undrawn - b.undrawn)[0];
    return {
      figure: best.figure,
      choice: { pattern: best.p.name, undrawn: best.undrawn, alsoAble: drawn.filter((d) => d !== best).map((d) => ({ pattern: d.p.name, undrawn: d.undrawn })), failed },
    };
  }
  const refusal: Refusal = { idiom, tried: tried.map((x) => ({ pattern: x.p.name, lacks: x.lacks })) };
  const additions = registry.additionsOf(idiom);
  if (options.compose === false || !additions) return { refusal };
  const composed = composition(registry, additions, idiom, rep, context);
  if ('lacks' in composed) return { refusal: { idiom, tried: [...refusal.tried, { pattern: 'composition', lacks: composed.lacks }] } };
  return { figure: composed.figure, choice: { pattern: composed.plan.base, undrawn: undrawnBy(rep, composed.figure), alsoAble: [], failed, composition: { base: composed.plan.base, added: composed.plan.rest.map((s) => s.id) } } };
}

/** The base's own representation: only the statements it draws, and every inferred one (which nobody draws). */
function narrowed(rep: Representation, keep: readonly Statement[]): Representation {
  const ids = new Set(keep.map((s) => s.id));
  return { ...rep, statements: rep.statements.filter((s) => ids.has(s.id) || s.commitment === 'inferred') };
}

/** The base leaving the fewest statements to the additions (ties: the one registered first), drawn with them; else what each base lacked. */
function composition<C, F extends Dispatchable>(registry: Registry<C, F>, additions: Additions<C, F>, idiom: string, rep: Representation, context: C): { figure: F; plan: Plan } | { lacks: string[] } {
  const all = drawable(rep);
  const tries = registry.basesOf(idiom).map((b) => {
    const domain = b.domain(rep, context);
    if (!domain.length) return { b, lacks: ['nothing it draws'] };
    const sub = narrowed(rep, domain);
    const inDomain = new Set(domain.map((s) => s.id));
    const rest = all.filter((s) => !inDomain.has(s.id));
    const unadded = rest.filter((s) => !additions.adds.includes(s.say.p));
    const lacks = [...listLacks(sub, b.draws, b.single), ...b.lacks(sub, rest, context), ...unadded.map((s) => `an addition for '${s.say.p}' (${s.id})`)];
    return { b, sub, rest, lacks };
  });
  const able = tries.filter((x): x is typeof x & { sub: Representation; rest: Statement[] } => !x.lacks.length && 'sub' in x);
  if (!able.length) return { lacks: tries.map((x) => `as base, ${x.b.name}: ${x.lacks.join('; ')}`) };
  const best = [...able].sort((a, b) => a.rest.length - b.rest.length)[0];
  const plan: Plan = { base: best.b.name, sub: best.sub, rest: best.rest };
  try {
    return { figure: drawChecked(() => additions.draw(plan, rep, context), rep), plan };
  } catch (e) {
    return { lacks: [`as base, ${plan.base}: ${failure(e)}`] };
  }
}
