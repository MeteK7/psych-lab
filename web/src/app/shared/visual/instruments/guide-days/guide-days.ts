import { Composed, composeScene } from '../../composition/compose';
import type { Purpose, SceneElement } from '../../composition/scene';
import type { StyleRef, ThemeId } from '../../styling/vocabulary';

/**
 * The authoring guide's worked example (milestone M8, `docs/visual-authoring-guide.md`). A reference
 * composition: built, registered, bound and tested exactly as an exercise's instrument would be,
 * and shown only in the Visual Lab. No exercise uses it, and no participant sees it.
 *
 * Its policy (docs/visual-policy.md §8):
 *
 *   Scene:      reference.guide.days@1    Area theme: action@1    Tier: instrument
 *   Idea:       how many days of one week a person plans to practise.
 *   States:     one per number, 0–7, built from the exercise's value: the planned days filled,
 *               the others thin outlines; a bar just after the last planned day.
 *   Metaphor:   none: a week as seven marks, counted at a glance.
 *   Must:       fill exactly the planned days; tell planned from free by shape and weight, never
 *               colour alone; hold the number at 0 and 7; the bar stands where its scale puts the
 *               number, so the figure and the exercise's native control say the same; token
 *               colours only, in the Action theme; stay inside its frame.
 *   Must not:   judge the number (no "good" or "too few"), celebrate a full week, carry any of
 *               the person's own words.
 *   Motion:     only the bar moves, gliding to each new number (`moves`, following input); the
 *               marks change at once.
 *   Alt texts:  the exercise gives its own ("3 of 7 days planned"); `alt` here is for reviewers.
 *   Assertions: `guide-days.policy.spec.ts`.
 *   Review:     none: a reference composition reaches no participant.
 */
export const GUIDE_DAYS = { id: 'reference.guide.days', version: 1, theme: 'action' as ThemeId } as const;

/** The days in the week the figure shows. */
export const WEEK = 7;

export interface GuideDaysInput {
  /** How many days are planned, 0–7: the exercise's own value. */
  days: number;
  /** The bar's name, in the exercise's own words (its native control says the same). */
  barLabel: string;
}

// Design size, in CSS px at the figure's usual width (1 unit = 1 px).
export const GUIDE_DAYS_SIZE = { width: 480, height: 80 };
const PITCH = 60; // from one day to the next
const FIRST = 60; // the first day's centre
const R = 12; // a day mark's radius
const ROW = 36; // the marks' centre line
/** The bar's place for each number of days: just before the first day (0) to just after the last (7). */
export const DAYS_SCALE = { kind: 'linear', domain: [0, WEEK], range: [FIRST - PITCH / 2, FIRST + (WEEK - 0.5) * PITCH], step: 1 } as const;

/** Why each element is there (docs/visual-policy.md principle 6). */
export const GUIDE_DAYS_PURPOSES: readonly { id: string; purpose: Purpose }[] = [
  {
    id: 'day-*',
    purpose: {
      serves: ['understanding'],
      why: 'Shows the number as days of one week, so the planned days and the free ones can be counted at a glance.',
    },
  },
  {
    id: 'track',
    purpose: {
      serves: ['interaction'],
      why: 'The line the bar moves along; pressing it places the bar there. Without it, only the small bar would take the pointer.',
    },
  },
  {
    id: 'bar',
    purpose: {
      serves: ['interaction', 'feedback'],
      why: 'The number a person sets: drag it, or press the line. It glides to each new number so the step can be seen.',
    },
  },
];

const purpose = (id: string) => GUIDE_DAYS_PURPOSES.find((p) => p.id === id)!.purpose;
const PLANNED: StyleRef = { role: 'subject', material: 'solid' };
const FREE: StyleRef = { role: 'context', line: 'hair' };

/** Where the bar stands for a number of days. */
export const barX = (days: number) => DAYS_SCALE.range[0] + days * PITCH;

export function composeGuideDays({ days, barLabel }: GuideDaysInput): Composed {
  const planned = Math.min(Math.max(Math.round(days), 0), WEEK);
  const marks: SceneElement[] = Array.from({ length: WEEK }, (_, i) => ({
    kind: 'shape',
    id: `day-${i + 1}`,
    geometry: { type: 'circle', cx: FIRST + i * PITCH, cy: ROW, r: R },
    style: i < planned ? PLANNED : FREE,
    purpose: purpose('day-*'),
  }));
  const [left, right] = DAYS_SCALE.range;
  return composeScene(
    {
      id: GUIDE_DAYS.id,
      version: GUIDE_DAYS.version,
      theme: GUIDE_DAYS.theme,
      size: GUIDE_DAYS_SIZE,
      scales: { days: DAYS_SCALE },
      layers: [
        {
          id: 'week',
          plane: 'annotation',
          elements: [
            { kind: 'shape', id: 'track', geometry: { type: 'line', x1: left, y1: ROW + 28, x2: right, y2: ROW + 28 }, style: { role: 'context', line: 'hair' }, purpose: purpose('track') },
            ...marks,
          ],
        },
        {
          id: 'bar',
          plane: 'subject',
          elements: [
            {
              kind: 'shape',
              id: 'bar',
              geometry: { type: 'rect', x: barX(planned) - 3, y: ROW - 22, width: 6, height: 50, rx: 3 },
              style: { role: 'subject', material: 'solid' },
              purpose: purpose('bar'),
              moves: { why: 'It follows the number a person sets, quickly, so each step can be seen.' },
              target: { kind: 'handle', x: { scale: 'days', value: 'days' }, track: 'track', label: 'bar-label' },
            },
          ],
        },
      ],
      alt: `${planned} of ${WEEK} days planned.`,
    },
    { 'bar-label': barLabel },
  );
}
