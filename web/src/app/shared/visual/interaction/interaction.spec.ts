import { composeScene } from '../composition/compose';
import { ScaleDef, SceneDefinition, SceneElement, TextLookup } from '../composition/scene';
import { validateScene } from '../composition/validate';
import { hitTest, placeAt, targetsOf, toScenePoint } from './regions';
import { endsOf, positionOf, stepFrom, valueAt } from './scales';

const rating: ScaleDef = { kind: 'linear', domain: [1, 5], range: [60, 420], step: 1 };
const upwards: ScaleDef = { kind: 'linear', domain: [1, 5], range: [250, 30], step: 1 };
const fine: ScaleDef = { kind: 'linear', domain: [0, 1], range: [0, 100], step: 0.1 };
const points: ScaleDef = { kind: 'points', values: ['low', 'mid', 'high'], range: [0, 200] };

describe('S6 scales (M4)', () => {
  it('places a value along the axis, either way round', () => {
    expect([1, 3, 5].map((v) => positionOf(rating, v))).toEqual([60, 240, 420]);
    expect([1, 5].map((v) => positionOf(upwards, v))).toEqual([250, 30]);
    expect(positionOf(points, 'mid')).toBe(100);
    expect(positionOf(points, 'other')).toBeNull();
    expect(positionOf(rating, 'three')).toBeNull();
  });

  it('reads a position back as a value: snapped to the steps, held at the ends', () => {
    expect(valueAt(rating, 240)).toBe(3);
    expect(valueAt(rating, 280)).toBe(3);
    expect(valueAt(rating, 290)).toBe(4);
    expect(valueAt(rating, -50)).toBe(1);
    expect(valueAt(rating, 9999)).toBe(5);
    expect(valueAt(upwards, 30)).toBe(5);
    expect(valueAt(upwards, 260)).toBe(1);
    expect(valueAt(fine, 30.4)).toBe(0.3);
    expect(valueAt(points, 140)).toBe('mid');
    expect(valueAt(points, 160)).toBe('high');
    expect(valueAt({ kind: 'linear', domain: [0, 10], range: [0, 100] }, 37.5)).toBe(3.75);
  });

  it('gives back every value it places (a round trip)', () => {
    for (const v of [1, 2, 3, 4, 5]) expect(valueAt(rating, positionOf(rating, v)!)).toBe(v);
    for (const v of ['low', 'mid', 'high']) expect(valueAt(points, positionOf(points, v)!)).toBe(v);
  });

  it('steps for the keyboard, held at the ends, and knows its ends', () => {
    expect(stepFrom(rating, 3, 1)).toBe(4);
    expect(stepFrom(rating, 5, 1)).toBe(5);
    expect(stepFrom(rating, 2, -3)).toBe(1);
    expect(stepFrom(fine, 0.2, 1)).toBe(0.3);
    expect(stepFrom(points, 'low', 1)).toBe('mid');
    expect(stepFrom(points, 'high', 5)).toBe('high');
    expect(endsOf(rating)).toEqual([1, 5]);
    expect(endsOf({ kind: 'linear', domain: [0, 10], range: [0, 1], step: 3 })).toEqual([0, 9]);
    expect(endsOf(points)).toEqual(['low', 'high']);
  });
});

const P = { serves: ['interaction'], why: 'Test target.' } as const;
const TEXT: TextLookup = (key) => ({ alt: 'A test.', handle: 'Rating', a: 'A', b: 'B' })[key];

function figure(markX = 240, extra: SceneElement[] = []): SceneDefinition {
  return composeScene({
    id: 'test.interaction',
    version: 1,
    theme: 'action',
    size: { width: 480, height: 200 },
    scales: { rating },
    choices: { choice: { label: 'a' }, c: { label: 'b' } },
    layers: [
      {
        id: 'l',
        plane: 'subject',
        elements: [
          { kind: 'shape', id: 'track', geometry: { type: 'line', x1: 60, y1: 50, x2: 420, y2: 50 }, style: { role: 'context' }, purpose: P },
          {
            kind: 'shape',
            id: 'mark',
            geometry: { type: 'circle', cx: markX, cy: 50, r: 6 },
            style: { role: 'subject', material: 'tonal' },
            purpose: P,
            target: { kind: 'handle', x: { scale: 'rating', value: 'rating' }, track: 'track', label: 'handle' },
          },
          ...extra,
        ],
      },
    ],
    alt: 'A test.',
  }).scene;
}

const region = (id: string, x: number, label: string): SceneElement => ({
  kind: 'shape',
  id,
  geometry: { type: 'rect', x, y: 100, width: 100, height: 60, rx: 8 },
  style: { role: 'context' },
  purpose: P,
  target: { kind: 'region', value: 'choice', option: id, label },
});

