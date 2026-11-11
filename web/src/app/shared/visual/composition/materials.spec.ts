import { lens, pathBounds } from '../generation/curves';
import { generate } from '../generation/registry';
import { buildFrame } from '../integration/pipeline';
import { resolveStyle } from '../styling/resolve';
import { GRAIN, LIGHT } from '../styling/vocabulary';
import { SceneDefinition, SceneElement, TextLookup } from './scene';
import { validateScene } from './validate';

/** Milestone M3, stage A: the platform light, materials, the lens and the material rules. */
const P = { serves: ['understanding' as const], why: 'Test element.' };
const TEXT: TextLookup = (key) => (key === 'alt' ? 'A test.' : undefined);

function scene(elements: SceneElement[]): SceneDefinition {
  return {
    id: 'test.materials',
    version: 1,
    theme: 'action',
    frame: { width: 400, height: 200 },
    layers: [{ id: 'forms', plane: 'subject', elements }],
    states: { initial: 'a', states: { a: { visible: elements.map((e) => e.id) } } },
    alt: { a: 'alt' },
  };
}
const object: SceneElement = { kind: 'shape', id: 'object', geometry: { type: 'circle', cx: 100, cy: 80, r: 40 }, style: { role: 'subject', material: 'lit' }, purpose: P };
const shadow: SceneElement = { kind: 'shape', id: 'shadow', geometry: { type: 'ellipse', cx: 100, cy: 124, rx: 36, ry: 5 }, style: { role: 'ink', material: 'shadow' }, purpose: P, grounds: 'object' };
const left: SceneElement = { kind: 'shape', id: 'left', geometry: { type: 'circle', cx: 220, cy: 100, r: 60 }, style: { role: 'subject', material: 'translucent' }, purpose: P };
const right: SceneElement = { kind: 'shape', id: 'right', geometry: { type: 'circle', cx: 300, cy: 100, r: 60 }, style: { role: 'subject', material: 'translucent' }, purpose: P };
const both: SceneElement = {
  kind: 'generated',
  id: 'both',
  generator: 'curve.lens',
  params: { x1: 220, y1: 100, r1: 60, x2: 300, y2: 100, r2: 60 },
  style: { role: 'subject', material: 'overlap' },
  purpose: P,
  overlapOf: ['left', 'right'],
};

