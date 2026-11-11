import { Direction, TrackingScore, isOnTarget, moveCursor, targetAt } from './tracking';

const size = { width: 480, height: 320 };

describe('tracking', () => {
  it('keeps the target inside the play area', () => {
    for (let t = 0; t < 60; t += 0.137) {
      const p = targetAt(t, size, 1, 36);
      expect(p.x).toBeGreaterThanOrEqual(36);
      expect(p.x).toBeLessThanOrEqual(size.width - 36);
      expect(p.y).toBeGreaterThanOrEqual(36);
      expect(p.y).toBeLessThanOrEqual(size.height - 36);
    }
  });

  it('moves faster with a higher speed setting', () => {
    const step = (speed: number) => {
      const a = targetAt(1, size, speed, 36);
      const b = targetAt(1.05, size, speed, 36);
      return Math.hypot(b.x - a.x, b.y - a.y);
    };
    expect(step(1)).toBeGreaterThan(step(0.5));
  });

  it('counts the ring edge as on target', () => {
    expect(isOnTarget({ x: 10, y: 0 }, { x: 0, y: 0 }, 10)).toBe(true);
    expect(isOnTarget({ x: 10.1, y: 0 }, { x: 0, y: 0 }, 10)).toBe(false);
  });

  it('moves the keyboard cursor at the same speed diagonally and clamps it', () => {
    const held = new Set<Direction>(['ArrowRight', 'ArrowDown']);
    const moved = moveCursor({ x: 100, y: 100 }, held, 10, size);
    expect(Math.hypot(moved.x - 100, moved.y - 100)).toBeCloseTo(10);
    expect(moveCursor({ x: 2, y: 2 }, new Set<Direction>(['ArrowLeft', 'ArrowUp']), 50, size)).toEqual({ x: 0, y: 0 });
  });

  it('weights the score by frame time', () => {
    const score = new TrackingScore();
    score.add(30, true);
    score.add(10, false);
    score.add(0, true); // first frame has no duration
    expect(score.ratio).toBeCloseTo(0.75);
    expect(score.measuredMs).toBe(40);
  });

});
