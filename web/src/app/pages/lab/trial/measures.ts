import { AlignedRow, Category, ESTABLISHED, OPEN_ENDED, Row } from './sheets';

type Anchored = 'R' | 'L' | 'P';
type OpenEnded = 'I' | 'U';
const count = { found: 0, of: 0 };

/**
 * STUDY CODE, Stage 1b: a candidate account (the pass A accounts in slice 1; an interpreter's output,
 * later and only if separately approved) against the reference (investigation §10). The alignment is a
 * person's: this code only counts what it says.
 */

export interface Measures {
  /** Candidate statements scored: all but those from outside the text. */
  scored: number;
  /** Put as established (R, L) where the reference doesn't establish it, or an unlisted inference put so. The primary measure. */
  overCommitted: string[];
  overCommitment: number | null;
  /** Of those: a possibility (reference P) put as established. */
  possibleAsFact: string[];
  /** R where the reference has L, or L where it has R: nothing drawn changes. */
  swapped: string[];
  /** Put as not established where the reference establishes it. */
  underCommitted: string[];
  /** Nothing in the text supports it. */
  fabricated: string[];
  fabrication: number | null;
  /** Reference statements the candidate has, per anchored category (R, L, P): a missing one is a miss. */
  recall: Record<Anchored, { found: number; of: number }>;
  /**
   * The same for the open-ended categories (I, U), reported as coverage: descriptive, not an error rate.
   * Two careful accounts list different inferences and questions; the reference keeps every plausible one,
   * and a candidate that lists others isn't wrong for it.
   */
  coverage: Record<OpenEnded, { found: number; of: number }>;
  /** Rows the alignment names that don't exist, or verdicts it doesn't allow. */
  problems: string[];
}

export interface Options {
  /** Count a reference inference whose licence both annotators agreed (`agreed`) as implied: the list as it would be after the review. */
  withAgreedLicences?: boolean;
}

/** One candidate against the reference, over all texts. */
export function measures(texts: readonly { id: string; candidate: readonly AlignedRow[]; reference: readonly Row[] }[], opts: Options = {}): Measures {
  const m: Measures = {
    scored: 0,
    overCommitted: [],
    overCommitment: null,
    possibleAsFact: [],
    swapped: [],
    underCommitted: [],
    fabricated: [],
    fabrication: null,
    recall: { R: { ...count }, L: { ...count }, P: { ...count } },
    coverage: { I: { ...count }, U: { ...count } },
    problems: [],
  };
  const established = (c: string) => ESTABLISHED.includes(c as Category);
  for (const t of texts) {
    const refCat = (r: Row) => (opts.withAgreedLicences && r.cat === 'I' && /^agreed$/i.test(r.wouldLicense ?? '') ? 'L' : r.cat);
    const found = new Set<string>();
    for (const c of t.candidate) {
      const at = `${t.id} ${c.id}`;
      if (c.verdict === 'outside the text') continue;
      m.scored++;
      if (c.verdict === 'no basis') {
        m.fabricated.push(at);
        continue;
      }
      if (c.verdict === 'unlisted inference') {
        if (established(c.cat)) m.overCommitted.push(at);
        continue;
      }
      if (c.verdict !== 'match') {
        m.problems.push(`${at}: verdict '${c.verdict}'`);
        continue;
      }
      const ref = t.reference.find((r) => r.id === c.reference);
      if (!ref) {
        m.problems.push(`${at}: reference ${c.reference || '(empty)'} isn't in the reference`);
        continue;
      }
      found.add(ref.id);
      const rc = refCat(ref);
      if (established(c.cat) && !established(rc)) {
        m.overCommitted.push(at);
        if (rc === 'P') m.possibleAsFact.push(at);
      } else if (!established(c.cat) && established(rc)) m.underCommitted.push(at);
      else if (established(c.cat) && c.cat !== rc) m.swapped.push(at);
    }
    for (const r of t.reference) {
      const c = refCat(r) as Category;
      const tally = OPEN_ENDED.includes(c) ? m.coverage[c as OpenEnded] : m.recall[c as Anchored];
      if (!tally) continue;
      tally.of++;
      if (found.has(r.id)) tally.found++;
    }
  }
  m.overCommitment = m.scored ? m.overCommitted.length / m.scored : null;
  m.fabrication = m.scored ? m.fabricated.length / m.scored : null;
  return m;
}
