import { CASES, StudyCase } from './cases';
import { IDIOMS } from './figures';
import type { IdiomId } from './idioms/contract';
import { fieldChoice } from './idioms/field';
import { kineticChoice } from './idioms/kinetic';
import { Refused, attempt, isRefusal } from './idioms/registry';
import { spatialChoice } from './idioms/spatial';
import { drawn } from './pass-c';
import { unseenDirections } from './figures';
import { problemsOf } from './study-page';
import { U1 } from './unseen';

/**
 * STUDY CODE, revision 5 (findings-revision-5.md). Composition dispatch: each pattern says what it
 * needs; every able pattern is drawn and the one leaving the fewest established statements undrawn is
 * chosen; with none able, the idiom refuses. golden.spec.ts proves the corpus figures unchanged.
 */
const choiceOf = (c: StudyCase, idiom: IdiomId) => (idiom === 'spatial' ? spatialChoice(c) : idiom === 'kinetic' ? kineticChoice(c) : fieldChoice(c)).choice;

describe('revision 5, step 1: composition dispatch', () => {
  it('chooses the same pattern for every corpus figure as the first-match dispatch did', () => {
    const chosen = Object.fromEntries(CASES.map((c) => [c.id, IDIOMS.map((idiom) => choiceOf(c, idiom).pattern).join(' ')]));
    expect(chosen).toEqual({
      P1: 'passing encounter clarity',
      P2: 'athome transmission agitation',
      E1: 'system cycle flow',
      M1: 'way blocked held',
      P3: 'pathScene awaiting openWait',
      P4: 'pathScene shifted shiftedField',
      P5: 'meetingRoom reacting ripples',
      P6: 'carriage jostled crowdField',
      E2: 'system cycle flow',
      E3: 'plants compared grownField',
      M2: 'pathScene awaiting heldWait',
      M3: 'pathScene lagging lateField',
    });
  });

  it('finds exactly one able pattern for every corpus figure (a finding: each pattern is one case’s)', () => {
    for (const c of CASES) for (const idiom of IDIOMS) expect(choiceOf(c, idiom).others, `${c.id} ${idiom}`).toEqual([]);
  });

  it('refuses U1 in every idiom without the motion pattern, saying what each pattern lacked', () => {
    for (const idiom of IDIOMS) {
      const r = attempt(() => (idiom === 'spatial' ? spatialChoice : idiom === 'kinetic' ? kineticChoice : fieldChoice)(U1, {}, { without: ['motion', 'composition'] }).figure);
      expect(isRefusal(r), idiom).toBe(true);
      if (isRefusal(r)) {
        expect(r.tried.length).toBeGreaterThan(5);
        expect(r.tried.every((x) => x.lacks.length > 0)).toBe(true);
      }
    }
  });
});

describe('revision 5, steps 3 and 4: the unseen cases', () => {
  const unseen = unseenDirections();
  const outcome = (id: string) => unseen.filter((u) => u.case.id === id).map((u) => `${u.idiom}:${isRefusal(u.drawn) ? 'refused' : 'drawn'}`).join(' ');

  it('draws U1 in every idiom, valid (a fit: the motion pattern was built after U1 was seen)', () => {
    expect(outcome('U1')).toBe('spatial:drawn kinetic:drawn field:drawn');
    for (const u of unseen.filter((x) => x.case.id === 'U1')) if (!isRefusal(u.drawn)) expect(problemsOf(u.drawn), u.idiom).toEqual([]);
  });

  // Revision 5 refused the three blind cases (U2–U4) in every idiom; revision 6 draws them
  // (revision-6.spec.ts, findings-revision-6.md).

  it('never throws for a case it can’t draw: every refusal names what each pattern lacked (D9 closed for P1’s and P2’s patterns)', () => {
    for (const u of unseen) if (isRefusal(u.drawn)) expect(u.drawn.tried.every((x) => x.lacks.length > 0), `${u.case.id} ${u.idiom}`).toBe(true);
  });
});
