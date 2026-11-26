/**
 * STUDY CODE, Track A (TRACK-A: AI-generated, development only, not validated). Which texts a run
 * may take. Only the synthetic development set, which you write, in
 * docs/interpretation-dev/dev-set/texts.md (contract below). Everything else is protected:
 * - the corpus and the robustness set
 * - the unseen cases
 * - the human trial's calibration and slice 1 texts
 * - the sealed held-out set
 * - the guide's examples
 * - the offline fixtures
 *
 * Pure: the caller reads the files.
 */
export interface Source {
  id: string;
  text: string;
  origin: 'corpus' | 'robustness';
}

/** A text from the development set. */
export interface DevText {
  id: string;
  domain: string;
  text: string;
}

const plain = (t: string) => t.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim();

/** The corpus texts: each `### ` heading's first quoted line, by the case id the heading gives last before its title. */
export function corpusTexts(md: string): Source[] {
  return md
    .split(/^### /m)
    .slice(1)
    .map((block) => {
      const head = block.split(/\r?\n/)[0];
      const id = head.split(' · ')[0].split(/\s+/).filter((w) => w !== '◆').pop()!;
      const quoted = block.match(/^> "(.*)"\s*$/m)?.[1];
      return { id, text: quoted ?? '', origin: 'corpus' as const };
    })
    .filter((s) => s.text);
}

/** The robustness texts, from its table. */
export function robustnessTexts(rows: readonly string[][]): Source[] {
  return rows.map((r) => ({ id: r[0].replace(' ◆', '').trim(), text: r[3], origin: 'robustness' as const }));
}

/**
 * THE DEVELOPMENT SET'S INPUT CONTRACT. One markdown table whose header is exactly
 * `| Id | Domain | Text |`. Each row:
 * - **Id:** `D` and three digits (D001 … D999), unique.
 * - **Domain:** free words, for example "psychology".
 * - **Text:** the text, on one line, with no `|` in it.
 * Rows with an empty Text are ignored, so a row can be reserved.
 */
export const DEV_SET_HEADER = ['Id', 'Domain', 'Text'];
export const DEV_ID = /^D\d{3}$/;

export function devSetTexts(rows: readonly string[][], header: readonly string[]): { texts: DevText[]; problems: string[] } {
  const problems: string[] = [];
  if (header.join('|') !== DEV_SET_HEADER.join('|')) return { texts: [], problems: [`the table's header is "${header.join(' | ')}", not "${DEV_SET_HEADER.join(' | ')}"`] };
  const texts: DevText[] = [];
  for (const r of rows) {
    const [id, domain, text] = [r[0] ?? '', r[1] ?? '', (r[2] ?? '').trim()];
    if (!text) continue;
    if (r.length !== 3) problems.push(`${id || '(no id)'}: a row has ${r.length} cells; a text can't contain "|"`);
    else if (!DEV_ID.test(id)) problems.push(`${id || '(no id)'}: an id is D and three digits`);
    else if (texts.some((t) => t.id === id)) problems.push(`${id}: used twice`);
    else texts.push({ id, domain, text });
  }
  return { texts, problems };
}

/** A Markdown table's separator row, in any standard form: `|---|`, `| --- |`, `|:---:|` … */
const SEPARATOR = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;
const cellsOf = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

/** The development set from its file: the first table, read as standard Markdown, then checked against the contract. */
export function readDevSet(md: string): { texts: DevText[]; problems: string[] } {
  const lines = md.split(/\r?\n/);
  const at = lines.findIndex((l, k) => l.trim().startsWith('|') && SEPARATOR.test((lines[k + 1] ?? '').trim()));
  if (at < 0) return { texts: [], problems: [`no table found: the file needs a header row "| ${DEV_SET_HEADER.join(' | ')} |" followed by a separator row such as "| --- | --- | --- |"`] };
  const rows: string[][] = [];
  for (let k = at + 2; k < lines.length && lines[k].trim().startsWith('|'); k++) rows.push(cellsOf(lines[k]));
  return devSetTexts(rows, cellsOf(lines[at]));
}

/**
 * The texts a run takes: development-set texts only, none that repeats or contains a protected text
 * (or is contained in one), and, with `only`, just those ids. Any other id asked for is refused.
 */
export function devSelection(dev: readonly DevText[], protectedTexts: readonly string[], only?: readonly string[]): { take: DevText[]; refused: { id: string; why: string }[] } {
  const guard = protectedTexts.map(plain).filter(Boolean);
  const take: DevText[] = [];
  const refused: { id: string; why: string }[] = [];
  for (const t of dev) {
    if (only && !only.includes(t.id)) continue;
    const p = plain(t.text);
    if (guard.some((g) => p.includes(g) || g.includes(p))) refused.push({ id: t.id, why: 'repeats a protected text (corpus, robustness, unseen, calibration, slice 1, held-out, guide or fixture)' });
    else take.push(t);
  }
  for (const id of only ?? []) if (!dev.some((t) => t.id === id)) refused.push({ id, why: 'not in the synthetic development set' });
  return { take, refused };
}
