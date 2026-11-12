import { BAR_SETS, ROUTE_STOPS, SET_SIZES, barsFigure, routeFigure, setFigure } from '../../../pages/lab/lab-motion-figures';
import { composeScene, lookupOf } from '../composition/compose';
import { SceneElement } from '../composition/scene';
import { validateScene } from '../composition/validate';
import { composeCauseMap } from '../instruments/cause-map/cause-map';
import { buildChangeTimeline } from '../integration/pipeline';
import { INPUT_CHANGE, MOTION, MOVE_CHANGE } from '../styling/vocabulary';
import { changeMovers, changeProblems, planChange } from './plan-motion';

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
    // Removing one: it fades where it was, as the others close up.
    expect(changeMovers(setFigure(5).scene, setFigure(4).scene).map((m) => [m.id, m.change.kind])).toEqual([
      ['outline', 'moves'],
      ['member-5', 'exit'],
    ]);
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
    for (const composed of [...BAR_SETS.map((v) => barsFigure(v)), ...[3, 4, 5, 6, 7, 8].map((n) => setFigure(n)), ...[2, 3, 4, 5, 6].map((n) => routeFigure(n))])
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

  it('takes a leg back and fades its stop with it, and draws a new one', () => {
    expect(changeMovers(routeFigure(4).scene, routeFigure(3).scene)).toEqual([
      { id: 'leg-3', change: { kind: 'exit', effect: 'undraw', why: 'A leg that goes is taken back to the stop it came from.' }, with: ['stop-3'] },
    ]);
    expect(planChange(routeFigure(4).scene, routeFigure(3).scene, 'full').map((t) => [t.id, t.property, t.property === 'exit' && t.effect])).toEqual([
      ['leg-3', 'exit', 'undraw'],
      ['stop-3', 'exit', 'fade'],
    ]);
    expect(planChange(routeFigure(3).scene, routeFigure(4).scene, 'full').map((t) => [t.id, t.property])).toEqual([
      ['leg-3', 'reveal'],
      ['stop-3', 'opacity'],
    ]);
  });

  it('glides quickly after a person’s own input', () => {
    const timeline = planChange(barsFigure(BAR_SETS[0]).scene, barsFigure(BAR_SETS[1]).scene, 'full', INPUT_CHANGE);
    expect(timeline.every((t) => t.duration === MOTION.durations.quick)).toBe(true);
  });
});

describe('the pipeline resolves departures (M5)', () => {
  it('gives a departing element as it was drawn, and the item it sat under', () => {
    const timeline = buildChangeTimeline(routeFigure(4).scene, routeFigure(3).scene, 'shown', () => undefined, 'full');
    expect(timeline.map((t) => [t.id, t.property])).toEqual([
      ['leg-3', 'exit'],
      ['stop-3', 'exit'],
    ]);
    // The legs are drawn first: the leg that goes sat under the first stop; the last stop on top.
    expect(timeline[0]).toMatchObject({ effect: 'undraw', under: 'stop-0', item: { kind: 'shape', shape: { type: 'line', x1: 206, x2: 274 } } });
    expect(timeline[1]).toMatchObject({ effect: 'fade', under: null, item: { kind: 'shape', shape: { type: 'circle', cx: 274 } } });
  });
});

describe('the motion budget for changes in figures built from data (M5)', () => {
  it('holds for every change the Lab references can make', () => {
    const changes: [ReturnType<typeof barsFigure>, ReturnType<typeof barsFigure>][] = [];
    for (let i = 0; i < BAR_SETS.length; i++) changes.push([barsFigure(BAR_SETS[i]), barsFigure(BAR_SETS[(i + 1) % BAR_SETS.length])]);
    for (let n = SET_SIZES.min; n < SET_SIZES.max; n++) changes.push([setFigure(n), setFigure(n + 1)], [setFigure(n + 1), setFigure(n)]);
    for (let n = ROUTE_STOPS.min; n < ROUTE_STOPS.max; n++) changes.push([routeFigure(n), routeFigure(n + 1)], [routeFigure(n + 1), routeFigure(n)]);
    for (const [a, b] of changes) expect(changeProblems(a.scene, b.scene), `${a.text['alt']} → ${b.text['alt']}`).toEqual([]);
  });

  it('reports too many movements, and a reflow too large to glide', () => {
    const P = { serves: ['understanding'], why: 'Test.' } as const;
    const figure = (n: number, shift: number, entering: number) =>
      composeScene({
        id: 'test.budget',
        version: 1,
        theme: 'action',
        size: { width: 480, height: 100 },
        layers: [
          {
            id: 'l',
            plane: 'subject',
            elements: Array.from({ length: n + entering }, (_, i): SceneElement => ({
              kind: 'shape',
              id: `d${i}`,
              geometry: { type: 'circle', cx: 10 + i * 25 + (i < n ? shift : 0), cy: 50, r: 4 },
              style: { role: 'subject', material: 'solid' },
              purpose: P,
              moves: { why: 'Test.' },
              enter: { effect: 'fade', why: 'Test.' },
            })),
          },
        ],
        alt: 'Test.',
      }).scene;
    expect(changeProblems(figure(13, 0, 0), figure(13, 5, 0))).toEqual([`a reflow of 13 forms changes at once; more than ${MOTION.maxReflow} don't glide`]);
    expect(changeProblems(figure(2, 0, 0), figure(2, 5, 3))).toEqual([`4 movements in one change; at most ${MOTION.maxStaggered}`]);
  });
});

