import { CASES } from './cases';
import { directions } from './figures';
import { figureSet, shuffled } from './match-page';

/** STUDY CODE: pass E's page orders figures reproducibly and shows each case once in its short set. */
describe('pass E page: sets and orders', () => {
  const all = directions();

  it('shuffles the same way for the same order number, and differently for another', () => {
    const items = Array.from({ length: 12 }, (_, k) => k);
    expect(shuffled(items, 3)).toEqual(shuffled(items, 3));
    expect(shuffled(items, 3)).not.toEqual(shuffled(items, 4));
    expect([...shuffled(items, 3)].sort((a, b) => a - b)).toEqual(items);
  });

  it('shows each case once in the short set, with the idioms in rotation', () => {
    for (const seed of [1, 2, 3]) {
      const set = figureSet(all, 'one-per-case', seed);
      expect(set.map((d) => d.case.id)).toEqual(CASES.map((c) => c.id));
      for (const idiom of ['spatial', 'kinetic', 'field']) expect(set.filter((d) => d.idiom === idiom).length).toBe(4);
    }
  });

  it('shows every figure in the full set, and only one idiom in an idiom set', () => {
    expect(figureSet(all, 'all', 1).length).toBe(36);
    expect(figureSet(all, 'kinetic', 1).every((d) => d.idiom === 'kinetic')).toBe(true);
  });
});
