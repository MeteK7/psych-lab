import { MCII } from '../../../../content';
import { choiceFigure, ratingFigure } from '../../../pages/lab/lab-interaction-figures';
import { SHOWN, lookupOf } from '../composition/compose';
import { SceneDefinition, SceneElement } from '../composition/scene';
import { validateScene } from '../composition/validate';
import { MCII_PATH } from '../scenes/action/mcii-path.scene';
import { buildFrame, buildTimeline, contentText } from './pipeline';

const text = contentText({ mcii: MCII });

describe('buildFrame', () => {
  it('is deterministic: the same scene and state give the same frame', () => {
    expect(buildFrame(MCII_PATH, 'plan', text)).toEqual(buildFrame(MCII_PATH, 'plan', text));
  });

  it('includes only the visible elements, in layer order', () => {
    const ids = buildFrame(MCII_PATH, 'future', text).items.map((i) => i.id);
    expect(ids).toEqual(['path', 'now', 'wish', 'wish-centre', 'label-now', 'label-wish']);
  });

  it('resolves label text from content', () => {
    const label = buildFrame(MCII_PATH, 'plan', text).items.find((i) => i.id === 'label-plan');
    expect(label).toMatchObject({ kind: 'text', text: MCII.scene_labels.plan });
  });

  it('applies emphasis through paint: focal is heavier, receded is lighter', () => {
    const item = (state: string, id: string) => buildFrame(MCII_PATH, state, text).items.find((i) => i.id === id);
    expect(item('future', 'wish')).toMatchObject({ paint: { width: 3 } });
    expect(item('contrast', 'wish')).toMatchObject({ paint: { width: 2.5, stroke: 'var(--vis-subject)' } });
    expect(item('aside', 'path')).toMatchObject({ paint: { width: 1.5, stroke: 'var(--vis-context)' } });
  });

  it('resolves emphasis tracks into paint, so a backend never sees an emphasis level', () => {
    const wish = buildTimeline(MCII_PATH, 'future', 'contrast', 'full').find((t) => t.id === 'wish');
    expect(wish).toMatchObject({ property: 'paint', from: { width: 3 }, to: { width: 2.5, stroke: 'var(--vis-subject)' } });
    const rise = buildTimeline(MCII_PATH, 'future', 'contrast', 'full').filter((t) => t.id === 'wall');
    expect(rise.map((t) => t.property).sort()).toEqual(['offsetY', 'opacity']);
    expect(buildTimeline(MCII_PATH, 'future', 'contrast', 'reduced')).toEqual([]);
  });

  it('takes the frame size from the frame ratio', () => {
    expect(buildFrame(MCII_PATH, 'future', text)).toMatchObject({ width: 480, height: 120, theme: 'action' });
  });
});

describe('contentText', () => {
  it('finds nested strings and nothing else', () => {
    expect(text('mcii.scenes.future.alt')).toBe(MCII.scenes.future.alt);
    expect(text('mcii.scenes')).toBeUndefined();
    expect(text('mcii.nope.alt')).toBeUndefined();
    expect(text('constructor')).toBeUndefined();
  });
});

describe('generated elements (S2, milestone M2)', () => {
  const purpose = { serves: ['identity' as const], why: 'A test form.' };
  type Generated = Extract<SceneElement, { kind: 'generated' }>;
  const scene = (seed?: string, blob: Partial<Generated> = {}, line: Partial<Generated> = {}): SceneDefinition => ({
    id: 'test.generated',
    version: 1,
    theme: 'action',
    ...(seed ? { seed } : {}),
    frame: { width: 300, height: 200 },
    layers: [
      {
        id: 'forms',
        plane: 'subject',
        elements: [
          { kind: 'generated', id: 'blob', generator: 'form.blob', params: { cx: 150, cy: 100, rx: 60, ry: 40 }, style: { role: 'subject', material: 'tonal' }, purpose, ...blob },
          {
            kind: 'generated',
            id: 'line',
            generator: 'form.ridge',
            params: { x0: 0, x1: 300, baseline: 170 },
            style: { role: 'context' },
            purpose,
            enter: { effect: 'draw', why: 'A test of drawing a generated line.' },
            ...line,
          },
        ],
      },
    ],
    states: { initial: 'a', states: { a: { visible: ['blob'] }, b: { visible: ['blob', 'line'], emphasis: { blob: 'focal' } } } },
    alt: { a: 'alt', b: 'alt' },
    transitions: [['a', 'b']],
  });
  const lookup = (key: string) => (key === 'alt' ? 'A test.' : undefined);

  it('is valid with a seed, and the validator says when the seed or a parameter is missing', () => {
    expect(validateScene(scene('s1'), lookup)).toEqual([]);
    expect(validateScene(scene(), lookup)).toContain("element 'blob': 'form.blob' needs the scene's seed");
    expect(validateScene(scene('s1', { params: { cx: 150, cy: 100, rx: 60 } }), lookup)).toContain("element 'blob': 'form.blob' needs 'ry'");
  });

  it('refuses to fill an open line', () => {
    const filled = scene('s1', {}, { style: { role: 'context', material: 'tonal' }, enter: undefined });
    expect(validateScene(filled, lookup)).toContain("element 'line': 'form.ridge' makes an open line, which can't be filled");
  });

  it('draws them as paths, the same for the same seed, and different for another seed', () => {
    const frame = buildFrame(scene('s1'), 'b', lookup);
    const blob = frame.items.find((i) => i.id === 'blob');
    expect(blob?.kind === 'shape' && blob.shape.type).toBe('path');
    expect(buildFrame(scene('s1'), 'b', lookup)).toEqual(frame);
    const other = buildFrame(scene('s2'), 'b', lookup).items.find((i) => i.id === 'blob');
    expect(other).not.toEqual(blob);
  });

  it('takes emphasis and draws on like any line', () => {
    const blob = buildFrame(scene('s1'), 'b', lookup).items.find((i) => i.id === 'blob');
    expect(blob).toMatchObject({ paint: { stroke: 'var(--vis-focal, var(--vis-subject))' } });
    const tracks = buildTimeline(scene('s1'), 'a', 'b', 'full');
    expect(tracks.find((t) => t.id === 'line')).toMatchObject({ property: 'reveal', from: 0, to: 1 });
    expect(tracks.find((t) => t.id === 'blob')).toMatchObject({ property: 'paint' });
  });
});

