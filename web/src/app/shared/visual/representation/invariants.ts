import type { Composed } from '../composition/compose';
import { elementsOf } from '../composition/scene';
import { Representation, Statement, drawable } from './contract';

/**
 * S12 Representation: the invariants every figure keeps (Stage 3, M1; proposal §2.2). A figure,
 * whoever drew it (an engine pattern, a composition, an application's prepared one), is checked
 * against its representation at every moment it can show:
 * 1. Registers: nothing cites an inferred statement; what stands only for possibilities is drawn
 *    tentative or translucent; nothing cites a denied statement; believed content isn't drawn as fact.
 * 2. Citation: every element cites the statements, or the declared base (`base:…`), it stands for.
 * 3. Coverage: every drawable statement is shown or declared not shown, with a reason; nothing else.
 * 4. Determinism: a moment composes the same way every time.
 */

/** What a figure says it shows and doesn't, by statement. */
export interface Coverage {
  shown: readonly { id: string; how: string }[];
  notShown: readonly { id: string; why: string }[];
}

/** One moment of a figure: its composition, and what each element stands for. */
export interface Drawn {
  composed: Composed;
  /** Element id → the statement ids or declared bases (`base:…`) it stands for. */
  cites: Readonly<Record<string, readonly string[]>>;
}

/** A figure as the invariants see it. */
export interface CheckedFigure {
  /** The moments (or viewpoint positions) it can show. */
  moments: readonly number[];
  draw(at: number): Drawn;
  coverage: Coverage;
}

/** A citation is a statement id, or a declared base: something drawn for no statement, said so. */
export const isBase = (cite: string) => cite.startsWith('base:');

export function figureProblems(figure: CheckedFigure, rep: Representation): string[] {
  const out = new Set<string>();
  const byId = new Map<string, Statement>(rep.statements.map((s) => [s.id, s]));
  const believed = new Set(rep.statements.flatMap((s) => (s.say.p === 'believes' ? [s.say.statement] : [])));
  const beliefOf = new Map(rep.statements.flatMap((s) => (s.say.p === 'believes' ? [[s.say.statement, s.id] as const] : [])));

  for (const at of figure.moments) {
    const first = figure.draw(at);
    // 4. Determinism.
    if (JSON.stringify(figure.draw(at)) !== JSON.stringify(first)) out.add(`at ${at}: drawing the same moment twice gives two figures`);
    for (const { element } of elementsOf(first.composed.scene)) {
      const cites = first.cites[element.id] ?? [];
      const where = `at ${at}: element '${element.id}'`;
      // 2. Citation.
      if (!cites.length) {
        out.add(`${where} cites nothing`);
        continue;
      }
      const statements = cites.filter((c) => !isBase(c));
      for (const c of statements) if (!byId.has(c)) out.add(`${where} cites '${c}', which isn't a statement`);
      const cited = statements.map((c) => byId.get(c)).filter((s): s is Statement => !!s);
      // 1. Registers.
      for (const s of cited) {
        if (s.commitment === 'inferred') out.add(`${where} draws an inference ('${s.id}')`);
        if (s.commitment === 'denied') out.add(`${where} draws a denied statement ('${s.id}'): v1 has no register for denial`);
        if (believed.has(s.id) && !cites.includes(beliefOf.get(s.id)!)) out.add(`${where} draws believed content ('${s.id}') as fact, without its belief`);
      }
      const onlyOpen = cited.length > 0 && cited.every((s) => s.commitment === 'possible' || s.commitment === 'unknown') && cited.some((s) => s.commitment === 'possible');
      if (onlyOpen && element.kind !== 'label') {
        const style = (element as { style?: { dash?: string; material?: string } }).style ?? {};
        if (style.dash !== 'tentative' && style.material !== 'translucent') out.add(`${where} draws a possibility as established`);
      }
    }
  }

  // 3. Coverage.
  for (const p of coverageProblems(figure.coverage, rep)) out.add(p);
  return [...out];
}

/** Invariant 3 alone: every drawable statement is shown or declared not shown; nothing else, and nothing twice. */
export function coverageProblems(coverage: Coverage, rep: Representation): string[] {
  const out = new Set<string>();
  const byId = new Map<string, Statement>(rep.statements.map((s) => [s.id, s]));
  const listed = [...coverage.shown.map((x) => x.id), ...coverage.notShown.map((x) => x.id)];
  for (const s of drawable(rep)) if (!listed.includes(s.id)) out.add(`statement '${s.id}' is neither shown nor declared not shown`);
  for (const id of listed) {
    const s = byId.get(id);
    if (!s) out.add(`the coverage lists '${id}', which isn't a statement`);
    else if (s.commitment === 'inferred') out.add(`the coverage lists '${id}', which is inferred: inferences are never drawn or accounted for`);
  }
  for (const id of new Set(listed)) if (listed.filter((x) => x === id).length > 1) out.add(`the coverage lists '${id}' more than once`);
  return [...out];
}
