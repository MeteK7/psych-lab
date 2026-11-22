import { unseenDirections } from './figures';
import { fieldChoice } from './idioms/field';
import { kineticChoice } from './idioms/kinetic';
import { isRefusal } from './idioms/registry';
import { spatialChoice } from './idioms/spatial';
import { problemsOf } from './study-page';
import { UNSEEN } from './unseen';

/**
 * STUDY CODE, revision 7 (findings-revision-7.md): composition across patterns. golden.spec.ts proves
 * every accepted figure unchanged; these pin what composition draws, what it refuses, and why.
 */
describe('revision 7: composition across patterns', () => {
  const unseen = unseenDirections();
  const outcome = (id: string) => unseen.filter((u) => u.case.id === id).map((u) => `${u.idiom}:${isRefusal(u.drawn) ? 'refused' : 'drawn'}`).join(' ');
  const pattern = (id: string, fn: typeof kineticChoice) => fn(UNSEEN.find((x) => x.id === id)!).choice.pattern;

  it('composes U6 and U7 in every idiom, and U5 in two (its spatial figure would put the wallet inside the shop)', () => {
    expect(outcome('U5')).toBe('spatial:refused kinetic:drawn field:drawn');
    expect(outcome('U6')).toBe('spatial:drawn kinetic:drawn field:drawn');
    expect(outcome('U7')).toBe('spatial:drawn kinetic:drawn field:drawn');
    expect(pattern('U5', kineticChoice)).toBe('composed: felt + 2');
    expect(pattern('U6', kineticChoice)).toBe('composed: motion + 4');
    expect(pattern('U7', kineticChoice)).toBe('composed: dependency + 3');
    expect(pattern('U6', spatialChoice as typeof kineticChoice)).toBe('composed: motion + 4');
    expect(pattern('U7', fieldChoice as typeof kineticChoice)).toBe('composed: dependency + 3');
  });

  it('draws every composed figure as a valid scene, with nothing inferred cited', () => {
    for (const u of unseen.filter((x) => ['U5', 'U6', 'U7'].includes(x.case.id))) {
      if (isRefusal(u.drawn)) continue;
      expect(problemsOf(u.drawn), `${u.case.id} ${u.idiom}`).toEqual([]);
      const inferred = u.case.rep.statements.filter((s) => s.commitment === 'inferred').map((s) => s.id);
      const json = JSON.stringify([0, 0.5, 1].map((at) => (isRefusal(u.drawn) ? null : u.drawn.compose(at))));
      for (const id of inferred) expect(json.includes(`[${id}]`) || json.includes(`,${id}]`) || json.includes(`[${id},`) || json.includes(`,${id},`), `${u.case.id} ${u.idiom} draws ${id}`).toBe(false);
    }
  });

  it('refuses the third blind set (U8–U10) in every idiom, run unchanged (a finding)', () => {
    for (const id of ['U8', 'U9', 'U10']) expect(outcome(id), id).toBe('spatial:refused kinetic:refused field:refused');
  });

  // Revision 8 (amendment 5): the same patterns, cases and idioms; their refusal reasons are now the
  // declared needs (draws.ts), where revision 7 recorded "fails on this case".
  it('refuses, by declared need, the corpus patterns that failed on a case they were never written for in revision 7', () => {
    const reasons = (id: string, idiom: string, pattern: string) => {
      const u = unseen.find((x) => x.case.id === id && x.idiom === idiom)!;
      return isRefusal(u.drawn) ? u.drawn.tried.find((x) => x.pattern === pattern)!.lacks : [];
    };
    const declared = (lacks: string[]) => lacks.length > 0 && lacks.every((l) => !l.startsWith('fails on this case'));
    expect(declared(reasons('U8', 'spatial', 'plants'))).toBe(true);
    expect(declared(reasons('U8', 'kinetic', 'compared'))).toBe(true);
    expect(declared(reasons('U9', 'kinetic', 'cycle'))).toBe(true);
    expect(declared(reasons('U9', 'field', 'flow'))).toBe(true);
    expect(declared(reasons('U10', 'spatial', 'plants'))).toBe(true);
  });
});