describe('S6 targets and hit testing (M4)', () => {
  const scene = figure(240, [region('a', 60, 'a'), region('b', 180, 'b')]);
  const targets = targetsOf(scene, 'shown');

  it('lists the shown targets in drawing order, with the tracks of shown handles', () => {
    expect(targets.map((t) => `${t.hit.kind}:${t.hit.id}`)).toEqual(['track:track', 'handle:mark', 'region:a', 'region:b']);
  });

  it('finds the target under a point, the topmost first', () => {
    expect(hitTest(targets, [240, 50])?.kind).toBe('handle');
    // A small mark counts 24 × 24 units around its centre.
    expect(hitTest(targets, [251, 39])?.kind).toBe('handle');
    expect(hitTest(targets, [253, 50])?.kind).toBe('track');
    // A line is reached 12 units either side.
    expect(hitTest(targets, [100, 61])?.kind).toBe('track');
    expect(hitTest(targets, [100, 63])).toBeNull();
    // A region anywhere inside it, not outside its rounded corner.
    expect(hitTest(targets, [230, 130])).toMatchObject({ kind: 'region', id: 'b' });
    expect(hitTest(targets, [179, 99])).toBeNull();
    expect(hitTest(targets, [170, 130])).toBeNull();
  });

  it('turns a point into the values a handle takes there', () => {
    const handle = targets[1].hit;
    if (handle.kind !== 'handle') throw new Error('expected a handle');
    expect(placeAt(scene, handle.target, [330, 999])).toEqual({ rating: 4 });
    expect(placeAt(scene, handle.target, [0, 0])).toEqual({ rating: 1 });
  });

  it('maps a pointer on the page to scene units, at any drawn size', () => {
    const frame = { width: 480, height: 200 };
    expect(toScenePoint({ x: 340, y: 150 }, { left: 100, top: 50, width: 960, height: 400 }, frame)).toEqual([120, 50]);
    // Letterboxed: a box taller than the figure centres it, as an SVG viewBox does.
    expect(toScenePoint({ x: 240, y: 150 }, { left: 0, top: 0, width: 480, height: 300 }, frame)).toEqual([240, 100]);
  });
});

describe('the validator on interaction (M4)', () => {
  it('accepts a valid interactive figure', () => {
    expect(validateScene(figure(240, [region('a', 60, 'a'), region('b', 180, 'b')]), TEXT)).toEqual([]);
  });

  it('checks scales', () => {
    const bad = { ...figure(), scales: { rating, flat: { kind: 'linear', domain: [1, 1], range: [0, 0], step: 0 }, few: { kind: 'points', values: ['x', 'x'], range: [0, 10] } } } as SceneDefinition;
    const problems = validateScene(bad, TEXT);
    expect(problems).toEqual(
      expect.arrayContaining([
        "scale 'flat': its range has no length",
        "scale 'flat': its domain has no length",
        "scale 'flat': a step must be positive",
        "scale 'few': its values repeat",
      ]),
    );
  });

  it('checks that a target serves interaction, says what it is, and names what exists', () => {
    const odd: SceneElement = {
      kind: 'shape',
      id: 'odd',
      geometry: { type: 'line', x1: 0, y1: 190, x2: 100, y2: 190 },
      style: { role: 'context' },
      purpose: { serves: ['understanding'], why: 'Not for input.' },
      target: { kind: 'handle', y: { scale: 'nowhere', value: 'v' }, track: 'missing', label: 'unknown' },
    };
    const open: SceneElement = { ...odd, id: 'open', geometry: { type: 'line', x1: 200, y1: 190, x2: 300, y2: 190 }, purpose: P, target: { kind: 'region', value: 'c', option: 1, label: 'a' } };
    const problems = validateScene(figure(240, [odd, open]), TEXT);
    expect(problems).toEqual(
      expect.arrayContaining([
        "element 'odd': a target serves 'interaction'",
        "element 'odd': no content for 'unknown'",
        "element 'odd': unknown scale 'nowhere'",
        "element 'odd': unknown track 'missing'",
        "element 'open': a region is a closed form",
      ]),
    );
  });

  it('asks a handle on two scales to name each axis, in words it has', () => {
    const scales = { rating, upwards };
    const twoAxes = (x: object, y: object): SceneElement => ({
      kind: 'shape',
      id: 'two',
      geometry: { type: 'circle', cx: 400, cy: 150, r: 13 },
      style: { role: 'subject', material: 'tonal' },
      purpose: P,
      target: { kind: 'handle', x: { scale: 'rating', value: 'r', ...x }, y: { scale: 'upwards', value: 'u', ...y }, label: 'handle' },
    });
    const check = (el: SceneElement) => validateScene({ ...figure(100, [el]), scales }, TEXT).filter((p) => p.includes("'two'"));
    expect(check(twoAxes({}, { label: 'b' }))).toEqual(["element 'two': a handle on two scales names each axis ('label')"]);
    expect(check(twoAxes({ label: 'a' }, { label: 'nothing' }))).toEqual(["element 'two': no content for 'nothing'"]);
    expect(check(twoAxes({ label: 'a' }, { label: 'b' }))).toEqual([]);
  });

  it('keeps small targets 24 units clear of each other', () => {
    const near: SceneElement = {
      kind: 'shape',
      id: 'near',
      geometry: { type: 'circle', cx: 256, cy: 50, r: 4 },
      style: { role: 'subject', material: 'solid' },
      purpose: P,
      target: { kind: 'region', value: 'c', option: 1, label: 'a' },
    };
    expect(validateScene(figure(240, [near]), TEXT)).toContain("state 'shown': targets 'mark' and 'near' are too close; a small target keeps 24 × 24 units clear");
    expect(validateScene(figure(200, [near]), TEXT).filter((p) => p.includes('too close'))).toEqual([]);
  });
});
