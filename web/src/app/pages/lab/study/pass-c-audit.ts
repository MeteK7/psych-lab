import { CASES } from './cases';

/**
 * STUDY CODE, pass C: the domain-code audit. Finds, in the rules' code (idioms/ and kit/), the
 * corpus's case ids and the words of its cases (element ids and their words), with comments removed.
 * Each hit is a place where a rule may know a domain rather than a structure.
 */
export interface Hit {
  file: string;
  line: number;
  word: string;
  /** Where in the code: a string (a purpose, an element id, a label) or the logic itself. */
  where: 'string' | 'code';
  text: string;
}

/** The representation's own vocabulary (the own presence, a and b, the plan), which isn't domain knowledge. */
const GENERIC = new Set(['own', 'you', 'plan', 'a', 'b']);

export function domainWords(): string[] {
  const out = new Set<string>();
  for (const c of CASES) {
    for (const e of c.rep.elements) {
      out.add(e.id.toLowerCase());
      for (const t of (c.words[e.id] ?? '').toLowerCase().split(/[^a-z]+/)) if (t.length >= 4) out.add(t);
    }
  }
  return [...out].filter((w) => !GENERIC.has(w) && w.length >= 3).sort();
}

/** Removes comments, keeping line numbers. */
export function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`])\/\/.*$/gm, (m, p) => p);
}

export function audit(files: Record<string, string>): Hit[] {
  const words = domainWords();
  const ids = CASES.map((c) => c.id);
  const hits: Hit[] = [];
  for (const [file, src] of Object.entries(files)) {
    stripComments(src)
      .split('\n')
      .forEach((text, i) => {
        const strings = [...text.matchAll(/'[^']*'|`[^`]*`|"[^"]*"/g)].map((m) => [m.index!, m.index! + m[0].length]);
        const inString = (at: number) => strings.some(([a, b]) => at > a && at < b);
        for (const w of [...ids, ...words]) {
          const re = new RegExp(String.raw`\b${w}\b`, ids.includes(w) ? 'g' : 'gi');
          for (const m of text.matchAll(re)) hits.push({ file, line: i + 1, word: w, where: inString(m.index!) ? 'string' : 'code', text: text.trim().slice(0, 140) });
        }
      });
  }
  return hits;
}
