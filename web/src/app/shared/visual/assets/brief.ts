/**
 * S8 Assets: what a generator may be asked for (milestone M7 stage C). A brief is a few choices
 * from fixed lists, never a sentence: no typed text, from a person or an exercise, can enter one.
 * The lists are a small starting set for the test provider; the real vocabulary is decided with
 * the proposal for a real provider, if there ever is one (docs/plan.md §10: generative AI is a
 * deferred decision). Pure data and checks.
 */
export const BRIEF_VOCABULARY = {
  /** The area the picture belongs to: the five themes of the visual language. */
  area: ['action', 'cognitive', 'attention', 'regulation', 'recovery'],
  /** The frame it fills (visual-language.md §12). */
  frame: ['banner', 'wide', 'standard', 'square'],
  /** What it shows, from a short list. */
  subject: ['path', 'horizon', 'stones'],
} as const;

export type BriefField = keyof typeof BRIEF_VOCABULARY;
export type Brief = { readonly [F in BriefField]: (typeof BRIEF_VOCABULARY)[F][number] };

/** Every problem with a brief; empty when each field has one of its listed words and nothing else is there. */
export function briefProblems(brief: Readonly<Record<string, unknown>>): string[] {
  const problems: string[] = [];
  const fields = Object.keys(BRIEF_VOCABULARY) as BriefField[];
  for (const field of fields) {
    const value = brief[field];
    if (value === undefined) problems.push(`a brief says its ${field}`);
    else if (typeof value !== 'string' || !(BRIEF_VOCABULARY[field] as readonly string[]).includes(value))
      problems.push(`'${String(value).slice(0, 40)}' isn't a listed ${field} (${BRIEF_VOCABULARY[field].join(', ')})`);
  }
  for (const key of Object.keys(brief)) if (!fields.includes(key as BriefField)) problems.push(`a brief has no field '${key.slice(0, 40)}'`);
  return problems;
}
