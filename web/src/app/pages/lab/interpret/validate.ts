import type { CandidateAccount, CandidateStatement, Category, Derivation } from './account';
import { DERIVATIONS, DERIVATION_CEILING, ESTABLISHED } from './account';
import type { Licence } from './licences';
import { licence } from './licences';

/**
 * STUDY CODE, Track A (TRACK-A: AI-generated, development only, not validated). The validator
 * (investigation §3.3, rules 1–5): each statement's category comes from its derivation, then checks
 * written in code can only lower it. A category is never raised here: only the person raises one,
 * by confirming it. Pure: no model, no network.
 *
 * Its checks for hedges, quotation, conditionals and instructions are word-level heuristics on the
 * text (docs/interpretation-dev/README.md). They show only that the rules behave as specified, not
 * that an account is right.
 */
export type Rule = 'derivation' | 'quote' | 'unlicensed' | 'licence' | 'sense' | 'form' | 'mover' | 'alternatives' | 'hedge' | 'quoted' | 'conditional' | 'instruction' | 'critic' | 'entailment';

export interface Demotion {
  from: Category;
  to: Category;
  rule: Rule;
  why: string;
}

export interface Checked {
  id: string;
  statement: string;
  derivation: string;
  /** The strongest category its derivation allows. */
  ceiling: Category;
  category: Category;
  /**
   * The statement's label by its computed category and order (R1, R2, I1, P1 …), as the guide numbers
   * rows. The model's own id stays in `id`, because the critic and the checks refer to it; a model id
   * such as "L1" can name a statement the checks lowered to I, so `label` is the one to show.
   */
  label: string;
  demotions: Demotion[];
  wouldLicense?: boolean;
}

/** Labels statements by their computed category, in order: R1, R2, … I1 … P1 … U1. */
export function labelled<T extends { category: Category }>(statements: readonly T[]): (T & { label: string })[] {
  const n: Partial<Record<Category, number>> = {};
  return statements.map((s) => ({ ...s, label: `${s.category}${(n[s.category] = (n[s.category] ?? 0) + 1)}` }));
}

export interface Validation {
  textId: string;
  statements: Checked[];
  /** What is malformed: these are reported, and the statement concerned is never established. */
  problems: string[];
  /**
   * What a Track A rule asks for and a statement lacks (2026-11-26): an inferred or unknown statement
   * with neither a quote nor a basis; a possibility set with no holder, or a holder not in the text; an
   * established statement that doesn't make sense on its own ("Otherwise, …"), or that carries someone's
   * quoted words without quotation marks. Reported for review. They lower nothing.
   */
  flags: string[];
  decline: CandidateAccount['decline'];
}

