import { CASES } from './cases';
import { ACCEPTED_UNSEEN, directions, engineDirections } from './figures';
import { fieldChoice } from './idioms/field';
import { kineticChoice } from './idioms/kinetic';
import { spatialChoice } from './idioms/spatial';
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

  describe('the Engine set (Stage 3, M3)', () => {
    const engine = engineDirections();
    const set = figureSet(all, 'engine', 1, engine);
    const choiceOf = (d: (typeof set)[number]) => (d.idiom === 'spatial' ? spatialChoice : d.idiom === 'kinetic' ? kineticChoice : fieldChoice)(d.case).choice.pattern;

    it('shows the 20 accepted unseen figures, each with its own text, and no corpus figure', () => {
      expect(set.length).toBe(20);
      expect([...new Set(set.map((d) => d.case.id))]).toEqual([...ACCEPTED_UNSEEN]);
      expect(set.every((d) => d.case.text.length > 0)).toBe(true);
      expect(set.some((d) => CASES.some((c) => c.id === d.case.id))).toBe(false);
    });

    it('is drawn by the engine: each figure by a general pattern or a composition, as the corpus sets never are', () => {
      const general = ['motion', 'dependency', 'felt'];
      const engineDrawn = (p: string) => general.includes(p) || general.some((g) => p.startsWith(`composed: ${g} +`));
      expect(set.filter((d) => !engineDrawn(choiceOf(d))).map((d) => `${d.case.id} ${d.idiom}: ${choiceOf(d)}`)).toEqual([]);
      expect(all.filter((d) => engineDrawn(choiceOf(d)))).toEqual([]);
    });
  });
});
