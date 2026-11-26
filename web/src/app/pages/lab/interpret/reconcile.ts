import type { CandidateStatement, Category, Derivation } from './account';
import { ESTABLISHED, TRACK_A_MARKER } from './account';
import type { Checked, Validation } from './validate';
import { labelled, validate } from './validate';

/**
 * STUDY CODE, Track A, A2 (TRACK-A: AI-generated, development only, not validated). Step 5 of the
 * workflow (docs/interpretation-tracks-proposal.md §3.1): the critic's demotions and the entailment
 * check applied to the validated candidate, lowering only; the critic's additions validated and kept
 * as never established. Where the two passes differ is recorded as model–model disagreement, never as
 * agreement between reviewers.
 */
export interface CriticReply {
  demote: { id: string; why: string }[];
  add: { statement: string; derivation: 'pragmatic inference' | 'world knowledge' | 'alternative' | 'open question'; quotes: string[]; options?: string[]; holder?: string; why: string }[];
  concerns: { id?: string; kind: string; why: string }[];
  obeyedInstruction: boolean;
}

export interface EntailmentReply {
  checks: { id: string; verdict: 'yes' | 'no' | 'cannot tell'; why: string }[];
}

export interface Reconciled {
  marker: typeof TRACK_A_MARKER;
  textId: string;
  statements: (Checked & { source: 'candidate' | 'critic'; why?: string })[];
  /** Model–model disagreement: candidate statements the critic weakened, or that failed the entailment check. */
  disagreements: string[];
  problems: string[];
  /** The Track A flags (validate.ts): the candidate's, and those on the critic's additions. */
  flags: string[];
}

const ADDABLE: readonly Derivation[] = ['pragmatic inference', 'world knowledge', 'alternative', 'open question'];

function lower(s: Checked, rule: 'critic' | 'entailment', why: string): boolean {
  const to: Category | null = ESTABLISHED.includes(s.category) ? 'I' : s.category === 'P' ? 'U' : null;
  if (!to) return false;
  s.demotions.push({ from: s.category, to, rule, why });
  s.category = to;
  return true;
}

/** The implied statements an entailment check must cover. */
export function implied(v: Validation): Checked[] {
  return v.statements.filter((s) => s.category === 'L');
}

export function reconcile(text: string, v: Validation, critic: CriticReply | null | undefined, entailment: EntailmentReply | null | undefined): Reconciled {
  const statements: Reconciled['statements'] = v.statements.map((s) => ({ ...s, demotions: [...s.demotions], source: 'candidate' }));
  const problems = [...v.problems];
  const disagreements: string[] = [];
  const byId = new Map(statements.map((s) => [s.id, s]));

  // The entailment check, when it ran (`undefined`: not run; `null`: ran, reply unusable): anything but
  // "yes" demotes, and an implied statement it didn't cover is not "yes".
  for (const s of entailment === undefined ? [] : statements.filter((x) => x.category === 'L')) {
    const c = entailment?.checks.find((k) => k.id === s.id);
    if (!c || c.verdict !== 'yes') {
      lower(s, 'entailment', c ? `entailment check: ${c.verdict} (${c.why})` : 'no entailment check answered for it');
      disagreements.push(`${s.id}: implied by the candidate, ${c ? `entailment check "${c.verdict}"` : 'not confirmed by the entailment check'}`);
    }
  }

  for (const d of critic?.demote ?? []) {
    const s = byId.get(d.id);
    if (!s) {
      problems.push(`critic demotes ${d.id}, which isn't in the account`);
      continue;
    }
    if (lower(s, 'critic', d.why)) disagreements.push(`${s.id}: weakened by the critic: ${d.why}`);
  }

  // Additions: validated like any candidate, and only ever inferred, possible or unknown.
  const added: CandidateStatement[] = [];
  (critic?.add ?? []).forEach((a, k) => {
    if (!ADDABLE.includes(a.derivation)) {
      problems.push(`critic addition ${k + 1}: derivation '${a.derivation}' can't be added`);
      return;
    }
    // The critic's reason is the addition's basis.
    added.push({ id: `C${k + 1}`, statement: a.statement, derivation: a.derivation, quotes: a.quotes, basis: a.why, ...(a.options ? { options: a.options } : {}), ...(a.holder ? { holder: a.holder } : {}) });
  });
  const addedChecked = validate({ v: 1, textId: v.textId, text, statements: added, decline: v.decline, provenance: { marker: TRACK_A_MARKER, author: 'model', date: '' } });
  problems.push(...addedChecked.problems);
  addedChecked.statements.forEach((s, k) => statements.push({ ...s, source: 'critic' as const, why: (critic?.add ?? []).filter((a) => ADDABLE.includes(a.derivation))[k]?.why }));
  if (addedChecked.statements.some((s) => ESTABLISHED.includes(s.category))) problems.push('a critic addition came out established');

  // Labelled again by the final categories, the critic's additions after the candidate's statements.
  return { marker: TRACK_A_MARKER, textId: v.textId, statements: labelled(statements), disagreements, problems, flags: [...(v.flags ?? []), ...addedChecked.flags] };
}
