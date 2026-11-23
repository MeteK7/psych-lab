// @ts-expect-error: the spec runs in Node; the app's types don't include Node's.
import { writeFileSync } from 'node:fs';
import { unseenDirections } from './figures';
import { isRefusal } from './idioms/registry';
import { samples } from './study-page';

/**
 * STUDY CODE, Stage 3 M3: the engine's figures, measured. The time to compose each moment of the 20
 * accepted unseen figures (drawn by the engine's general patterns and composition), against half a
 * 60 Hz frame: our code's share of a frame (visual-system.md, M6). The median of several runs, after
 * one to warm up, written to measure-m3.json. A figure over budget is reported, not tuned.
 */
const ACCEPTED_UNSEEN = ['U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'U7'];
const BUDGET_MS = 1000 / 60 / 2;
const RUNS = 7;

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

describe('Stage 3 M3: the engine’s figures within budget', () => {
  it('composes every moment of the 20 accepted unseen figures within half a 60 Hz frame', () => {
    const figures = unseenDirections().filter((u) => ACCEPTED_UNSEEN.includes(u.case.id));
    const drawn = figures.flatMap((u) => (isRefusal(u.drawn) ? [] : [{ name: `${u.case.id} ${u.idiom}`, figure: u.drawn }]));
    expect(drawn.length).toBe(20);
    const rows = drawn.map(({ name, figure }) => {
      const moments = samples(figure);
      for (const at of moments) figure.compose(at);
      const perMoment = moments.map((at) =>
        median(
          Array.from({ length: RUNS }, () => {
            const t0 = performance.now();
            figure.compose(at);
            return performance.now() - t0;
          }),
        ),
      );
      return { name, moments: moments.length, worst: Math.max(...perMoment) };
    });
    // Written beside the probe's counts, for the findings.
    writeFileSync('../../measure-m3.json', JSON.stringify({ budgetMs: BUDGET_MS, rows: rows.map((r) => ({ ...r, worst: Math.round(r.worst * 100) / 100 })) }, null, 1));
    expect(rows.filter((r) => r.worst > BUDGET_MS).map((r) => `${r.name}: ${r.worst.toFixed(2)} ms`)).toEqual([]);
  });
});
