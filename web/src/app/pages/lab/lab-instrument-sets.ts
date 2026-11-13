import { CS_WHY_IT_HAPPENED, STATE_RESET } from '../../../content';
import { CauseMapInput } from '../../shared/visual/instruments/cause-map/cause-map';
import { TrackingInput } from '../../shared/visual/instruments/tracking/tracking';

/**
 * The instrument inputs the Visual Lab shows (shared by the Lab page and the parity page, M6): the
 * cause map's answer sets, the rounds, and the dot game's stills and preview.
 */

const AXIS_WORDS = CS_WHY_IT_HAPPENED.map.axes;
export const CAUSE_AXES: CauseMapInput['axes'] = {
  left: AXIS_WORDS[0].low,
  right: AXIS_WORDS[0].high,
  top: AXIS_WORDS[1].low,
  bottom: AXIS_WORDS[1].high,
};

/** Answer sets covering every case the map has to draw. */
export const CAUSE_SETS: { key: string; name: string; placing: number; causes: CauseMapInput['causes'] }[] = [
  { key: 'start', name: 'Step 4, the start: every cause in the middle, cause 1 being placed', placing: 1, causes: [{ who: 3, time: 3 }, { who: 3, time: 3 }, { who: 3, time: 3 }] },
  { key: 'placing', name: 'Step 4: cause 2 being placed', placing: 2, causes: [{ who: 1, time: 2 }, { who: 3, time: 3 }, { who: 3, time: 3 }] },
  { key: 'spread', name: 'Step 5: causes spread out', placing: 0, causes: [{ who: 1, time: 2 }, { who: 5, time: 5 }, { who: 2, time: 5 }] },
  { key: 'heavy', name: 'Step 5: a heavy map, every cause in one corner', placing: 0, causes: [{ who: 1, time: 1 }, { who: 1, time: 1 }, { who: 1, time: 1 }] },
  { key: 'six', name: 'Step 5: six causes in one place, at the edge', placing: 0, causes: Array.from({ length: 6 }, () => ({ who: 5, time: 1 })) },
];

export const ROUND_SETS = [
  { current: 1, name: 'Before the first round, and during it' },
  { current: 4, name: 'Round 4: three done' },
  { current: 8, name: 'The last round' },
];
export const ROUNDS_TOTAL = 8;

export const RING_RADIUS = STATE_RESET.game.ring_radius;
export const PREVIEW_LABELS = STATE_RESET.how_it_works.labels;

/** One still frame of the dot game, with the pointer outside the ring or inside it. */
export function trackingStill(onTarget: boolean): TrackingInput {
  return {
    size: { width: 480, height: 320 },
    target: { x: 170, y: 140 },
    cursor: onTarget ? { x: 178, y: 148 } : { x: 300, y: 220 },
    ringRadius: RING_RADIUS,
    onTarget,
  };
}