describe('M3 stage A: light and materials', () => {
  describe('resolving materials', () => {
    it('shades lit along the platform light: lit upper left, base in the middle, shaded lower right', () => {
      expect(LIGHT).toEqual({ azimuth: 315, elevation: 45 });
      const paint = resolveStyle({ role: 'subject', material: 'lit' });
      expect(paint).toMatchObject({ fill: 'var(--vis-subject-fill)', stroke: 'var(--vis-subject)' });
      expect(paint.gradient).toEqual({
        type: 'linear',
        from: [0, 0],
        to: [1, 1],
        stops: [
          { offset: 0, colour: 'var(--vis-subject-lit)' },
          { offset: 0.5, colour: 'var(--vis-subject-fill)' },
          { offset: 1, colour: 'var(--vis-subject-shade)' },
        ],
      });
    });

    it('keeps emphasis on lit forms: focal heavier, receded flat and neutral', () => {
      expect(resolveStyle({ role: 'subject', material: 'lit' }, 'focal')).toMatchObject({ width: 3, stroke: 'var(--vis-focal, var(--vis-subject))' });
      const receded = resolveStyle({ role: 'subject', material: 'lit' }, 'receded');
      expect(receded.gradient).toBeUndefined();
      expect(receded.fill).toBe('var(--vis-receded-fill)');
    });

    it('draws a shadow as a soft radial fade with no line, and translucent and overlap fills with their line', () => {
      expect(resolveStyle({ role: 'ink', material: 'shadow' })).toEqual({
        fill: 'none',
        stroke: 'none',
        width: 0,
        dash: null,
        gradient: {
          type: 'radial',
          stops: [
            { offset: 0, colour: 'var(--vis-shadow)' },
            { offset: 0.5, colour: 'var(--vis-shadow)' },
            { offset: 1, colour: 'var(--vis-shadow-edge)' },
          ],
        },
      });
      expect(resolveStyle({ role: 'subject', material: 'translucent' })).toMatchObject({ fill: 'var(--vis-translucent)', stroke: 'var(--vis-subject)' });
      expect(resolveStyle({ role: 'subject', material: 'overlap' })).toMatchObject({ fill: 'var(--vis-overlap)' });
    });
  });

  describe('the lens', () => {
    it('lies inside both circles', () => {
      const d = lens([100, 100], 60, [160, 100], 50);
      const box = pathBounds(d)!;
      // The lens spans from the second circle's left edge to the first circle's right edge.
      expect(box.x).toBeGreaterThanOrEqual(110 - 50 - 1e-6);
      expect(box.x + box.width).toBeLessThanOrEqual(160 + 60 + 1e-6);
      expect(d.startsWith('M')).toBe(true);
      expect(d.endsWith('Z')).toBe(true);
    });

    it('is empty when the circles are apart, and the smaller circle when one holds the other', () => {
      expect(lens([0, 0], 10, [100, 0], 10)).toBe('');
      expect(lens([0, 0], 50, [5, 0], 10)).toBe(lens([5, 0], 10, [5, 0], 10));
    });
  });

  it('measures path bounds, with curve control points and arc radii, never smaller than the form', () => {
    expect(pathBounds('M0 0L10 20')).toEqual({ x: 0, y: 0, width: 10, height: 20 });
    expect(pathBounds('M0 0C5 -10 15 -10 20 0')).toEqual({ x: 0, y: -10, width: 20, height: 10 });
    expect(pathBounds('M0 0H30V5Z')).toEqual({ x: 0, y: 0, width: 30, height: 5 });
    const arc = pathBounds('M0 10A10 10 0 0 1 20 10')!;
    expect(arc.y).toBeLessThanOrEqual(0);
  });

  describe('the material rules', () => {
    it('accepts a lit object with its shadow, and two translucent forms with their overlap', () => {
      expect(validateScene(scene([shadow, object, left, right, both]), TEXT)).toEqual([]);
    });

    it('keeps lit for the subject, and every filling material off open lines', () => {
      const plane: SceneElement = { ...object, id: 'plane', style: { role: 'near', material: 'lit' } } as SceneElement;
      expect(validateScene(scene([plane]), TEXT)).toContain("element 'plane': 'lit' is for the subject; a plane or context stays flat");
      const line: SceneElement = { kind: 'shape', id: 'line', geometry: { type: 'line', x1: 0, y1: 0, x2: 10, y2: 0 }, style: { role: 'subject', material: 'lit' }, purpose: P };
      expect(validateScene(scene([line]), TEXT)).toContain("element 'line': 'lit' fills a form; this is an open line");
    });

    it('requires a shadow to be an ellipse that names its object and is drawn first', () => {
      const lost = { ...shadow, grounds: undefined } as SceneElement;
      expect(validateScene(scene([lost, object]), TEXT)).toContain("element 'shadow': a shadow names the object it sits under ('grounds')");
      expect(validateScene(scene([object, shadow]), TEXT)).toContain("element 'shadow': a shadow is drawn before its object");
      const square = { ...shadow, geometry: { type: 'rect', x: 60, y: 120, width: 80, height: 8 } } as SceneElement;
      expect(validateScene(scene([square, object]), TEXT)).toContain("element 'shadow': a shadow is an ellipse under its object");
    });

    it('never leaves two translucent forms to blend: their overlap is its own shape, drawn after them', () => {
      expect(validateScene(scene([left, right]), TEXT)).toContain("'left' and 'right' overlap: draw the overlap as its own shape ('overlap')");
      expect(validateScene(scene([both, left, right]), TEXT)).toContain("element 'both': an overlap is drawn after its forms");
      const stray = { ...both, overlapOf: ['left', 'object'] } as SceneElement;
      expect(validateScene(scene([object, left, right, stray]), TEXT)).toContain("element 'both': 'object' isn't a translucent form");
    });
  });

  it('gives each gradient its shape’s box in the frame, for backends that need it', () => {
    const frame = buildFrame(scene([shadow, object]), 'a', TEXT);
    const item = (id: string) => frame.items.find((i) => i.id === id);
    expect(item('object')).toMatchObject({ paint: { gradient: { box: { x: 60, y: 40, width: 80, height: 80 } } } });
    expect(item('shadow')).toMatchObject({ paint: { gradient: { type: 'radial', box: { x: 64, y: 119, width: 72, height: 10 } } } });
  });

  describe('stage B: planes by their top edge, and grain', () => {
    const band: SceneElement = {
      kind: 'generated',
      id: 'near',
      generator: 'form.band',
      params: { x0: -8, x1: 408, baseline: 140, floor: 208, amplitude: 10 },
      style: { role: 'near', material: 'tonal', edge: 'top' },
      purpose: P,
    };
    const planeScene = (elements: SceneElement[]): SceneDefinition => ({ ...scene(elements), seed: 's' });

    it('fills a plane without an outline and draws only its top line, in the plane edge colour', () => {
      const frame = buildFrame(planeScene([band]), 'a', TEXT);
      expect(frame.items.map((i) => i.id)).toEqual(['near', 'near-edge']);
      const [fill, edge] = frame.items;
      expect(fill).toMatchObject({ paint: { fill: 'var(--vis-near)', stroke: 'none', width: 0 } });
      expect(edge).toMatchObject({ paint: { fill: 'none', stroke: 'var(--vis-near-edge)' } });
      // The edge is the band's own top line: the fill is that line closed down to the floor.
      const top = edge.kind === 'shape' && edge.shape.type === 'path' ? edge.shape.d : '';
      expect(generate('form.band', band.kind === 'generated' ? band.params : {}, 's/near').startsWith(top)).toBe(true);
    });

    it('draws a rect plane’s top side as its edge', () => {
      const rect: SceneElement = { kind: 'shape', id: 'mid', geometry: { type: 'rect', x: 0, y: 90, width: 400, height: 110 }, style: { role: 'mid', material: 'tonal', edge: 'top' }, purpose: P };
      const frame = buildFrame(scene([rect]), 'a', TEXT);
      expect(frame.items[1]).toMatchObject({ id: 'mid-edge', shape: { type: 'line', x1: 0, y1: 90, x2: 400, y2: 90 } });
    });

    it('adds grain at most 6% opaque, with the platform’s one tile, only where asked', () => {
      expect(GRAIN.opacity).toBeLessThanOrEqual(0.06);
      const grained: SceneElement = { ...band, style: { role: 'near', material: 'tonal', grain: true } } as SceneElement;
      const frame = buildFrame(planeScene([grained]), 'a', TEXT);
      expect(frame.items[0]).toMatchObject({ paint: { grain: GRAIN.opacity } });
      expect(frame.grain?.tile).toBe(GRAIN.tile);
      expect(frame.grain?.d.length).toBeGreaterThan(200);
      expect(buildFrame(planeScene([grained]), 'a', TEXT).grain).toEqual(frame.grain);
      expect(buildFrame(planeScene([band]), 'a', TEXT).grain).toBeUndefined();
    });

    it('keeps the top edge for tonal planes, and grain for the ground and planes', () => {
      expect(validateScene(planeScene([band]), TEXT)).toEqual([]);
      const subject = { ...object, style: { role: 'subject', material: 'lit', grain: true } } as SceneElement;
      expect(validateScene(scene([subject]), TEXT)).toContain("element 'object': grain is for the ground and planes, never the subject");
      const edged = { ...object, style: { role: 'subject', material: 'lit', edge: 'top' } } as SceneElement;
      expect(validateScene(scene([edged]), TEXT)).toContain("element 'object': only a tonal plane (far, mid, near) is drawn by its top edge");
      const round = { ...object, id: 'hill', style: { role: 'near', material: 'tonal', edge: 'top' } } as SceneElement;
      expect(validateScene(scene([round]), TEXT)).toContain("element 'hill': this form has no top edge to draw (a rect or a generated plane has)");
    });
  });
});

