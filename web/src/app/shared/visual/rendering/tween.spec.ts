import { Drawable } from './frame';
import { canMorph, parsePath, tweenShape } from './tween';

describe('shapes between two drawings (M5)', () => {
  it('reads path commands, with repeated parameters as their own commands', () => {
    expect(parsePath('M0 0 10 10 L20 0Z')).toEqual([
      { letter: 'M', numbers: [0, 0] },
      { letter: 'L', numbers: [10, 10] },
      { letter: 'L', numbers: [20, 0] },
      { letter: 'Z', numbers: [] },
    ]);
    expect(parsePath('M1.5.5h-2e1')).toEqual([
      { letter: 'M', numbers: [1.5, 0.5] },
      { letter: 'h', numbers: [-20] },
    ]);
    expect(parsePath('M0 0 L1')).toBeNull();
  });

  it('morphs drawings of one type, and paths with the same commands and arc flags', () => {
    const circle = (r: number): Drawable => ({ type: 'circle', cx: 0, cy: 0, r });
    expect(canMorph(circle(1), circle(5))).toBe(true);
    expect(canMorph(circle(1), { type: 'rect', x: 0, y: 0, width: 1, height: 1 })).toBe(false);
    expect(canMorph({ type: 'path', d: 'M0 0 L10 0' }, { type: 'path', d: 'M5 5 L20 5' })).toBe(true);
    expect(canMorph({ type: 'path', d: 'M0 0 L10 0' }, { type: 'path', d: 'M0 0 L10 0 L5 5' })).toBe(false);
    expect(canMorph({ type: 'path', d: 'M0 0 A5 5 0 0 1 10 0' }, { type: 'path', d: 'M0 0 A5 5 0 1 1 10 0' })).toBe(false);
  });

  it('gives the drawing part of the way, and the end drawing when it can’t morph', () => {
    expect(tweenShape({ type: 'circle', cx: 0, cy: 0, r: 2 }, { type: 'circle', cx: 10, cy: 20, r: 6 }, 0.5)).toEqual({ type: 'circle', cx: 5, cy: 10, r: 4 });
    expect(tweenShape({ type: 'rect', x: 0, y: 100, width: 10, height: 0 }, { type: 'rect', x: 0, y: 0, width: 10, height: 100, rx: 4 }, 0.25)).toEqual({
      type: 'rect', x: 0, y: 75, width: 10, height: 25, rx: 1,
    });
    expect(tweenShape({ type: 'path', d: 'M0 0 A5 5 0 0 1 10 0' }, { type: 'path', d: 'M10 0 A15 15 0 0 1 30 0' }, 0.5)).toEqual({
      type: 'path', d: 'M5 0 A10 10 0 0 1 20 0',
    });
    const to: Drawable = { type: 'line', x1: 0, y1: 0, x2: 1, y2: 1 };
    expect(tweenShape({ type: 'circle', cx: 0, cy: 0, r: 1 }, to, 0.5)).toBe(to);
    expect(tweenShape({ type: 'circle', cx: 0, cy: 0, r: 1 }, { type: 'circle', cx: 9, cy: 9, r: 9 }, 0)).toEqual({ type: 'circle', cx: 0, cy: 0, r: 1 });
  });
});
