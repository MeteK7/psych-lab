import type { FieldTuning } from './idioms/field';
import type { KineticTuning } from './idioms/kinetic';
import type { SpatialTuning } from './idioms/spatial';

/**
 * STUDY CODE: hand finishing (docs/visual-study/README.md, the by-the-rules protocol). Each entry is
 * one departure from an idiom's rules, for one figure, with its reason. This list is the deviation
 * log: the Lab prints it under each finished figure, and findings-slice-1.md summarises it.
 *
 * Kinds: `layout` (where things are), `camera` (a viewpoint key), `form` (a shape or size),
 * `timing`, `labels`, `content` (what is shown).
 */
export interface Adjustment<T> {
  id: string;
  kind: 'layout' | 'camera' | 'form' | 'timing' | 'labels' | 'content';
  what: string;
  why: string;
  set: Partial<T>;
}

export interface Finishes {
  spatial: readonly Adjustment<SpatialTuning>[];
  kinetic: readonly Adjustment<KineticTuning>[];
  field: readonly Adjustment<FieldTuning>[];
}

// Revision 3 (2026-11-21) folded the hand changes that repeated, or that the review showed to be
// rules, into the rules: P1-K2 and P2-K2 (contact shadows, K2r3); P2-S1, P2-S5 and M1-S1 (cameras, the
// framing rule S7r3); P2-S2–S4 (the home's window and edges, S1r3); E1-S1, E1-K1 and E1-F1 (the heart's
// two sides together, part-of and C9). What remains here didn't generalise.
// Revision 4 (2026-11-21): P1-F1, used five times, became rule F4 (R4-1); E2-S1 became `above` (R4-2);
// M2-S1 became the placement rule (R4-3); E3-S1 became the leaf shape (R4-5).
export const FINISH: Record<string, Finishes> = {
  P1: {
    // Revision 2 of the passing rules replaced the first finishing (P1-S1, P1-S2), which fixed the
    // look by moving the two people apart and lost the encounter (findings §8).
    spatial: [],
    kinetic: [
      {
        id: 'P1-K1',
        kind: 'form',
        what: 'The ring of possibilities inside the gap between the two ways, smaller',
        why: 'At the rules’ size two marks sat on your own path, where they read as stops along it',
        set: { ringRadius: 24, ringMark: 6 },
      },
    ],
    field: [],
  },
  P2: {
    spatial: [],
    kinetic: [
      {
        id: 'P2-K1',
        kind: 'form',
        what: 'A low arc for the reply',
        why: 'The high arc rose and fell like something thrown; low, it reads as a message crossing a distance',
        set: { arcLift: 30 },
      },
    ],
    field: [],
  },
  E1: {
    spatial: [
      {
        id: 'E1-S2',
        kind: 'form',
        what: 'A thinner tube and larger beads',
        why: 'The tube was heavier than the places it joins; thinner, it reads as a way, and the beads carry the oxygen visibly',
        set: { tube: 0.045, bead: 0.05 },
      },
    ],
    kinetic: [],
    field: [],
  },
  M1: { spatial: [], kinetic: [], field: [] },

  // ── Slice 2 (2026-11-21) ──────────────────────────────────────────────────────────────────────
  P3: { spatial: [], kinetic: [], field: [] },
  P4: { spatial: [], kinetic: [], field: [] },
  P5: {
    spatial: [
      {
        id: 'P5-S1',
        kind: 'camera',
        what: 'Through your own eyes: a wider lens, aimed down the table',
        why: 'The people beside you filled the edges of the frame, cut in half; wider, the table and everyone round it are in view',
        set: { keys: { own: { pos: [0, 1.14, 0.53], target: [0, 0.82, 3.3], f: 430 } } },
      },
    ],
    kinetic: [],
    field: [],
  },
  P6: { spatial: [], kinetic: [], field: [] },
  E2: { spatial: [], kinetic: [], field: [] },
  E3: { spatial: [], kinetic: [], field: [] },
  M2: { spatial: [], kinetic: [], field: [] },
  M3: { spatial: [], kinetic: [], field: [] },
};

/** The tuning changes of a list of adjustments, applied in order (camera keys merged by stance). */
export function merged<T>(list: readonly Adjustment<T>[]): Partial<T> {
  return list.reduce<Partial<T>>((acc, a) => {
    const keys = { ...((acc as { keys?: object }).keys ?? {}), ...((a.set as { keys?: object }).keys ?? {}) };
    return { ...acc, ...a.set, ...(Object.keys(keys).length ? { keys } : {}) } as Partial<T>;
  }, {});
}
