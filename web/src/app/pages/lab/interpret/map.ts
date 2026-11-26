import type { Commitment, Predicate, RepElement, Representation, Statement } from '../../../shared/visual';
import { representationProblems } from '../../../shared/visual';
import type { Category } from './account';
import { TRACK_A_MARKER } from './account';
import { licence } from './licences';

/**
 * STUDY CODE, Track A (TRACK-A: AI-generated, development only, not validated). A3, first step: a
 * reviewed account, typed, translated into the engine's representation (`shared/visual`, contract v1).
 *
 * The mapping preserves and translates the meaning in its input. It never adds meaning, and never
 * makes up for a wrong account:
 * - Every representation statement comes from one account statement, with the commitment its category
 *   gives (R reported, L implied, I inferred, P possible, U unknown), or `denied` for a reported denial.
 *   Nothing is strengthened, and nothing is weakened to make it fit.
 * - What it can't translate is left out and logged as a gap, with why: a statement with no predicate
 *   form, a form the contract lacks or rejects, an implied statement with no licensed pattern from the
 *   registry, possibilities the contract can't attribute, or a statement that depends on one left out.
 *   A statement with several forms is mapped whole or not at all.
 * - The contract's own check passes on every result.
 *
 * Its input is a reviewed account, never model output, and its elements are declared by the account's
 * author.
 *
 * Time (second step, 2026-11-26): an account may declare its phases, in order. Then every statement
 * names its phases or is marked `throughout`, and its phases are copied exactly, never inferred from
 * tense or word order and never extended. A statement that says neither is left out, because the
 * contract reads no phases as every phase. An account without phases gets one neutral phase.
 *
 * Out of scope: ordering checks between statements, facets, salience, words and drawing.
 */

/** Each category's commitment. A reported denial is `denied` instead. */
export const COMMITMENT_OF: Readonly<Record<Category, Commitment>> = { R: 'reported', L: 'implied', I: 'inferred', P: 'possible', U: 'unknown' };

/** The one phase of every result in this first step. A neutral name: it says nothing about when. */
export const ONE_PHASE = 'one phase';

/** A predicate form as the account's author typed it: checked against the contract, never trusted. */
export type PredicateForm = { p: string } & Record<string, unknown>;

export interface AccountStatement {
  /** The account's own id (R1, L1, P …). The representation statement keeps it. */
  id: string;
  statement: string;
  category: Category;
  basis: string;
  /**
   * Its predicate form, or several when one statement makes several claims of one kind ("depends on
   * A, B and C"). Absent when the account gives none: the statement is then a gap.
   */
  say?: PredicateForm | readonly PredicateForm[];
  /** A reported statement whose source says it is not so (contract v1 `denied`). Only on R. */
  denied?: boolean;
  /** For an implied statement: the licensed pattern it rests on, by registry id (`licences.ts`). */
  licence?: string;
  /**
   * For possibilities: whose they are. Empty when reviewed content offers them; "the writer" (or "the
   * person") when the source or the person telling offers them; otherwise a person in the text.
   */
  holder?: string;
  /** When it holds, in an account with phases: the phases it names, copied exactly. */
  phases?: readonly string[];
  /** In an account with phases: it holds in every phase, said explicitly. */
  throughout?: boolean;
}

export interface ReviewedAccount {
  id: string;
  text: string;
  /** Where the account was reviewed, and anything changed in typing it. */
  source: string;
  elements: readonly RepElement[];
  /**
   * The account's phases, in order, as its author takes them from the text, and whether they repeat
   * (only when the text says so). Absent: the result has one neutral phase.
   */
  time?: { phases: readonly string[]; repeats?: boolean };
  statements: readonly AccountStatement[];
  /** Track A flags carried from validation (validate.ts), if any. Passed on, never acted on. */
  flags?: readonly string[];
}

export interface Mapping {
  marker: typeof TRACK_A_MARKER;
  accountId: string;
  /** The result. Empty of statements when the account is refused. */
  representation: Representation;
  /** Each representation statement, and the account statement it comes from. */
  mapped: { from: string; to: string }[];
  /** Account statements left out, each with why. */
  gaps: { id: string; why: string }[];
  /** Problems with the account as a whole. When there are any, nothing is mapped. */
  refused: string[];
  flags: string[];
  /** The contract's check on the result: always empty. */
  problems: string[];
}

const WRITER = /^(the )?(writer|author|narrator|text|source|person)$/i;

const formsOf = (s: AccountStatement): readonly PredicateForm[] => (s.say === undefined ? [] : Array.isArray(s.say) ? s.say : [s.say as PredicateForm]);

/**
 * When a statement holds. In an account with phases it must say so: the phases it names, or
 * `throughout`. Saying neither is not "every phase": the contract would read it so, and a state such
 * as `holds` would then persist through the whole account. So it is left out instead.
 */
function timeProblem(s: AccountStatement, time: ReviewedAccount['time']): string | null {
  const named = s.phases ?? [];
  if (!time) return named.length ? `names phases (${named.join(', ')}), but the account declares none` : null;
  if (named.length && s.throughout) return 'names its phases and is also marked throughout';
  if (!named.length && !s.throughout) return 'its time isn\'t stated: in an account with phases, a statement names its phases or is marked throughout';
  const unknown = named.filter((p) => !time.phases.includes(p));
  if (unknown.length) return `names phases the account doesn't declare: ${unknown.join(', ')}`;
  return null;
}

