/**
 * S12: what the general patterns' coverage accounts for (Stage 3, M3; written by the representation
 * study, revision 8, OI-39). `draws`: the kinds of statement it accounts for, shown or declared not
 * shown (a predicate, `question:<asks>`, `question:*` for every question, `alternatives`). `single`:
 * kinds it accounts for only once. Any drawable statement of another kind, or a repeat of a single
 * kind, is a need the pattern declares (dispatch.ts, `listLacks`).
 */
export interface Lists {
  draws: readonly string[];
  single?: readonly string[];
}

// Revision 8: one `above` (found by the probe: it draws the route's height once).
export const MOTION: Lists = { draws: ['flows', 'above', 'contact', 'displaced', 'form', 'question:*'], single: ['above'] };
export const DEPENDENCY: Lists = { draws: ['depends-on', 'part-of', 'complete', 'located-in', 'question:*'], single: ['depends-on'] };
export const FELT: Lists = { draws: ['feels', 'located-in', 'alternatives', 'question:*'], single: ['feels', 'alternatives'] };

/** The general patterns' lists, by pattern. */
export const GENERAL_LISTS: Readonly<Record<'motion' | 'dependency' | 'felt', Lists>> = { motion: MOTION, dependency: DEPENDENCY, felt: FELT };
