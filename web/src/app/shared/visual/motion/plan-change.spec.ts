import { BAR_SETS, barsFigure, setFigure } from '../../../pages/lab/lab-motion-figures';
import { composeScene, lookupOf } from '../composition/compose';
import { SceneElement } from '../composition/scene';
import { validateScene } from '../composition/validate';
import { composeCauseMap } from '../instruments/cause-map/cause-map';
import { buildChangeTimeline } from '../integration/pipeline';
import { MOTION, MOVE_CHANGE } from '../styling/vocabulary';
import { changeMovers, planChange } from './plan-motion';

const AXES = { left: 'a', right: 'b', top: 'c', bottom: 'd' };

describe('S5 changes in figures built from data (M5)', () => {
  const bars = (i: number) => barsFigure(BAR_SETS[i]).scene;

  it('glides what moves and changed, together, with the labels that name it', () => {
    // From [2, 4, 3] to [5, 1, 3]: bars 1 and 2 change; bar 3 and the bars' names stay.
    expect(changeMovers(bars(0), bars(1))).toEqual([
      { id: 'bar-1', change: { kind: 'moves', why: ['Its height is its value: it glides, so a person can follow the change.'] }, with: ['bar-2', 'value-1', 'value-2'] },
    ]);
    const timeline = planChange(bars(0), bars(1), 'full');
    expect(timeline.map((t) => [t.id, t.property, t.delay])).toEqual([
      ['bar-1', 'move', 0],
      ['bar-2', 'move', 0],
      ['value-1', 'move', 0],
      ['value-2', 'move', 0],
    ]);
    expect(timeline[0].duration).toBe(MOTION.durations[MOVE_CHANGE.duration]);
  });

  it('enters what is new, with its effect, beside the reflow', () => {
    const movers = changeMovers(setFigure(4).scene, setFigure(5).scene);
    expect(movers.map((m) => [m.id, m.change.kind, m.with.length])).toEqual([
      ['outline', 'moves', 3],
      ['member-5', 'enter', 0],
    ]);
    const timeline = planChange(setFigure(4).scene, setFigure(5).scene, 'full');
    expect(timeline.filter((t) => t.id === 'member-5')).toMatchObject([{ property: 'opacity', from: 0, to: 1 }]);
    // Removing one: it goes at once, the others make the room smaller.
    expect(changeMovers(setFigure(5).scene, setFigure(4).scene).map((m) => m.change.kind)).toEqual(['moves']);
  });

  it('moves nothing below the full tier, on a first appearance, or between different figures', () => {
    expect(planChange(bars(0), bars(1), 'reduced')).toEqual([]);
    expect(planChange(null, bars(1), 'full')).toEqual([]);
    expect(planChange(setFigure(4).scene, bars(1), 'full')).toEqual([]);
    expect(planChange(bars(0), bars(0), 'full')).toEqual([]);
  });

  it('changes a reflow of more than twelve forms at once', () => {
    const P = { serves: ['understanding'], why: 'Test.' } as const;
    const dots = (n: number, shift: number) =>
      composeScene({
        id: 'test.reflow',
        version: 1,
        theme: 'action',
        size: { width: 480, height: 100 },
        layers: [
          {
            id: 'l',
            plane: 'subject',
            elements: Array.from({ length: n }, (_, i): SceneElement => ({
              kind: 'shape',
              id: `d${i}`,
              geometry: { type: 'circle', cx: 20 + i * 30 + shift, cy: 50, r: 5 },
              style: { role: 'subject', material: 'solid' },
              purpose: P,
              moves: { why: 'Test.' },
            })),
          },
        ],
        alt: 'Test.',
      }).scene;
    expect(planChange(dots(MOTION.maxReflow, 0), dots(MOTION.maxReflow, 5), 'full')).toHaveLength(MOTION.maxReflow);
    expect(planChange(dots(MOTION.maxReflow + 1, 0), dots(MOTION.maxReflow + 1, 5), 'full')).toEqual([]);
  });

  it('leaves the instruments as they are: they declare no motion', () => {
    const before = composeCauseMap({ causes: [{ who: 1, time: 1 }], placing: 1, axes: AXES }).scene;
    const after = composeCauseMap({ causes: [{ who: 1, time: 1 }, { who: 3, time: 2 }], placing: 2, axes: AXES }).scene;
    expect(planChange(before, after, 'full')).toEqual([]);
  });

  it('are valid for every data set, with labels clear of what they don’t name', () => {
    for (const composed of [...BAR_SETS.map((v) => barsFigure(v)), ...[3, 4, 5, 6, 7, 8].map((n) => setFigure(n))])
      expect(validateScene(composed.scene, lookupOf(composed)), composed.text['alt']).toEqual([]);
  });
});

describe('the pipeline resolves a change for a backend (M5)', () => {
  const [a, b] = [barsFigure(BAR_SETS[0]), barsFigure(BAR_SETS[1])];

  it('gives each moving shape its drawings before and after, and each moving label its offset', () => {
    const timeline = buildChangeTimeline(a.scene, b.scene, 'shown', lookupOf(b), 'full');
    const bar = timeline.find((t) => t.id === 'bar-1');
    expect(bar).toMatchObject({
      property: 'shape',
      from: { type: 'rect', y: 114, height: 56 },
      to: { type: 'rect', y: 30, height: 140 },
      morph: true,
    });
    // The number was 84 units lower: it starts there and eases into its place.
    expect(timeline.find((t) => t.id === 'value-1')).toMatchObject({ property: 'translate', from: [0, 84], to: [0, 0] });
    expect(timeline.some((t) => t.property === 'paint')).toBe(false);
  });

  it('crossfades a path whose commands changed', () => {
    const timeline = buildChangeTimeline(setFigure(4).scene, setFigure(5).scene, 'shown', () => undefined, 'full');
    expect(timeline.find((t) => t.id === 'outline')).toMatchObject({ property: 'shape', morph: false });
    expect(timeline.find((t) => t.id === 'member-2')).toMatchObject({ property: 'shape', morph: true });
  });
});
