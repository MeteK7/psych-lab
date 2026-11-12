import type { FrameItem, ResolvedFrame, ResolvedTimeline } from './frame';
import { carryOn, sampleTimeline, timelineEnd } from './playback';
import { mixColours, parseColour } from './canvas/colour';

const paint = { fill: 'var(--vis-subject-fill)', stroke: 'var(--vis-subject)', width: 2, dash: null };
const shape = (id: string, cx: number): FrameItem => ({ kind: 'shape', id, layer: 'l', shape: { type: 'circle', cx, cy: 50, r: 10 }, paint });
const label: FrameItem = { kind: 'text', id: 'label', layer: 'l', text: 'A', x: 100, y: 20, anchor: 'middle', fill: 'var(--vis-label)', size: 14 };
const frame: ResolvedFrame = { width: 200, height: 100, theme: 'action', items: [shape('a', 50), shape('b', 150), label] };
const timing = (delay: number, duration: number) => ({ delay, duration, easing: 'linear' });

describe('the timeline at a moment (M6, shared by both backends)', () => {
  it('holds start values during a delay, eases them, and shows the frame once done', () => {
    const timeline: ResolvedTimeline = [
      { id: 'a', ...timing(100, 200), property: 'opacity', from: 0, to: 1 },
      { id: 'a', ...timing(100, 200), property: 'offsetY', from: 8, to: 0 },
      { id: 'label', ...timing(0, 200), property: 'translate', from: [0, 40], to: [0, 0] },
    ];
    const at = (ms: number) => sampleTimeline(frame, timeline, ms);
    expect(at(50)[0]).toMatchObject({ opacity: 0, offset: [0, 8] });
    expect(at(200)[0]).toMatchObject({ opacity: 0.5, offset: [0, 4] });
    expect(at(100)[2]).toMatchObject({ offset: [0, 20] });
    expect(at(400)).toEqual(frame.items.map((item) => ({ item, opacity: 1, offset: [0, 0], reveal: null, paint: null })));
    expect(timelineEnd(timeline)).toBe(300);
  });

  it('draws a fraction of a line, and paints between two paints while a paint track plays', () => {
    const to = { ...paint, width: 3 };
    const s = sampleTimeline(frame, [{ id: 'b', ...timing(0, 100), property: 'reveal', from: 0, to: 1 }, { id: 'a', ...timing(0, 100), property: 'paint', from: paint, to }], 25);
    expect(s[1].reveal).toBe(0.25);
    expect(s[0].paint).toEqual({ from: paint, to, f: 0.25 });
  });

  it('morphs a shape, or crossfades it with a copy of the old drawing just above it', () => {
    const from = { type: 'circle', cx: 50, cy: 50, r: 10 } as const;
    const morph = sampleTimeline(frame, [{ id: 'b', ...timing(0, 100), property: 'shape', from, to: { type: 'circle', cx: 150, cy: 50, r: 10 }, morph: true }], 50);
    expect(morph[1].item).toMatchObject({ shape: { cx: 100 } });
    const fade = sampleTimeline(frame, [{ id: 'a', ...timing(0, 100), property: 'shape', from: { type: 'line', x1: 0, y1: 0, x2: 10, y2: 10 }, to: frame.items[0].kind === 'shape' ? frame.items[0].shape : from, morph: false }], 25);
    expect(fade.map((s) => [s.item.id, s.opacity])).toEqual([
      ['a', 0.25],
      ['a', 0.75],
      ['b', 1],
      ['label', 1],
    ]);
    expect(fade[1].item).toMatchObject({ shape: { type: 'line' } });
  });

  it('draws a departing item just below the item it sat under, or on top, until it has left', () => {
    const gone = shape('gone', 100);
    const timeline: ResolvedTimeline = [
      { id: 'gone', ...timing(0, 100), property: 'exit', effect: 'fade', item: gone, under: 'b' },
      { id: 'top', ...timing(0, 100), property: 'exit', effect: 'undraw', item: { ...gone, id: 'top' }, under: null },
    ];
    const s = sampleTimeline(frame, timeline, 40);
    expect(s.map((x) => x.item.id)).toEqual(['a', 'gone', 'b', 'label', 'top']);
    expect(s[1].opacity).toBeCloseTo(0.6, 9);
    expect(s[4].reveal).toBeCloseTo(0.6, 9);
    expect(sampleTimeline(frame, timeline, 100).map((x) => x.item.id)).toEqual(['a', 'b', 'label']);
  });

  it('picks a glide up from where it has got to when a new change arrives', () => {
    const first: ResolvedTimeline = [
      { id: 'a', ...timing(0, 100), property: 'shape', from: { type: 'circle', cx: 0, cy: 50, r: 10 }, to: { type: 'circle', cx: 100, cy: 50, r: 10 }, morph: true },
      { id: 'label', ...timing(0, 100), property: 'translate', from: [0, 40], to: [0, 0] },
    ];
    const next: ResolvedTimeline = [
      { id: 'a', ...timing(0, 100), property: 'shape', from: { type: 'circle', cx: 100, cy: 50, r: 10 }, to: { type: 'circle', cx: 200, cy: 50, r: 10 }, morph: true },
      { id: 'label', ...timing(0, 100), property: 'translate', from: [0, 10], to: [0, 0] },
    ];
    const carried = carryOn({ timeline: first, start: 1000 }, next, 1050);
    expect(carried[0]).toMatchObject({ from: { cx: 50 } });
    // Halfway, 20 of the first move were still to go: they're added to the new one.
    expect(carried[1]).toMatchObject({ from: [0, 30] });
    expect(carryOn(null, next, 0)).toBe(next);
  });
});

describe('canvas colours (M6)', () => {
  it('reads the colours a browser resolves', () => {
    expect(parseColour('rgb(55, 102, 199)')).toEqual([55, 102, 199, 1]);
    expect(parseColour('rgba(0, 0, 0, 0.35)')).toEqual([0, 0, 0, 0.35]);
    expect(parseColour('color(srgb 0.5 0.25 1 / 0.4)')).toEqual([127.5, 63.75, 255, 0.4]);
    expect(parseColour('#2457c5')).toEqual([36, 87, 197, 1]);
    expect(parseColour('transparent')).toEqual([0, 0, 0, 0]);
    expect(() => parseColour('hsl(1 2% 3%)')).toThrow();
  });

  it('eases between two colours as the browser does: in sRGB, premultiplied', () => {
    expect(mixColours('rgb(0, 0, 0)', 'rgb(255, 255, 255)', 0.5)).toBe('rgba(127.5, 127.5, 127.5, 1)');
    // Towards transparent, the colour itself stays: only its alpha falls.
    expect(mixColours('rgb(200, 100, 0)', 'rgba(0, 0, 0, 0)', 0.5)).toBe('rgba(200, 100, 0, 0.5)');
  });
});
