import { Aligned, CATEGORIES, Category, ESTABLISHED, OPEN_ENDED, Row, VIEWS } from './sheets';

/**
 * STUDY CODE, Stage 1b: agreement between two annotators, from what each wrote alone and how they
 * aligned their statements afterwards (docs/interpretation-trial/guide.md §7).
 */

/** Cohen's κ over paired labels; null when it is undefined (one label used by both throughout). */
export function kappa<T>(pairs: readonly (readonly [T, T])[], labels: readonly T[]): number | null {
  const n = pairs.length;
  if (!n) return null;
  const observed = pairs.filter(([a, b]) => a === b).length / n;
  const share = (k: 0 | 1, l: T) => pairs.filter((p) => p[k] === l).length / n;
  const expected = labels.reduce((sum, l) => sum + share(0, l) * share(1, l), 0);
  return expected === 1 ? null : (observed - expected) / (1 - expected);
}

/** A's category against B's: `confusion[a][b]` counts the pairs. */
export function confusion(pairs: readonly (readonly [Category, Category])[]): Record<Category, Record<Category, number>> {
  const out = Object.fromEntries(CATEGORIES.map((a) => [a, Object.fromEntries(CATEGORIES.map((b) => [b, 0]))])) as Record<Category, Record<Category, number>>;
  for (const [a, b] of pairs) out[a][b]++;
  return out;
}

export interface Agreement {
  statementsA: number;
  statementsB: number;
  pairs: number;
  /**
   * How far the two lists of statements match, in two parts (guide §7). Anchored (R, L, P, by the writer's
   * category): statements with a partner, of all such statements. Open-ended (I, U): statements with a
   * partner or that the other annotator marked `plausible`, of all such statements; two careful lists of
   * inferences and questions differ, and only `unsupported` counts against them. Null when there are none.
   */
  splitting: { anchored: number | null; openEnded: number | null };
  /** Unpaired open-ended statements, by the other annotator's view. */
  unpairedOpenEnded: { plausible: string[]; unsupported: string[] };
  /** On paired statements: the same category. */
  raw: number | null;
  kappa: number | null;
  /** Established (R, L) against not (I, P, U): the distinction a drawing turns on. */
  kappaEstablished: number | null;
  /** On pairs where both chose L or I: the boundary the investigation expects to be hard. */
  kappaImpliedInferred: number | null;
  confusion: Record<Category, Record<Category, number>>;
  /** Pairs that name a statement missing from its sheet. */
  unknownIds: string[];
  /** Sheet statements the alignment leaves out, and unpaired open-ended statements with no view: the alignment isn't finished. */
  unaligned: string[];
}

/** Agreement over all texts: each text's two sheets and its alignment. */
export function agreement(texts: readonly { id: string; a: readonly Row[]; b: readonly Row[]; aligned: readonly Aligned[] }[]): Agreement {
  const pairs: [Category, Category][] = [];
  const unknownIds: string[] = [];
  const unaligned: string[] = [];
  const unpairedOpenEnded: Agreement['unpairedOpenEnded'] = { plausible: [], unsupported: [] };
  const tally = { anchored: { matched: 0, of: 0 }, openEnded: { matched: 0, of: 0 } };
  let statementsA = 0;
  let statementsB = 0;
  const none = (x: string) => x === '' || x === '—' || x === '-';
  const open = (c: string) => OPEN_ENDED.includes(c as Category);
  for (const t of texts) {
    statementsA += t.a.length;
    statementsB += t.b.length;
    const seen = { A: new Set<string>(), B: new Set<string>() };
    const paired = { A: new Set<string>(), B: new Set<string>() };
    const plausible = { A: new Set<string>(), B: new Set<string>() };
    for (const [ia, ib, view] of t.aligned) {
      const ra = none(ia) ? undefined : t.a.find((r) => r.id === ia);
      const rb = none(ib) ? undefined : t.b.find((r) => r.id === ib);
      if (!none(ia) && !ra) unknownIds.push(`${t.id} A ${ia}`);
      if (!none(ib) && !rb) unknownIds.push(`${t.id} B ${ib}`);
      if (ra) seen.A.add(ra.id);
      if (rb) seen.B.add(rb.id);
      if (ra && rb) {
        pairs.push([ra.cat as Category, rb.cat as Category]);
        paired.A.add(ra.id);
        paired.B.add(rb.id);
        continue;
      }
      const [side, r] = ra ? (['A', ra] as const) : rb ? (['B', rb] as const) : [undefined, undefined];
      if (!side || !open(r.cat)) continue;
      const at = `${t.id} ${side} ${r.id}`;
      if (!VIEWS.includes(view as never)) unaligned.push(`${at}: no view`);
      else if (view === 'plausible') {
        plausible[side].add(r.id);
        unpairedOpenEnded.plausible.push(at);
      } else unpairedOpenEnded.unsupported.push(at);
    }
    for (const [side, rows] of [['A', t.a], ['B', t.b]] as const)
      for (const r of rows) {
        if (!seen[side].has(r.id)) unaligned.push(`${t.id} ${side} ${r.id}: not in the alignment`);
        const part = open(r.cat) ? tally.openEnded : tally.anchored;
        part.of++;
        if (paired[side].has(r.id) || (open(r.cat) && plausible[side].has(r.id))) part.matched++;
      }
  }
  const share = (p: { matched: number; of: number }) => (p.of ? p.matched / p.of : null);
  const est = (c: Category) => (ESTABLISHED.includes(c) ? 'established' : 'not');
  const li = pairs.filter(([a, b]) => ['L', 'I'].includes(a) && ['L', 'I'].includes(b));
  return {
    statementsA,
    statementsB,
    pairs: pairs.length,
    splitting: { anchored: share(tally.anchored), openEnded: share(tally.openEnded) },
    unpairedOpenEnded,
    raw: pairs.length ? pairs.filter(([a, b]) => a === b).length / pairs.length : null,
    kappa: kappa(pairs, CATEGORIES),
    kappaEstablished: kappa(pairs.map(([a, b]) => [est(a), est(b)] as const), ['established', 'not']),
    kappaImpliedInferred: kappa(li, ['L', 'I'] as Category[]),
    confusion: confusion(pairs),
    unknownIds,
    unaligned,
  };
}