describe('buildFrame: type in figures (M3 stage C)', () => {
  const P = { serves: ['understanding'], why: 'Test label.' } as const;
  const words = 'A label can wrap within a set width, at spaces.';
  const scene = (extra: Partial<Extract<SceneElement, { kind: 'label' }>>): SceneDefinition => ({
    id: 'test.type',
    version: 1,
    theme: 'action',
    frame: 'wide',
    layers: [{ id: 'l', plane: 'annotation', elements: [{ kind: 'label', id: 'x', text: 'x', at: [20, 40], align: 'start', purpose: P, ...extra }] }],
    states: { initial: 'a', states: { a: { visible: ['x'] } } },
    alt: { a: 'alt' },
  });
  const lookup = (key: string) => (key === 'x' ? words : 'A test.');
  const item = (extra: Partial<Extract<SceneElement, { kind: 'label' }>>) => buildFrame(scene(extra), 'a', lookup).items[0];

  it('breaks a label with a width into lines 1.2 apart, keeping the whole text', () => {
    const text = item({ width: 120 });
    expect(text).toMatchObject({ kind: 'text', text: words, lineHeight: 14 * 1.2 });
    const lines = text.kind === 'text' ? text.lines! : [];
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe(words);
  });

  it('keeps a label without a width as one line, without a halo', () => {
    const text = item({});
    expect(text).not.toHaveProperty('lines');
    expect(text).not.toHaveProperty('halo');
  });

  it('gives a label with a halo the ground colour behind its glyphs', () => {
    expect(item({ halo: true })).toMatchObject({ halo: { colour: 'var(--vis-ground)', width: 4 } });
  });
});

describe('buildFrame with live input (M4 stage B)', () => {
  // A composed interactive figure: the Lab's rating reference has a handle and its track.
  const composed = ratingFigure(3);
  const lookup = lookupOf(composed);

  it('gives the handle being moved focal emphasis, without changing the scene', () => {
    const still = buildFrame(composed.scene, SHOWN, lookup).items.find((i) => i.id === 'mark');
    const moving = buildFrame(composed.scene, SHOWN, lookup, { emphasis: { mark: 'focal' } }).items.find((i) => i.id === 'mark');
    expect(still?.kind === 'shape' && still.paint.width).toBe(2.5);
    expect(moving?.kind === 'shape' && moving.paint).toMatchObject({ width: 3, stroke: 'var(--vis-focal, var(--vis-subject))' });
  });

  it('draws the focus ring last, around the focused handle, clear of its line', () => {
    const items = buildFrame(composed.scene, SHOWN, lookup, { focus: 'mark' }).items;
    const ring = items[items.length - 1];
    // Radius 11, half the 2.5 line, the 3-unit gap and half the ring's own 2-unit line.
    expect(ring).toMatchObject({ id: 'mark-focus', kind: 'shape', shape: { type: 'circle', cx: 240, cy: 44, r: 16.25 }, paint: { stroke: 'var(--vis-focus)', width: 2 } });
    expect(buildFrame(composed.scene, SHOWN, lookup, { focus: null }).items.some((i) => i.id === 'mark-focus')).toBe(false);
  });

  it('rounds the ring like a rounded box it surrounds', () => {
    const choice = choiceFigure('second');
    const items = buildFrame(choice.scene, SHOWN, lookupOf(choice), { focus: 'first' }).items;
    // 'first' isn't chosen: its context line is 2 wide: 1 + 3 + 1 = 5 units out, corners 16 + 5.
    expect(items[items.length - 1]).toMatchObject({ shape: { type: 'rect', x: 25, y: 19, width: 130, height: 82, rx: 21 } });
  });
});
