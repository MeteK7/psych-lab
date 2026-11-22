import { unseenDirections } from './figures';
import { isRefusal } from './idioms/registry';
import { kineticChoice } from './idioms/kinetic';
import { spatialChoice } from './idioms/spatial';
import { fieldChoice } from './idioms/field';
import { problemsOf } from './study-page';
import { UNSEEN } from './unseen';

/**
 * STUDY CODE, revision 6 (findings-revision-6.md): coverage extended from the blind cases. The corpus
 * and U1 are proved unchanged by golden.spec.ts; these pin what the new patterns draw, and which.
 */
describe('revision 6: coverage from the blind cases', () => {
  const unseen = unseenDirections();
  const outcome = (id: string) => unseen.filter((u) => u.case.id === id).map((u) => `${u.idiom}:${isRefusal(u.drawn) ? 'refused' : 'drawn'}`).join(' ');
  const chosen = (id: string) => {
    const c = UNSEEN.find((x) => x.id === id)!;
    return [spatialChoice(c), kineticChoice(c), fieldChoice(c)].map((x) => x.choice.pattern).join(' ');
  };

  it('draws U2, U3 and U4 in every idiom, each by the pattern built for its kind of statement', () => {
    for (const id of ['U2', 'U3', 'U4']) expect(outcome(id), id).toBe('spatial:drawn kinetic:drawn field:drawn');
    expect(chosen('U2')).toBe('felt felt felt');
    expect(chosen('U3')).toBe('motion motion motion');
    expect(chosen('U4')).toBe('dependency dependency dependency');
  });

  it('draws every unseen figure as a valid scene', () => {
    for (const u of unseen) if (!isRefusal(u.drawn)) expect(problemsOf(u.drawn), `${u.case.id} ${u.idiom}`).toEqual([]);
  });

  it('draws nothing inferred: U2’s waiting, U3’s height, U4’s order and waiting are not cited by any element', () => {
    for (const u of unseen) {
      if (isRefusal(u.drawn)) continue;
      const inferred = new Set(u.case.rep.statements.filter((s) => s.commitment === 'inferred').map((s) => s.id));
      const f = u.drawn;
      const json = JSON.stringify([0, 0.5, 1].map((at) => f.compose(at)));
      for (const id of inferred) expect(json.includes(`[${id}]`) || json.includes(`,${id}]`) || json.includes(`[${id},`), `${u.case.id} ${u.idiom} draws ${id}`).toBe(false);
    }
  });

  // Revision 6 refused the second blind set (U5–U7) in every idiom: no single pattern could draw them.
  // Revision 7 composes them (revision-7.spec.ts); without composition they are still refused.
  it('refuses the second blind set (U5–U7) in every idiom without composition (as revision 6 found)', () => {
    for (const c of UNSEEN.filter((x) => ['U5', 'U6', 'U7'].includes(x.id)))
      for (const fn of [spatialChoice, kineticChoice, fieldChoice] as const) expect(() => (fn as typeof kineticChoice)(c, {}, { without: ['composition'] }), c.id).toThrow();
  });
});

