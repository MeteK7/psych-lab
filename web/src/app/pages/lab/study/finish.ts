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

const SHADOWS = {
  kind: 'form',
  what: 'A soft contact shadow under each presence',
  why: 'Flat forms read as tokens on a page; a contact shadow sets them on a surface, so they read as beings that move across it',
  set: { shadows: true },
} as const;

const FIGURE_EIGHT = {
  kind: 'layout',
  what: 'The two sides of the heart side by side in the middle, lungs above, body below',
  why: 'They belong to one heart. The rules put them opposite each other because v0 has no part-of (G-27); side by side, the two circuits read',
  set: { layout: 'figure-eight' },
} as const;

export const FINISH: Record<'P1' | 'P2' | 'E1' | 'M1', Finishes> = {
  P1: {
    spatial: [
      {
        id: 'P1-S1',
        kind: 'layout',
        what: 'The scene a moment before the passing, the other person a few steps ahead',
        why: 'S8 picks the passing itself, and at the passing the other person is beside you, out of view through your own eyes. The phase has to depend on the stance',
        set: { passingOffset: 1.6 },
      },
      {
        id: 'P1-S2',
        kind: 'camera',
        what: 'From across: further round and higher, with a longer lens',
        why: 'Side-on, the two figures stood one behind the other; from a quarter turn they separate and fill the middle third',
        set: { keys: { across: { pos: [5.0, 2.6, -4.2], target: [0, 0.85, 0], f: 860 } } },
      },
    ],
    kinetic: [
      {
        id: 'P1-K1',
        kind: 'form',
        what: 'The ring of possibilities inside the gap between the two ways, smaller',
        why: 'At the rules’ size two marks sat on your own path, where they read as stops along it',
        set: { ringRadius: 24, ringMark: 6 },
      },
      { id: 'P1-K2', ...SHADOWS },
    ],
    field: [
      {
        id: 'P1-F1',
        kind: 'form',
        what: 'The open headings turn more, start further out and reach less far, with four lines each',
        why: 'Straight lines radiating from one point read as a burst, close to alarm imagery (visual-policy §7); turned, they read as slow currents',
        set: { turn: 0.6, headingStart: 76, reach: 170, perHeading: 4 },
      },
    ],
  },
  P2: {
    spatial: [
      {
        id: 'P2-S1',
        kind: 'camera',
        what: 'Through your own eyes: looking ahead into the room, the phone low in the view',
        why: 'Looking down at the phone, the forearms filled the frame and the phone was a sliver; looking ahead, your hands and the phone sit at the bottom and the room is in view',
        set: { keys: { own: { pos: [0.4, 1.14, 1.56], target: [0.4, 0.74, 3.4], f: 560 } } },
      },
      {
        id: 'P2-S5',
        kind: 'camera',
        what: 'From behind: further back and higher',
        why: 'A metre behind your head, the head filled the frame and the window crowded the top',
        set: { keys: { behind: { pos: [-0.9, 2.15, -0.35], target: [0.5, 0.75, 2.3], f: 600 } } },
      },
      {
        id: 'P2-S2',
        kind: 'layout',
        what: 'The window on the wall you face',
        why: 'On the left wall it was out of view from every stance but one',
        set: { window: 'front' },
      },
      {
        id: 'P2-S3',
        kind: 'form',
        what: 'A faint line where the floor meets the walls',
        why: 'The walls and the floor are close in tone and the room didn’t read; the room uses the same line',
        set: { floorEdges: true },
      },
      {
        id: 'P2-S4',
        kind: 'form',
        what: 'The cut top edge of walls drawn low',
        why: 'From outside, walls drawn low vanished into the ground and the rooms beside yours were armchairs floating in space; the room draws its cut edges for the same reason',
        set: { cutEdges: true },
      },
    ],
    kinetic: [
      {
        id: 'P2-K1',
        kind: 'form',
        what: 'A low arc for the reply',
        why: 'The high arc rose and fell like something thrown; low, it reads as a message crossing a distance',
        set: { arcLift: 30 },
      },
      { id: 'P2-K2', ...SHADOWS },
    ],
    field: [],
  },
  E1: {
    spatial: [
      { id: 'E1-S1', ...FIGURE_EIGHT },
      {
        id: 'E1-S2',
        kind: 'form',
        what: 'A thinner tube and larger beads',
        why: 'The tube was heavier than the places it joins; thinner, it reads as a way, and the beads carry the oxygen visibly',
        set: { tube: 0.045, bead: 0.05 },
      },
    ],
    kinetic: [{ id: 'E1-K1', ...FIGURE_EIGHT }],
    field: [{ id: 'E1-F1', ...FIGURE_EIGHT }],
  },
  M1: {
    spatial: [
      {
        id: 'M1-S1',
        kind: 'camera',
        what: 'From the way: a step back, a little to the right, with a wider lens',
        why: 'The design block filled a third of the frame and was cut by its edge; further back, design, the gate and build are in one view',
        set: { keys: { within: { pos: [0.7, 1.6, -4.6], target: [0, 0.9, 7], f: 520 } } },
      },
    ],
    kinetic: [],
    field: [],
  },
};

/** The tuning changes of a list of adjustments, applied in order (camera keys merged by stance). */
export function merged<T>(list: readonly Adjustment<T>[]): Partial<T> {
  return list.reduce<Partial<T>>((acc, a) => {
    const keys = { ...((acc as { keys?: object }).keys ?? {}), ...((a.set as { keys?: object }).keys ?? {}) };
    return { ...acc, ...a.set, ...(Object.keys(keys).length ? { keys } : {}) } as Partial<T>;
  }, {});
}
