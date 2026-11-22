import type { IdiomId } from './contract';
import type { Pattern } from './registry';

/**
 * STUDY CODE, revision 8 (findings-revision-8.md §1, OI-39): what each pattern's coverage accounts for.
 *
 * `draws`: the kinds of statement its coverage accounts for, shown or declared not shown. A kind is a
 * predicate, `question:<asks>` for an open question (`question:*` for every question), or
 * `alternatives` for a possibility set. `single`: kinds it accounts for only once.
 *
 * Read from each pattern's coverage code (which statements it takes, and whether with `[0]`), and
 * checked against its accepted cases' coverage (revision-8.spec.ts). The rule, for every pattern:
 * any drawable statement (established, an open question or a possibility set) of a kind outside
 * `draws` is a declared need; a repeat of a kind in `single` is a declared need; inferred statements
 * never count.
 */
export interface Lists {
  draws: readonly string[];
  single?: readonly string[];
}

const PASSING: Lists = {
  draws: ['passes', 'exchange-absent', 'alternatives', 'question:attention', 'question:whether', 'question:cause', 'question:motion'],
  single: ['passes', 'exchange-absent', 'alternatives', 'question:attention', 'question:whether', 'question:cause', 'question:motion'],
};
const RECEIVED_ALONE: Lists = {
  draws: ['sends', 'receives', 'located-in', 'apart', 'feels', 'holds', 'question:intent', 'question:setting'],
  single: ['sends', 'receives', 'located-in', 'apart', 'feels', 'holds', 'question:intent', 'question:setting'],
};
const CYCLE: Lists = {
  draws: ['cycles', 'flows', 'joins', 'transforms', 'above', 'part-of', 'question:fate'],
  single: ['cycles', 'joins', 'question:fate'],
};
const HELD_BY: Lists = {
  draws: ['complete', 'precedes', 'depends-on', 'absent', 'waiting', 'exchange-absent', 'question:time'],
  single: ['complete', 'precedes', 'depends-on', 'absent', 'waiting', 'exchange-absent', 'question:time'],
};
const EXCEEDING: Lists = { draws: ['exceeds', 'alternatives', 'question:cause'], single: ['exceeds', 'alternatives', 'question:cause'] };
const BEHIND_PLAN: Lists = { draws: ['behind', 'alternatives', 'question:cause'], single: ['behind', 'alternatives', 'question:cause'] };
const SHIFTED: Lists = { draws: ['shifts', 'exchange-absent', 'alternatives', 'question:cause'], single: ['shifts', 'exchange-absent', 'alternatives', 'question:cause'] };
const GROUP_REACTS: Lists = { draws: ['located-in', 'reacts', 'sends', 'question:*'], single: ['located-in', 'reacts'] };
const HELD_ONTO: Lists = { draws: ['contact', 'displaced', 'exchange-absent', 'located-in', 'sends', 'question:*'], single: ['contact', 'displaced', 'exchange-absent', 'sends'] };

/** The general patterns' lists (revision 5–7), shared with composition (compose.ts). */
// Revision 8: one `above` (found by the probe: it draws the route's height once).
export const MOTION: Lists = { draws: ['flows', 'above', 'contact', 'displaced', 'form', 'question:*'], single: ['above'] };
export const DEPENDENCY: Lists = { draws: ['depends-on', 'part-of', 'complete', 'located-in', 'question:*'], single: ['depends-on'] };
export const FELT: Lists = { draws: ['feels', 'located-in', 'alternatives', 'question:*'], single: ['feels', 'alternatives'] };

export const LISTS: Record<IdiomId, Record<string, Lists>> = {
  kinetic: {
    encounter: PASSING,
    // Attention questions: one about the one held, one about the crowd (it takes each by subject), so not single.
    jostled: { draws: ['contact', 'displaced', 'exchange-absent', 'located-in', 'sends', 'question:attention'], single: ['contact', 'displaced', 'exchange-absent', 'sends'] },
    reacting: { draws: ['located-in', 'reacts', 'sends', 'question:attention', 'question:intent'], single: ['located-in', 'reacts', 'question:attention', 'question:intent'] },
    awaiting: {
      draws: ['sends', 'exchange-absent', 'waiting', 'depends-on', 'alternatives', 'question:attention', 'question:cause', 'question:time'],
      single: ['sends', 'exchange-absent', 'waiting', 'depends-on', 'alternatives', 'question:attention', 'question:cause', 'question:time'],
    },
    transmission: RECEIVED_ALONE,
    shifted: SHIFTED,
    compared: EXCEEDING,
    lagging: BEHIND_PLAN,
    cycle: CYCLE,
    blocked: HELD_BY,
    motion: MOTION,
    dependency: DEPENDENCY,
    felt: FELT,
  },
  field: {
    clarity: PASSING,
    openWait: { draws: ['sends', 'exchange-absent', 'waiting', 'alternatives', 'question:*'], single: ['sends', 'exchange-absent', 'waiting', 'alternatives'] },
    shiftedField: SHIFTED,
    grownField: EXCEEDING,
    lateField: BEHIND_PLAN,
    agitation: RECEIVED_ALONE,
    flow: CYCLE,
    ripples: GROUP_REACTS,
    crowdField: HELD_ONTO,
    heldWait: { draws: ['sends', 'waiting', 'depends-on', 'exchange-absent', 'question:*'], single: ['sends', 'waiting', 'depends-on', 'exchange-absent'] },
    held: HELD_BY,
    motion: MOTION,
    dependency: DEPENDENCY,
    felt: FELT,
  },
  spatial: {
    passing: PASSING,
    carriage: HELD_ONTO,
    meetingRoom: GROUP_REACTS,
    athome: RECEIVED_ALONE,
    system: CYCLE,
    plants: EXCEEDING,
    way: HELD_BY,
    pathScene: {
      draws: ['sends', 'exchange-absent', 'waiting', 'depends-on', 'shifts', 'behind', 'alternatives', 'question:*'],
      single: ['sends', 'exchange-absent', 'waiting', 'depends-on', 'shifts', 'behind', 'alternatives'],
    },
    motion: MOTION,
    dependency: DEPENDENCY,
    felt: FELT,
  },
};

/** Gives each pattern its lists; a pattern without lists is an error, not a silent pass. */
export function listed<T>(idiom: IdiomId, patterns: readonly Omit<Pattern<T>, 'draws' | 'single'>[]): Pattern<T>[] {
  return patterns.map((p) => {
    const lists = LISTS[idiom][p.name];
    if (!lists) throw new Error(`${idiom}: pattern '${p.name}' declares no lists (draws.ts)`);
    return { ...p, ...lists };
  });
}
