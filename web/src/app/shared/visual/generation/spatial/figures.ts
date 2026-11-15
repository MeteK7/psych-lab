import type { V3 } from './camera';

/**
 * S2 Generation, spatial: people as geometry (visual-policy.md §7, the exception for people in a
 * situation). A figure is a few tapered capsules and a head, like an artist's mannequin: faceless,
 * unexpressive, of one neutral build, with no clothing, hair, age or gender cues. Its poses are
 * the only ones a scene may use, so no figure can be made to look a particular way.
 */

/** A body part: from one joint to another, with a radius at each end (metres, local coordinates). */
export interface Part {
  name: PartName;
  from: V3;
  to: V3;
  r0: number;
  r1: number;
}

export const PART_NAMES = ['thigh-l', 'thigh-r', 'shin-l', 'shin-r', 'torso', 'neck', 'arm-l', 'arm-r', 'forearm-l', 'forearm-r'] as const;
export type PartName = (typeof PART_NAMES)[number];

export interface Pose {
  id: PoseId;
  parts: readonly Part[];
  head: { at: V3; r: number };
}

export type PoseId = 'seated' | 'seated-at-screen' | 'standing' | 'walking';

/** The parts a person can see of themself, looking out through their own eyes: their forearms. */
export const SEEN_FROM_WITHIN: readonly PartName[] = ['forearm-l', 'forearm-r'];

const part = (name: PartName, from: V3, to: V3, r0: number, r1: number): Part => ({ name, from, to, r0, r1 });
const legsSeated = [
  part('thigh-l', [-0.1, 0.52, -0.12], [-0.11, 0.52, 0.3], 0.075, 0.065),
  part('thigh-r', [0.1, 0.52, -0.12], [0.11, 0.52, 0.3], 0.075, 0.065),
  part('shin-l', [-0.11, 0.5, 0.3], [-0.11, 0.06, 0.36], 0.055, 0.045),
  part('shin-r', [0.11, 0.5, 0.3], [0.11, 0.06, 0.36], 0.055, 0.045),
];

/** Every pose, facing +z, the origin on the floor (under a seat's front edge, or between the feet). */
export const POSES: Readonly<Record<PoseId, Pose>> = {
  // Seated at a table, forearms resting on it.
  seated: {
    id: 'seated',
    head: { at: [0, 1.14, -0.04], r: 0.105 },
    parts: [
      ...legsSeated,
      part('torso', [0, 0.58, -0.12], [0, 0.9, -0.08], 0.15, 0.17),
      part('neck', [0, 0.95, -0.07], [0, 1.04, -0.05], 0.05, 0.045),
      part('arm-l', [-0.19, 0.93, -0.07], [-0.23, 0.84, 0.22], 0.05, 0.045),
      part('arm-r', [0.19, 0.93, -0.07], [0.23, 0.84, 0.22], 0.05, 0.045),
      // Forearms and hands as one form, resting on the table, the hands almost together in front.
      part('forearm-l', [-0.23, 0.84, 0.22], [-0.07, 0.8, 0.6], 0.045, 0.04),
      part('forearm-r', [0.23, 0.84, 0.22], [0.07, 0.8, 0.6], 0.045, 0.04),
    ],
  },
  // Seated, turned to a screen: both hands forward on its keyboard.
  'seated-at-screen': {
    id: 'seated-at-screen',
    head: { at: [0.02, 1.12, 0.0], r: 0.105 },
    parts: [
      ...legsSeated,
      part('torso', [0, 0.58, -0.12], [0.01, 0.9, -0.05], 0.15, 0.17),
      part('neck', [0.01, 0.95, -0.04], [0.02, 1.03, -0.01], 0.05, 0.045),
      part('arm-l', [-0.18, 0.93, -0.05], [-0.2, 0.84, 0.2], 0.05, 0.045),
      part('arm-r', [0.2, 0.93, -0.05], [0.24, 0.84, 0.18], 0.05, 0.045),
      part('forearm-l', [-0.2, 0.84, 0.2], [-0.05, 0.81, 0.46], 0.045, 0.04),
      part('forearm-r', [0.24, 0.84, 0.18], [0.13, 0.81, 0.47], 0.045, 0.04),
    ],
  },
  standing: {
    id: 'standing',
    head: { at: [0, 1.64, 0.03], r: 0.105 },
    parts: [
      part('thigh-l', [-0.09, 0.95, 0], [-0.1, 0.52, 0.02], 0.075, 0.06),
      part('shin-l', [-0.1, 0.52, 0.02], [-0.1, 0.06, 0], 0.055, 0.045),
      part('thigh-r', [0.09, 0.95, 0], [0.1, 0.52, 0.02], 0.075, 0.06),
      part('shin-r', [0.1, 0.52, 0.02], [0.1, 0.06, 0], 0.055, 0.045),
      part('torso', [0, 1.0, 0], [0, 1.4, 0.02], 0.15, 0.17),
      part('neck', [0, 1.44, 0.02], [0, 1.53, 0.04], 0.05, 0.045),
      part('arm-l', [-0.2, 1.42, 0.02], [-0.22, 1.16, 0.12], 0.05, 0.045),
      part('forearm-l', [-0.22, 1.16, 0.12], [-0.1, 1.04, 0.36], 0.045, 0.04),
      part('arm-r', [0.2, 1.42, 0.02], [0.22, 1.16, 0.12], 0.05, 0.045),
      part('forearm-r', [0.22, 1.16, 0.12], [0.1, 1.04, 0.36], 0.045, 0.04),
    ],
  },
  // Mid-stride.
  walking: {
    id: 'walking',
    head: { at: [0, 1.63, 0.02], r: 0.105 },
    parts: [
      part('thigh-l', [-0.09, 0.95, 0], [-0.1, 0.52, 0.18], 0.075, 0.06),
      part('shin-l', [-0.1, 0.52, 0.18], [-0.1, 0.06, 0.26], 0.055, 0.045),
      part('thigh-r', [0.09, 0.95, 0], [0.1, 0.52, -0.1], 0.075, 0.06),
      part('shin-r', [0.1, 0.52, -0.1], [0.1, 0.08, -0.3], 0.055, 0.045),
      part('torso', [0, 1.0, 0], [0, 1.4, 0.02], 0.15, 0.17),
      part('neck', [0, 1.44, 0.02], [0, 1.53, 0.03], 0.05, 0.045),
      part('arm-l', [-0.2, 1.42, 0.02], [-0.23, 1.14, -0.1], 0.05, 0.045),
      part('forearm-l', [-0.23, 1.14, -0.1], [-0.22, 0.9, -0.14], 0.045, 0.04),
      part('arm-r', [0.2, 1.42, 0.02], [0.23, 1.14, 0.12], 0.05, 0.045),
      part('forearm-r', [0.23, 1.14, 0.12], [0.22, 0.92, 0.2], 0.045, 0.04),
    ],
  },
};