/** Quotes and apostrophes made plain, whitespace collapsed, case ignored. Every position below is in this form. */
export function plain(s: string): string {
  return s
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

type Range = readonly [number, number];
const within = (r: Range, outer: Range) => r[0] >= outer[0] && r[1] <= outer[1];
const overlaps = (a: Range, b: Range) => a[0] < b[1] && b[0] < a[1];

/** Sentence ranges: a sentence ends at . ! or ? followed by a space or the end. */
function sentences(t: string): Range[] {
  const out: Range[] = [];
  let start = 0;
  const re = /[.!?]+(?=\s|$)/g;
  for (let m = re.exec(t); m; m = re.exec(t)) {
    out.push([start, m.index + m[0].length]);
    start = m.index + m[0].length;
  }
  if (start < t.length) out.push([start, t.length]);
  return out.map(([a, b]) => [a + (t.slice(a, b).length - t.slice(a, b).trimStart().length), b] as const);
}

/** Clause ranges within a sentence: split at , ; : and before "but", "though", "although", "because", "so", "whereas". */
function clauses(t: string, s: Range): Range[] {
  const out: Range[] = [];
  let start = s[0];
  const re = /[,;:]|\s(?=(but|though|although|because|so|whereas)\b)/g;
  const part = t.slice(s[0], s[1]);
  for (let m = re.exec(part); m; m = re.exec(part)) {
    out.push([start, s[0] + m.index]);
    start = s[0] + m.index + m[0].length;
  }
  out.push([start, s[1]]);
  return out;
}

/** Regions inside quotation marks. */
function quotedRegions(t: string): Range[] {
  const marks = [...t.matchAll(/"/g)].map((m) => m.index!);
  const out: Range[] = [];
  for (let k = 0; k + 1 < marks.length; k += 2) out.push([marks[k] + 1, marks[k + 1]]);
  return out;
}

// A claim inside a "whether" clause, or one someone wonders, asks or is unsure about, is not asserted:
// "whether" on its own marks it, in any tense of the verb before it.
const HEDGE = /\b(i think|i guess|i suppose|i believe|i'm not sure|not sure|unsure|uncertain|(don't|do not|didn't|did not|doesn't|does not) know (if|whether)|wonder(s|ed|ing)? (if|whether)|ask(s|ed|ing)? (if|whether)|whether|seems?|seemed|appears?|appeared|apparently|probably|possibly|perhaps|maybe|might|may have|could have|likely)\b/g;
/** A hedge that opens a sentence governs all of it. */
const SENTENCE_HEDGE = /^(i think|i guess|i suppose|i believe|maybe|perhaps|probably|apparently)\b/;
/** "if" that asks whether ("I don't know if …") is not a condition. */
const WHETHER_IF = /\b(know|kno|sure|wonder|wondering|ask|asked|asking|check|checked|see|tell|unclear|whether)\s+(\w+\s+)?$/;
/** Words opening a statement that point back to another one ("Otherwise, they will …"). */
const POINTS_BACK = /^(otherwise|if not|if so|in that case|in which case|or else|else|instead)\b/;
/** A possibility set's holder that is the writer, who needn't be named in the text. */
const WRITER = /^(the )?(writer|author|narrator|text)$/;
const INSTRUCTION =
  /\b(note to (the )?(system|reader|model|ai|machine|program)|whoever (reads|is reading) this|(the )?(system|program|model|ai) reading this|ignore (your|the|all|any|previous|these)\b|(record|mark|treat|label|classify|tag|write|report|state) (that|this|it|everything|them|all)\b[^.]*\bas (a )?(fact|reported|true|established|certain)|as a fact)/;
const REPORTS_INSTRUCTION = /\b(tells|asks|instructs|directs|wants|says to|urges)\b/;

/** Where each quote is in the text (its first occurrence), or null when it isn't there. */
function locate(t: string, quotes: readonly string[]): (Range | null)[] {
  return quotes.map((q) => {
    const p = plain(q);
    const at = p ? t.indexOf(p) : -1;
    return at < 0 ? null : ([at, at + p.length] as const);
  });
}

/**
 * Conditional words other than "if" (2026-11-26). Each makes what it governs, or what it sets against,
 * hold only under a condition. "Otherwise" counts only where it opens a clause ("Otherwise, …"; "…; otherwise
 * …"; "or otherwise"), not in "the room was otherwise empty". "Provided" and "providing" count only with
 * "that", or where they open a clause, not in "the food was provided by the school". "In case" is left
 * out: "we took umbrellas in case it rained" reports that they took umbrellas. So is "when", which
 * mostly reports ("when I arrived, the door was open"). "As long as" also has a comparative sense
 * ("she waited as long as she could"); there the claim is lowered too, which only ever weakens it.
 */
const CONDITIONAL_WORDS = /\bunless\b|\bor else\b|\b(?:as|so) long as\b|(?:^\s*|[,;:]\s*|\bor\s+)(otherwise)\b|\b(?:provided|providing) that\b|(?:^\s*|[,;:]\s*)(provided|providing)\b/g;

/**
 * A conditional marker in a sentence: a condition's "if", an inverted "had", "were" or "should" opening
 * it, or another conditional word (above).
 */
function conditionalMarkers(t: string, s: Range): Range[] {
  const part = t.slice(s[0], s[1]);
  const out: Range[] = [];
  for (const m of part.matchAll(/\bif\b/g)) if (!WHETHER_IF.test(part.slice(0, m.index))) out.push([s[0] + m.index!, s[0] + m.index! + 2]);
  const inverted = part.match(/^(had|were|should)\s+(i|we|you|he|she|they|it)\b/);
  if (inverted) out.push([s[0], s[0] + inverted[1].length]);
  for (const m of part.matchAll(CONDITIONAL_WORDS)) {
    // The marker is the word itself, not the punctuation or "or" before it.
    const word = m[1] ?? m[2] ?? m[0];
    const at = m.index! + m[0].lastIndexOf(word);
    out.push([s[0] + at, s[0] + at + word.length]);
  }
  return out;
}

/** Whether a licence fires on these quotes: its trigger in a quote, and not in a sense it excludes. */
function fires(l: Licence, t: string, found: Range[], sents: Range[]): 'fires' | 'no trigger' | 'excluded' {
  let excluded = false;
  for (const q of found) {
    const words = t.slice(q[0], q[1]);
    for (const m of words.matchAll(new RegExp(l.trigger.source, 'g'))) {
      const at: Range = [q[0] + m.index!, q[0] + m.index! + m[0].length];
      const s = sents.find((r) => within(at, r)) ?? [0, t.length];
      const ex = l.excludes ? [...t.slice(s[0], s[1]).matchAll(new RegExp(l.excludes.source, 'g'))].some((e) => overlaps([s[0] + e.index!, s[0] + e.index! + e[0].length], at)) : false;
      if (!ex) return 'fires';
      excluded = true;
    }
  }
  return excluded ? 'excluded' : 'no trigger';
}

function check(c: CandidateStatement, t: string, sents: Range[], quoted: Range[], problems: string[], textId: string): Checked {
  const at = `${textId} ${c.id}`;
  const known = (DERIVATIONS as readonly string[]).includes(c.derivation);
  if (!known) problems.push(`${at}: derivation '${c.derivation}' isn't one of the guide's eight`);
  const ceiling: Category = known ? DERIVATION_CEILING[c.derivation as Derivation] : 'I';
  const out: Checked = { id: c.id, statement: c.statement, derivation: c.derivation, ceiling, category: ceiling, label: '', demotions: [], ...(c.wouldLicense ? { wouldLicense: true } : {}) };
  /** Lowers only: established to inferred, possible to unknown. */
  const lower = (rule: Rule, why: string) => {
    const to: Category | null = ESTABLISHED.includes(out.category) ? 'I' : out.category === 'P' ? 'U' : null;
    if (!to) return;
    out.demotions.push({ from: out.category, to, rule, why });
    out.category = to;
  };

  const found = locate(t, c.quotes ?? []);
  const missing = (c.quotes ?? []).filter((_, k) => !found[k]);
  const ranges = found.filter((r): r is Range => !!r);

  if (out.category === 'R') {
    if (!c.quotes?.length) lower('quote', 'a reported statement quotes the text');
    else if (missing.length) lower('quote', `not in the text: ${missing.map((q) => `"${q}"`).join(', ')}`);
  }

  if (out.category === 'L') {
    const l = c.licence ? licence(c.licence) : undefined;
    if (c.licence && !l) problems.push(`${at}: licence '${c.licence}' isn't in the registry`);
    if (!c.licence) lower('unlicensed', 'no licensed pattern covers it');
    else if (!l) lower('licence', `unknown licence '${c.licence}'`);
    else if (!l.derivations.includes(c.derivation as Derivation)) lower('licence', `${l.id} doesn't cover ${c.derivation}`);
    else if (!ranges.length || missing.length) lower('quote', 'an implied statement quotes the words its licence fires on');
    else {
      const f = fires(l, t, ranges, sents);
      if (f === 'no trigger') lower('licence', `${l.id} doesn't fire on its quotes`);
      else if (f === 'excluded') lower('sense', `${l.id} doesn't cover this sense`);
      else if (c.say && !l.maps.includes(c.say.p)) lower('form', `${l.id} gives ${l.maps.join(' or ')}, not ${c.say.p}`);
      else if (c.say?.p === 'passes' && c.say.mover !== undefined && c.say.mover !== c.say.a) lower('mover', 'passing licenses only that the one passing moved, not the one passed');
    }
  }

  if (out.category === 'P') {
    const options = c.options ?? [];
    const absent = options.filter((o) => !locate(t, [o])[0]);
    if (options.length < 2) lower('alternatives', 'a possibility set has two or more options the text offers');
    else if (absent.length) lower('alternatives', `not offered by the text: ${absent.map((o) => `"${o}"`).join(', ')}`);
  }

  if (ESTABLISHED.includes(out.category) && ranges.length) {
    // Hedges: a claim from a hedged clause is the writer's guess, unless the hedge is quoted with it.
    const hedged = ranges.some((q) => {
      const s = sents.find((r) => overlaps(q, r)) ?? [0, t.length];
      const scope = SENTENCE_HEDGE.test(t.slice(s[0], s[1])) ? [s] : clauses(t, s).filter((cl) => overlaps(cl, q));
      return scope.some((sc) => [...t.slice(sc[0], sc[1]).matchAll(HEDGE)].some((h) => !ranges.some((r) => within([sc[0] + h.index!, sc[0] + h.index! + h[0].length], r))));
    });
    if (hedged) lower('hedge', 'it comes from a hedged clause, and the hedge isn\'t quoted with it');
  }

  if (ESTABLISHED.includes(out.category) && ranges.length && ranges.every((q) => quoted.some((r) => within(q, r))))
    lower('quoted', 'it is only what someone is quoted as saying; the attribution isn\'t quoted');

  if (ESTABLISHED.includes(out.category) && ranges.length) {
    const conditional = ranges.some((q) => {
      const s = sents.find((r) => overlaps(q, r));
      const markers = s ? conditionalMarkers(t, s) : [];
      return markers.length > 0 && !markers.some((m) => ranges.some((r) => within(m, r)));
    });
    if (conditional) lower('conditional', 'it is part of a conditional, quoted without its conditional word ("if", "unless", "otherwise" …)');
  }

  const inInstruction = ranges.length > 0 && ranges.every((q) => sents.some((s) => overlaps(q, s) && INSTRUCTION.test(t.slice(s[0], s[1]))));
  if (c.aboutInstruction && !(inInstruction && REPORTS_INSTRUCTION.test(plain(c.statement)))) problems.push(`${at}: marked as reporting an instruction, but doesn't say what the instruction asks`);
  if (ESTABLISHED.includes(out.category) && inInstruction && !(c.aboutInstruction && REPORTS_INSTRUCTION.test(plain(c.statement))))
    lower('instruction', 'it is what an instruction in the text asks to be recorded, not something the text reports');

  return out;
}

/** An account's statements with their computed categories, and what is malformed. */
export function validate(account: CandidateAccount): Validation {
  const t = plain(account.text);
  const sents = sentences(t);
  const quoted = quotedRegions(t);
  const problems: string[] = [];
  const ids = account.statements.map((s) => s.id);
  for (const d of new Set(ids.filter((x, k) => ids.indexOf(x) !== k))) problems.push(`${account.textId}: ${d} is used twice`);
  for (const s of account.statements) if (!s.statement.trim()) problems.push(`${account.textId} ${s.id}: no statement`);
  const statements = labelled(account.statements.map((s) => check(s, t, sents, quoted, problems, account.textId)));
  return { textId: account.textId, statements, problems, flags: flagged(account, t, statements, quoted), decline: account.decline };
}

/** The Track A rules on basis and holder (see `Validation.flags`). */
function flagged(account: CandidateAccount, t: string, checked: readonly Checked[], quoted: readonly Range[]): string[] {
  const out: string[] = [];
  // Someone's quoted words, as the text has them inside quotation marks, without the closing punctuation.
  const quotations = quoted.map((r) => t.slice(r[0], r[1]).replace(/[.,!?;:]+$/, '').trim()).filter((q) => q.length >= 8);
  account.statements.forEach((s, k) => {
    const at = `${account.textId} ${s.id}`;
    // An established statement is drawn as a fact by itself, so it must make sense by itself.
    if (ESTABLISHED.includes(checked[k].category)) {
      const said = plain(s.statement);
      const opener = said.match(POINTS_BACK);
      if (opener) out.push(`${at}: it doesn't make sense on its own: it opens with "${opener[1]}", which points back to another statement`);
      if (quotations.some((q) => said.includes(q) && !said.includes('"') && !said.includes(`'${q}`)))
        out.push(`${at}: it carries someone's quoted words without quotation marks, so they can read as asserted`);
    }
    const ceiling = (DERIVATIONS as readonly string[]).includes(s.derivation) ? DERIVATION_CEILING[s.derivation as Derivation] : 'I';
    if ((ceiling === 'I' || ceiling === 'U') && !(s.quotes ?? []).some((q) => plain(q)) && !s.basis?.trim())
      out.push(`${at}: ${ceiling === 'I' ? 'an inference' : 'an open question'} with no basis: no quote, and no reason given`);
    if (ceiling === 'P') {
      const holder = plain(s.holder ?? '');
      if (!holder) out.push(`${at}: a possibility set that doesn't say whose possibilities they are`);
      else if (!WRITER.test(holder) && !t.includes(holder)) out.push(`${at}: the holder "${s.holder}" isn't named in the text`);
    }
  });
  return out;
}
