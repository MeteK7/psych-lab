import { lookupOf } from '../../composition/compose';
import { validateScene } from '../../composition/validate';
import { buildComposedFrame } from '../../integration/pipeline';
import type { FrameItem } from '../../rendering/frame';
import { CAUSE_MAP, CauseMapInput, PLOT, composeCauseMap, groupByPlace, pointOf } from './cause-map';

/** The frame the pipeline draws from the composition (milestone M1: instruments are compositions). */
const causeMapFrame = (input: CauseMapInput) => buildComposedFrame(composeCauseMap(input));

/**
 * Policy for the CS2 cause map (docs/cs2-visual-proposal.md §5.3), as assertions on the frame it
 * builds. A change that breaks one of these needs the policy changed first.
 */
const AXES = { left: 'About me', right: 'About the situation', top: 'Lasting', bottom: 'Just this time' };
const at = (...places: [number, number][]) => places.map(([who, time]) => ({ who, time }));
const CASES: Record<string, CauseMapInput['causes']> = {
  spread: at([1, 2], [5, 5], [2, 5]),
  'all untouched': at([3, 3], [3, 3], [3, 3]),
  heavy: at([1, 1], [1, 1], [1, 1]),
  'six in one corner': at([1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1]),
  'six in the other corner': at([5, 5], [5, 5], [5, 5], [5, 5], [5, 5], [5, 5]),
  mixed: at([1, 1], [3, 3], [1, 1], [5, 1], [3, 3]),
};
const frame = (causes: CauseMapInput['causes'], placing = 0) => causeMapFrame({ causes, placing, axes: AXES });
const shapes = (items: readonly FrameItem[]) => items.filter((i): i is Extract<FrameItem, { kind: 'shape' }> => i.kind === 'shape');
const texts = (items: readonly FrameItem[]) => items.filter((i): i is Extract<FrameItem, { kind: 'text' }> => i.kind === 'text');
const rings = (items: readonly FrameItem[]) => shapes(items).filter((i) => /^mark-\d+$/.test(i.id));
const numbers = (items: readonly FrameItem[]) => texts(items).filter((i) => /-num-/.test(i.id));

describe('CS2 cause map policy', () => {
  for (const [name, causes] of Object.entries(CASES)) {
    for (const placing of [0, 1, causes.length]) {
      describe(`${name}, ${placing ? `placing cause ${placing}` : 'reading'}`, () => {
        const { items } = frame(causes, placing);

        it('shows every cause exactly once: none hidden by another', () => {
          expect(numbers(items).map((t) => Number(t.text)).sort((a, b) => a - b)).toEqual(causes.map((_, i) => i + 1));
        });

        it('draws each mark over the exact place of every cause it lists', () => {
          for (const place of groupByPlace(causes)) {
            const ring = rings(items).find((r) => r.id === `mark-${place.numbers[0]}`)!;
            const { x, y } = pointOf(place.who, place.time);
            const s = ring.shape;
            if (s.type === 'circle') expect([s.cx, s.cy]).toEqual([x, y]);
            else if (s.type === 'rect') {
              expect(x).toBeGreaterThanOrEqual(s.x);
              expect(x).toBeLessThanOrEqual(s.x + s.width);
              expect(s.y + s.height / 2).toBe(y);
            } else throw new Error('unexpected mark shape');
          }
        });

        it('keeps every mark inside the map', () => {
          for (const { shape: s } of rings(items)) {
            const [x0, x1] = s.type === 'circle' ? [s.cx - s.r, s.cx + s.r] : s.type === 'rect' ? [s.x, s.x + s.width] : [0, 0];
            expect(x0).toBeGreaterThanOrEqual(PLOT.left);
            expect(x1).toBeLessThanOrEqual(PLOT.right);
          }
        });

        it('colours no cause by where it is: every mark not being placed looks the same', () => {
          const others = rings(items).filter((r) => !groupByPlace(causes).find((p) => `mark-${p.numbers[0]}` === r.id)!.numbers.includes(placing));
          for (const r of others) expect(r.paint).toEqual(others[0].paint);
        });

        it('shows the cause being placed by line weight and a bold number as well as colour, and nothing else as current', () => {
          const bold = numbers(items).filter((t) => t.weight === 'bold');
          expect(bold.map((t) => Number(t.text))).toEqual(placing ? [placing] : []);
          if (!placing) return;
          const mine = rings(items).find((r) => groupByPlace(causes).find((p) => `mark-${p.numbers[0]}` === r.id)!.numbers.includes(placing))!;
          for (const r of rings(items)) if (r !== mine) expect(mine.paint.width).toBeGreaterThan(r.paint.width);
          expect(mine.paint.stroke).toContain('var(--vis-focal'); // the system highlight in high contrast
        });

        it('contains no text but the scale labels and cause numbers: never what the person wrote', () => {
          for (const t of texts(items)) expect(Object.values(AXES).includes(t.text) || /^\d+$/.test(t.text), t.text).toBe(true);
        });

        it('takes colours only from S1 tokens', () => {
          for (const s of shapes(items))
            for (const c of [s.paint.fill, s.paint.stroke]) expect(c).toMatch(/^(none|var\(--vis-[\w-]+(, var\(--vis-[\w-]+\))?\))$/);
          for (const t of texts(items)) expect(t.fill).toMatch(/^var\(--vis-[\w-]+\)$/);
        });
      });
    }
  }

  it('lays the scale labels out inside the figure, so none is cut off', () => {
    const { width, items } = frame(CASES['spread']);
    // A generous width estimate: 0.6 em per character.
    for (const t of texts(items).filter((i) => i.id.startsWith('axis-'))) {
      const w = t.text.length * t.size * 0.6;
      const [x0, x1] = t.anchor === 'end' ? [t.x - w, t.x] : t.anchor === 'start' ? [t.x, t.x + w] : [t.x - w / 2, t.x + w / 2];
      expect(x0, t.text).toBeGreaterThanOrEqual(0);
      expect(x1, t.text).toBeLessThanOrEqual(width);
    }
  });

  it('draws the scale lines solid: a dash means "intended" on the platform', () => {
    for (const s of shapes(frame(CASES['spread']).items).filter((i) => ['frame', 'mid-who', 'mid-time'].includes(i.id))) expect(s.paint.dash).toBeNull();
  });

  it('uses the Cognitive theme', () => {
    expect(frame(CASES['spread']).theme).toBe('cognitive');
    expect(CAUSE_MAP.theme).toBe('cognitive');
  });

  it('places the middle answer on both midlines', () => {
    const { items } = frame(CASES['spread']);
    const mid = pointOf(3, 3);
    const v = shapes(items).find((i) => i.id === 'mid-who')!.shape;
    const h = shapes(items).find((i) => i.id === 'mid-time')!.shape;
    expect(v.type === 'line' && v.x1).toBe(mid.x);
    expect(h.type === 'line' && h.y1).toBe(mid.y);
  });

  it('is a valid composition in every case: purposes, at most one focal element, known styles', () => {
    for (const causes of Object.values(CASES)) {
      for (const placing of [0, 1, causes.length]) {
        const composed = composeCauseMap({ causes, placing, axes: AXES });
        expect(validateScene(composed.scene, lookupOf(composed))).toEqual([]);
      }
    }
  });
});
