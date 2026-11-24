/**
 * STUDY CODE, Stage 1b (docs/interpretation-trial/): reading and checking the trial's sheets. An account
 * is a table in the corpus's own format (`| # | Statement | Cat. | Basis |`), one section per text
 * (`## T01`), with the derivation and "would license" columns the guide adds. Pure functions: the spec
 * reads the files.
 */

export const CATEGORIES = ['R', 'L', 'I', 'P', 'U'] as const;
export type Category = (typeof CATEGORIES)[number];

/** Established: drawn as fact (investigation §3.3, rule 5). */
export const ESTABLISHED: readonly Category[] = ['R', 'L'];

/** The closed list of derivations (investigation §3.3, rule 1), and the categories each may lead to (guide §4). */
export const DERIVATIONS: Record<string, readonly Category[]> = {
  restatement: ['R'],
  entailment: ['L', 'I'],
  presupposition: ['L', 'I'],
  'conventional meaning': ['L', 'I'],
  'pragmatic inference': ['I'],
  'world knowledge': ['I'],
  alternative: ['P'],
  'open question': ['U'],
};

export interface Row {
  id: string;
  statement: string;
  cat: string;
  basis: string;
  derivation?: string;
  wouldLicense?: string;
  note?: string;
}

export interface Section {
  id: string;
  /** The text quoted under the heading, if any. */
  text?: string;
  seen?: string;
  decline?: string;
  rows: Row[];
}

const COLUMNS: Record<string, keyof Row> = { '#': 'id', Statement: 'statement', 'Cat.': 'cat', Basis: 'basis', Derivation: 'derivation', 'Would license': 'wouldLicense', Note: 'note' };

const cells = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

/** Every table in a block of markdown: its header cells and its body rows. */
export function tablesIn(md: string): { header: string[]; rows: string[][] }[] {
  const out: { header: string[]; rows: string[][] }[] = [];
  const lines = md.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('|') || !lines[i + 1]?.startsWith('|---')) continue;
    const header = cells(lines[i]);
    const rows: string[][] = [];
    let j = i + 2;
    for (; j < lines.length && lines[j].startsWith('|'); j++) rows.push(cells(lines[j]));
    out.push({ header, rows: rows.filter((r) => r.some((c) => c !== '')) });
    i = j;
  }
  return out;
}

