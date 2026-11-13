import { SHOWN, lookupOf } from '../../composition/compose';
import { spacingWarnings } from '../../composition/spacing';
import { validateScene } from '../../composition/validate';
import { controlsOf } from '../../interaction/controls';
import { targetsOf } from '../../interaction/regions';
import { valueAt } from '../../interaction/scales';
import { buildComposedFrame } from '../../integration/pipeline';
import { changeMovers, changeProblems } from '../../motion/plan-motion';
import { GUIDE_DAYS, GUIDE_DAYS_SIZE, WEEK, barX, composeGuideDays } from './guide-days';

// The authoring guide's worked example (docs/visual-authoring-guide.md, step 5): what the figure
// promises, asserted for every value it can show. An exercise's instrument has a spec like this.

const BAR = 'Days you plan to practise';
const composed = (days: number) => composeGuideDays({ days, barLabel: BAR });
const frame = (days: number) => buildComposedFrame(composed(days));
const ALL = Array.from({ length: WEEK + 1 }, (_, days) => days);

describe('reference.guide.days (policy)', () => {
  it('is a valid composition for every number of days, with no spacing warnings', () => {
    for (const days of ALL) {
      const c = composed(days);
      expect(validateScene(c.scene, lookupOf(c)), `${days} days`).toEqual([]);
      expect(spacingWarnings(c.scene, lookupOf(c)), `${days} days`).toEqual([]);
    }
  });

  it('fills exactly the planned days, and tells them apart by shape and weight, not colour alone', () => {
    for (const days of ALL) {
      const marks = frame(days).items.filter((i) => i.id.startsWith('day-'));
      expect(marks).toHaveLength(WEEK);
      marks.forEach((m, i) => {
        if (m.kind !== 'shape') throw new Error('day marks are shapes');
        if (i < days) {
          expect(m.paint.fill, `day ${i + 1} of ${days}`).not.toBe('none'); // filled
          expect(m.paint.width).toBe(0);
        } else {
          expect(m.paint.fill, `day ${i + 1} of ${days}`).toBe('none'); // a thin outline
          expect(m.paint.width).toBeGreaterThan(0);
        }
      });
    }
  });

  it('draws inside its frame and uses token colours only, in the Action theme', () => {
    for (const days of ALL) {
      const f = frame(days);
      expect(f.theme).toBe(GUIDE_DAYS.theme);
      expect(f.theme).toBe('action');
      for (const item of f.items) {
        if (item.kind !== 'shape') continue;
        for (const value of [item.paint.fill, item.paint.stroke]) expect(value === 'none' || value.includes('var(--vis-')).toBe(true);
      }
    }
    expect(barX(0)).toBeGreaterThan(0);
    expect(barX(WEEK)).toBeLessThan(GUIDE_DAYS_SIZE.width);
  });

  it('holds its value at the ends', () => {
    expect(composed(-2).scene).toEqual(composed(0).scene);
    expect(composed(9).scene).toEqual(composed(WEEK).scene);
  });

  it('the bar stands where its scale puts that number, and the figure’s control says what the exercise’s native control says', () => {
    for (const days of ALL) {
      const c = composed(days);
      const [control] = controlsOf(c.scene, targetsOf(c.scene, SHOWN), { days }, lookupOf(c));
      expect(control).toMatchObject({ kind: 'slider', value: 'days', label: BAR, min: 0, max: WEEK, step: 1, now: days });
      expect(valueAt(c.scene.scales!['days'], barX(days))).toBe(days);
    }
  });

  it('glides only the bar when the number changes, with its reason; the marks change at once', () => {
    for (const [from, to] of [[2, 3], [0, 7], [5, 1]]) {
      const movers = changeMovers(composed(from).scene, composed(to).scene);
      expect(movers.map((m) => m.id)).toEqual(['bar']);
      expect(movers[0].change).toMatchObject({ kind: 'moves' });
      expect(changeProblems(composed(from).scene, composed(to).scene)).toEqual([]);
    }
  });
});