/** Why a statement can't be mapped before the contract is asked: every reason the account's own rules give. */
function precheck(s: AccountStatement, time: ReviewedAccount['time']): string[] {
  const forms = formsOf(s);
  // With no form there is nothing to place in time or check against a licence.
  if (!forms.length) return ['no predicate form: the account gives none'];
  const out: string[] = [];
  const when = timeProblem(s, time);
  if (when) out.push(when);
  if (s.denied && s.category !== 'R') out.push('only a reported statement can carry a denial');
  if (s.category === 'L' && forms.length) {
    const l = s.licence ? licence(s.licence) : undefined;
    if (!s.licence) out.push('implied, but no licensed pattern from the registry is named');
    else if (!l) out.push(`implied through '${s.licence}', which isn't in the registry`);
    else {
      const off = forms.filter((f) => !(l.maps as readonly string[]).includes(f.p));
      if (off.length) out.push(`${l.id} gives ${l.maps.join(' or ')}, not ${off.map((f) => f.p).join(', ')}`);
    }
  }
  if (s.category === 'P' && forms.length) {
    const holder = (s.holder ?? '').trim();
    if (forms.some((f) => f.p !== 'alternatives')) out.push('possibilities are mapped only as a set of alternatives');
    else if (forms.some((f) => f['origin'] === 'content') && holder) out.push(`the set is marked as offered by reviewed content, but its holder is "${holder}"`);
    else if (holder && !WRITER.test(holder)) out.push(`the contract can't say these are ${holder}'s possibilities: its sets come only from the person telling, the source, or reviewed content`);
  }
  return out;
}

/** The representation statements a set of account statements would give, each traced to its own. */
function build(account: ReviewedAccount, taken: readonly AccountStatement[]): { rep: Representation; from: Map<string, string> } {
  const from = new Map<string, string>();
  const statements: Statement[] = taken.flatMap((s) => {
    const forms = formsOf(s);
    return forms.map((f, k) => {
      const id = forms.length > 1 ? `${s.id}.${k + 1}` : s.id;
      from.set(id, s.id);
      // Its phases exactly as named; none (the contract's "every phase") only when marked throughout.
      const phases = account.time && s.phases?.length ? { phases: [...s.phases] } : {};
      return { id, say: f as unknown as Predicate, commitment: s.denied ? 'denied' : COMMITMENT_OF[s.category], ...phases, basis: `${s.id}: ${s.basis}`.trim() } as Statement;
    });
  });
  const time = account.time ? { phases: [...account.time.phases], ...(account.time.repeats ? { repeats: true } : {}) } : { phases: [ONE_PHASE] };
  return { rep: { v: 1, id: account.id, elements: account.elements, statements, time, facets: {} }, from };
}

export function mapAccount(account: ReviewedAccount): Mapping {
  const out: Mapping = { marker: TRACK_A_MARKER, accountId: account.id, representation: build(account, []).rep, mapped: [], gaps: [], refused: [], flags: [...(account.flags ?? [])], problems: [] };

  // The account as a whole: its ids, and its elements as the contract reads them.
  const ids = account.statements.map((s) => s.id);
  for (const d of new Set(ids.filter((x, k) => ids.indexOf(x) !== k))) out.refused.push(`statement '${d}' is in the account more than once`);
  for (const p of representationProblems(build(account, []).rep)) out.refused.push(p);
  for (const s of account.statements) if (account.elements.some((e) => e.id === s.id)) out.refused.push(`'${s.id}' is both an element and a statement`);
  if (account.time) {
    const ph = account.time.phases;
    if (!ph.length) out.refused.push('declares time with no phases');
    for (const d of new Set(ph.filter((x, k) => ph.indexOf(x) !== k))) out.refused.push(`declares the phase '${d}' more than once`);
  }
  if (out.refused.length) return out;

  let taken: AccountStatement[] = [];
  for (const s of account.statements) {
    const why = precheck(s, account.time);
    if (why.length) out.gaps.push({ id: s.id, why: why.join('; ') });
    else taken.push(s);
  }

  // Ask the contract. A statement it rejects is left out whole, and so, in turn, is anything that
  // depended on it, until the result is well formed.
  for (;;) {
    const { rep, from } = build(account, taken);
    const problems = representationProblems(rep);
    if (!problems.length) {
      out.representation = rep;
      out.mapped = rep.statements.map((s) => ({ from: from.get(s.id)!, to: s.id }));
      return out;
    }
    const bad = new Map<string, string[]>();
    for (const p of problems) {
      const id = p.match(/statement '([^']+)'/)?.[1];
      const source = id !== undefined ? from.get(id) : undefined;
      if (source === undefined) {
        out.refused.push(p);
        continue;
      }
      bad.set(source, [...(bad.get(source) ?? []), p.slice(`${account.id} `.length)]);
    }
    if (out.refused.length) return out;
    for (const [id, why] of bad) out.gaps.push({ id, why: `the contract rejects it: ${why.join('; ')}` });
    taken = taken.filter((s) => !bad.has(s.id));
  }
}
