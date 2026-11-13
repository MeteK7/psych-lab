import { lookupOf } from '../../composition/compose';
import { validateScene } from '../../composition/validate';
import { buildComposedFrame } from '../../integration/pipeline';
import { ROUNDS, ROUNDS_SIZE, RoundsInput, composeRounds } from './rounds';

const roundsFrame = (input: RoundsInput) => buildComposedFrame(composeRounds(input));

const marks = (current: number) => roundsFrame({ total: 8, current }).items;

describe('state-reset.rounds (policy)', () => {
  it('draws one mark per round, inside the figure, in round order', () => {
    for (const current of [1, 4, 8]) {
      const items = marks(current);
      expect(items.map((i) => i.id)).toEqual(Array.from({ length: 8 }, (_, i) => `round-${i + 1}`));
      for (const item of items) {
        if (item.kind !== 'shape' || item.shape.type !== 'rect') throw new Error('marks are rects');
        expect(item.shape.x).toBeGreaterThanOrEqual(0);
        expect(item.shape.x + item.shape.width).toBeLessThanOrEqual(ROUNDS_SIZE.width);
      }
    }
  });

  it('tells done, current and coming rounds apart by shape and weight, not colour alone', () => {
    const [done, now, next] = [marks(4)[0], marks(4)[3], marks(4)[7]].map((i) => (i.kind === 'shape' ? i.paint : null)!);
    expect(done.fill).not.toBe('none'); // filled
    expect(done.width).toBe(0);
    expect(now.fill).toBe('none'); // outlined
    expect(next.fill).toBe('none');
    expect(now.width).toBeGreaterThan(next.width); // heavier
    expect(now.stroke).toContain('--vis-focal'); // the system highlight in high contrast
  });

  it('marks nothing as done before the first round, and the last as current at the end', () => {
    expect(marks(1).filter((i) => i.kind === 'shape' && i.paint.width === 0)).toHaveLength(0);
    const last = marks(8);
    expect(last.slice(0, 7).every((i) => i.kind === 'shape' && i.paint.width === 0)).toBe(true);
  });

  it('carries no text and uses token colours only, in the Action theme', () => {
    const frame = roundsFrame({ total: 8, current: 3 });
    expect(frame.theme).toBe(ROUNDS.theme);
    expect(frame.theme).toBe('action');
    for (const item of frame.items) {
      expect(item.kind).toBe('shape');
      if (item.kind === 'shape') {
        for (const value of [item.paint.fill, item.paint.stroke]) expect(value === 'none' || value.includes('var(--vis-')).toBe(true);
      }
    }
  });

  it('is a valid composition for every round', () => {
    for (let current = 1; current <= 8; current++) {
      const composed = composeRounds({ total: 8, current });
      expect(validateScene(composed.scene, lookupOf(composed))).toEqual([]);
    }
  });
});
