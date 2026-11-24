import { figureProblems, representationProblems } from '../../../shared/visual';
import { CASES } from './cases';
import { directions, unseenDirections } from './figures';
import { isRefusal } from './idioms/registry';
import { toChecked } from './engine-adapter';
import { UNSEEN } from './unseen';

/**
 * STUDY CODE, Stage 3 M1 acceptance: the engine's representation layer (S12) reads every accepted
 * study representation as well formed, and finds every accepted figure keeping its invariants. The
 * accepted unseen cases are U1–U7; U8–U10 are refused and draw nothing.
 */
const ACCEPTED_UNSEEN = ['U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'U7'];

describe('Stage 3 M1: the study through the engine’s checks', () => {
  for (const c of [...CASES, ...UNSEEN])
    it(`${c.id}: its representation is well formed as v1`, () => {
      expect(representationProblems(c.rep)).toEqual([]);
    });

  for (const d of directions())
    it(`${d.case.id} ${d.idiom}: by the rules and finished, both keep the invariants`, () => {
      const rep = d.case.rep;
      expect(figureProblems(toChecked(d.rules), rep)).toEqual([]);
      expect(figureProblems(toChecked(d.finished), rep)).toEqual([]);
    });

  it('the 20 accepted unseen figures keep the invariants', () => {
    const drawn = unseenDirections().filter((u) => ACCEPTED_UNSEEN.includes(u.case.id) && !isRefusal(u.drawn));
    expect(drawn.length).toBe(20);
    for (const u of drawn) if (!isRefusal(u.drawn)) expect(figureProblems(toChecked(u.drawn), u.case.rep), `${u.case.id} ${u.idiom}`).toEqual([]);
  });
});
