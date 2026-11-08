import { Entrance, SceneDefinition, SceneElement } from '../composition/scene';
import { SCENES } from '../scenes';
import { MCII_PATH } from '../scenes/action/mcii-path.scene';
import { MOTION } from '../styling/vocabulary';
import { motionProblems, movers, planMotion } from './plan-motion';

const P = { serves: ['understanding'], why: 'Test element.' } as const;
const dot = (id: string, enter: Entrance): SceneElement => ({
  kind: 'shape',
  id,
  geometry: { type: 'circle', cx: 0, cy: 0, r: 1 },
  style: { role: 'subject' },
  purpose: P,
  enter,
});

/** Four dots that appear together in state `b`, each fading on its own. */
const CROWDED: SceneDefinition = {
  id: 'test.crowded',
  version: 1,
  theme: 'action',
  frame: 'banner',
  layers: [{ id: 's', plane: 'subject', elements: ['a1', 'a2', 'a3', 'a4'].map((id) => dot(id, { effect: 'fade', why: 'x' })) }],
  states: { initial: 'a', states: { a: { visible: [] }, b: { visible: ['a1', 'a2', 'a3', 'a4'] } } },
  alt: { a: 'x', b: 'x' },
  transitions: [['a', 'b']],
};

describe('S5 motion', () => {
  it('moves nothing on a first appearance, without a change, or below the full tier', () => {
    expect(planMotion(MCII_PATH, null, 'contrast', 'full')).toEqual([]);
    expect(planMotion(MCII_PATH, 'contrast', 'contrast', 'full')).toEqual([]);
    expect(planMotion(MCII_PATH, 'future', 'contrast', 'reduced')).toEqual([]);
    expect(planMotion(MCII_PATH, 'future', 'contrast', 'static')).toEqual([]);
  });

  it('enters new elements with their effect, together with the elements that come with them', () => {
    const tracks = planMotion(MCII_PATH, 'future', 'contrast', 'full');
    const wall = tracks.filter((t) => t.id === 'wall');
    expect(wall.map((t) => t.property).sort()).toEqual(['offsetY', 'opacity']);
    expect(wall.find((t) => t.property === 'offsetY')).toMatchObject({ from: 8, to: 0, delay: 0, duration: MOTION.durations.deliberate, easing: MOTION.easing.arrive });
    // The courses rise with the wall; the label fades at the same moment.
    expect(tracks.filter((t) => t.id === 'wall-courses').map((t) => t.property).sort()).toEqual(['offsetY', 'opacity']);
    expect(tracks.filter((t) => t.id === 'label-obstacle')).toEqual([
      expect.objectContaining({ property: 'opacity', from: 0, to: 1, delay: 0, duration: MOTION.durations.moderate }),
    ]);
  });

  it('eases an emphasis change on an element that stays', () => {
    const wish = planMotion(MCII_PATH, 'future', 'contrast', 'full').filter((t) => t.id === 'wish');
    expect(wish).toEqual([
      expect.objectContaining({ property: 'emphasis', from: 'focal', to: 'normal', duration: MOTION.durations.moderate, easing: MOTION.easing.move }),
    ]);
  });

  it('draws a line along its direction, and fades its label with it', () => {
    const tracks = planMotion(MCII_PATH, 'contrast', 'plan', 'full');
    expect(tracks.map((t) => [t.id, t.property])).toEqual([
      ['bridge', 'reveal'],
      ['label-plan', 'opacity'],
    ]);
  });

  it('lets departures go at once: only the elements that stay and change move', () => {
    const tracks = planMotion(MCII_PATH, 'contrast', 'aside', 'full');
    expect(tracks.map((t) => [t.id, t.property])).toEqual([
      ['path', 'emphasis'],
      ['now', 'emphasis'],
    ]);
  });

  it('staggers elements that move on their own, from the S1 tokens', () => {
    const delays = planMotion(CROWDED, 'a', 'b', 'full').map((t) => t.delay);
    expect(delays).toEqual([0, MOTION.staggerMs, 2 * MOTION.staggerMs, 2 * MOTION.staggerMs]);
  });

  it('summarises what moves, for review, with the reason the scene gives', () => {
    expect(movers(MCII_PATH, 'future', 'contrast')).toEqual([
      { id: 'wish', change: { kind: 'emphasis', from: 'focal', to: 'normal' }, with: [] },
      { id: 'wall', change: { kind: 'enter', effect: 'rise', why: expect.stringContaining('obstacle') }, with: ['wall-courses', 'label-obstacle'] },
    ]);
  });

  it('keeps every declared transition within the motion budget', () => {
    for (const { scene } of SCENES) expect(motionProblems(scene), scene.id).toEqual([]);
    expect(motionProblems(CROWDED)).toEqual([`transition a → b: 4 elements move; at most ${MOTION.maxStaggered}`]);
  });
});
