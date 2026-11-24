import { Agreement, agreement } from './agreement';
import { Measures, measures } from './measures';
import { parseAlignment, parsePassAAlignment, parseSheet } from './sheets';

/**
 * STUDY CODE, Stage 1b: a slice's results from its filled sheets, or null while any is unfilled. The
 * sheets are markdown, by file name (annotator-a.md, annotator-b.md, reference.md, alignment-a-b.md,
 * alignment-pass-a.md).
 */
export const PASS_A_LABEL = 'Accounts written by a model (the assistant that ran the study), with the study’s full context, revised over eight revisions. Not an interpreter trial. Corpus texts only: retrospective.';

/** Where a text comes from, read from the key once annotation is over. */
export type Group = 'corpus' | 'robustness';

/** What each group's results can and can't show (concern raised before annotation, 2026-11-23). */
export const GROUP_LABELS: Record<Group, string> = {
  corpus: 'Corpus texts: retrospective. These cases shaped the categories and the licensed patterns, and the pass A accounts were written with them in view. They show how the method does on familiar material, not that it generalizes.',
  robustness: 'Robustness texts: written for the trial, outside the material the categories were shaped on. Too few in one slice to establish generalization; read them as a first look only.',
};

/**
 * The agreement at which the categories hold, fixed before any annotation (your decision, 2026-11-23):
 * Cohen's κ at least 0.6 over the five categories, and also on implied against inferred. Below it, the
 * categories are redefined before slice 2.
 */
export const THRESHOLD = 0.6;

export interface SliceResults {
  /** Over every text. */
  agreement: Agreement;
  /** The same, for each group on its own, with what it can show. */
  byGroup: Record<Group, { label: string; ids: string[]; agreement: Agreement }>;
  /** Whether both κ reach the threshold. `not measurable` when either can't be computed (too few pairs, or one label used throughout): the rule then can't be applied, and the finding says so. */
  categoriesHold: 'yes' | 'no' | 'not measurable';
  passA: { label: string; strict: Measures; withAgreedLicences: Measures };
  declined: { id: string; why: string }[];
  seenBefore: { a: string[]; b: string[] };
}

export function sliceResults(ids: readonly string[], files: Record<string, string>, groups: Record<string, Group>): SliceResults | null {
  const a = parseSheet(files['annotator-a.md']);
  const b = parseSheet(files['annotator-b.md']);
  const reference = parseSheet(files['reference.md']);
  const ab = parseAlignment(files['alignment-a-b.md']);
  const passA = parsePassAAlignment(files['alignment-pass-a.md']);
  const filled =
    ids.every((id) => a.get(id)?.rows.length && b.get(id)?.rows.length && reference.get(id)?.rows.length && ab.get(id)?.length) &&
    [...passA.values()].every((rows) => rows.every((r) => r.verdict));
  if (!filled) return null;
  const scoring = [...passA].map(([id, candidate]) => ({ id, candidate, reference: reference.get(id)!.rows }));
  const yes = (s?: string) => /^yes/i.test(s ?? '');
  const ungrouped = ids.filter((id) => !groups[id]);
  if (ungrouped.length) throw new Error(`no group for ${ungrouped.join(', ')}`);
  const over = (some: readonly string[]) => agreement(some.map((id) => ({ id, a: a.get(id)!.rows, b: b.get(id)!.rows, aligned: ab.get(id)! })));
  const g = over(ids);
  // An alignment that leaves statements out, or an unpaired inference without the other's view, isn't finished.
  if (g.unaligned.length) return null;
  const group = (k: Group) => {
    const some = ids.filter((id) => groups[id] === k);
    return { label: GROUP_LABELS[k], ids: some, agreement: over(some) };
  };
  const both = [g.kappa, g.kappaImpliedInferred];
  return {
    agreement: g,
    byGroup: { corpus: group('corpus'), robustness: group('robustness') },
    categoriesHold: both.some((k) => k === null) ? 'not measurable' : both.every((k) => k! >= THRESHOLD) ? 'yes' : 'no',
    passA: { label: PASS_A_LABEL, strict: measures(scoring), withAgreedLicences: measures(scoring, { withAgreedLicences: true }) },
    declined: ids.filter((id) => yes(reference.get(id)!.decline)).map((id) => ({ id, why: reference.get(id)!.decline! })),
    seenBefore: { a: ids.filter((id) => yes(a.get(id)!.seen)), b: ids.filter((id) => yes(b.get(id)!.seen)) },
  };
}