/** The sections of a sheet, by text id (`## T01`; `## C01` in the calibration packet). */
export function sectionsOf(md: string): Map<string, string> {
  const parts = md.split(/^## ([TC]\d\d)\s*$/m);
  const out = new Map<string, string>();
  for (let k = 1; k < parts.length; k += 2) out.set(parts[k], parts[k + 1]);
  return out;
}

const field = (block: string, name: string) => block.match(new RegExp(`^${name}:[ \\t]*(.*)$`, 'm'))?.[1].trim();

/** An account sheet: an annotator's, or the reference. */
export function parseSheet(md: string): Map<string, Section> {
  const out = new Map<string, Section>();
  for (const [id, block] of sectionsOf(md)) {
    const table = tablesIn(block)[0];
    const rows = (table?.rows ?? []).map((r) => {
      const row: Row = { id: '', statement: '', cat: '', basis: '' };
      table.header.forEach((h, k) => {
        const key = COLUMNS[h];
        if (key) row[key] = r[k] ?? '';
      });
      return row;
    });
    out.set(id, { id, text: block.match(/^> (.*)$/m)?.[1].trim(), seen: field(block, 'Seen before'), decline: field(block, 'Decline'), rows });
  }
  return out;
}

/** The first account table after a corpus heading that names `marker` (`### P1 ◆ P-CS3-6 · …`). */
export function passAAccount(corpus: string, marker: string): Row[] {
  const headings = corpus.split(/^### /m).slice(1);
  const block = headings.find((h) => h.split('\n')[0].split(/\s+/).includes(marker));
  if (!block) throw new Error(`no corpus heading names ${marker}`);
  const table = tablesIn(block)[0];
  return table.rows.map((r) => ({ id: r[0], statement: r[1], cat: r[2], basis: r[3] ?? '' }));
}

/** Open-ended: a list of these can never be complete, so two careful lists differ (guide §7). */
export const OPEN_ENDED: readonly Category[] = ['I', 'U'];

/** What the annotator who didn't write an unpaired inferred or unknown statement thinks of it (guide §7). */
export type View = 'plausible' | 'unsupported';
export const VIEWS: readonly View[] = ['plausible', 'unsupported'];

/** One alignment row: A's number, B's number (`—` for none) and, for an unpaired open-ended statement, the other's view. */
export type Aligned = readonly [a: string, b: string, view?: string];

/** The A–B alignment, A's number beside B's, with the "Other's view" column. */
export function parseAlignment(md: string): Map<string, Aligned[]> {
  const out = new Map<string, Aligned[]>();
  for (const [id, block] of sectionsOf(md)) out.set(id, (tablesIn(block)[0]?.rows ?? []).map((r) => [r[0] ?? '', r[1] ?? '', r[2] ?? ''] as const));
  return out;
}

export type Verdict = 'match' | 'unlisted inference' | 'no basis' | 'outside the text';
export const VERDICTS: readonly Verdict[] = ['match', 'unlisted inference', 'no basis', 'outside the text'];

export interface AlignedRow {
  id: string;
  statement: string;
  cat: string;
  reference: string;
  verdict: string;
}

/** The pass A alignment: each pass A statement, and the reference statement it says the same as. */
export function parsePassAAlignment(md: string): Map<string, AlignedRow[]> {
  const out = new Map<string, AlignedRow[]>();
  for (const [id, block] of sectionsOf(md))
    out.set(id, (tablesIn(block)[0]?.rows ?? []).map((r) => ({ id: r[0], statement: r[1], cat: r[2], reference: r[3] ?? '', verdict: r[4] ?? '' })));
  return out;
}

/** Quotes and apostrophes compared as plain characters, case ignored. */
const plain = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').toLowerCase();

/** What a sheet's section gets wrong: categories, derivations, numbering, and an R row's quotation. */
export function sectionProblems(s: Section, text: string, opts: { reference?: boolean } = {}): string[] {
  const p: string[] = [];
  const at = (r: Row) => `${s.id} ${r.id || '(no number)'}`;
  if (s.rows.length && !opts.reference && !/^(yes|no)$/i.test(s.seen ?? '')) p.push(`${s.id}: "Seen before" is yes or no`);
  if (s.rows.length && !/^(no|yes:\s*\S.*)$/i.test(s.decline ?? '')) p.push(`${s.id}: "Decline" is no, or yes: and a reason`);
  const ids = s.rows.map((r) => r.id);
  for (const d of new Set(ids.filter((x, k) => ids.indexOf(x) !== k))) p.push(`${s.id}: ${d} is numbered twice`);
  for (const r of s.rows) {
    if (!(CATEGORIES as readonly string[]).includes(r.cat)) {
      p.push(`${at(r)}: category '${r.cat}' isn't one of R, L, I, P, U`);
      continue;
    }
    if (!new RegExp(`^${r.cat}\\d*$`).test(r.id)) p.push(`${at(r)}: numbered for another category than ${r.cat}`);
    if (!r.statement) p.push(`${at(r)}: no statement`);
    if (r.derivation !== undefined) {
      const allowed = DERIVATIONS[r.derivation];
      if (!allowed) p.push(`${at(r)}: derivation '${r.derivation}' isn't one of the guide's eight`);
      else if (!allowed.includes(r.cat as Category)) p.push(`${at(r)}: ${r.derivation} doesn't lead to ${r.cat}`);
    }
    if (r.cat === 'R') {
      const quotes = [...r.basis.matchAll(/["“]([^"”]+)["”]/g)].flatMap((m) => m[1].split('…').map((x) => x.trim()).filter(Boolean));
      if (!quotes.length) p.push(`${at(r)}: a reported statement's basis quotes the text`);
      for (const q of quotes) if (!plain(text).includes(plain(q))) p.push(`${at(r)}: "${q}" isn't in the text`);
    }
  }
  return p;
}
