import { elementsOf } from '../../../shared/visual/composition/scene';
import { CASES } from './cases';
import { directions } from './figures';
import { citesOf } from './kit/elements';
import { axesApart, problemsOf, samples } from './study-page';

/**
 * STUDY CODE: the representation study's checks (docs/visual-study). Every figure, by the rules and
 * finished, at every sampled moment or viewpoint: valid scenes, nothing drawn without a statement,
 * nothing inferred drawn, possibilities only in the possible register, determinism, and three
 * genuinely different directions per case (README: at least two axes apart).
 */
const all = directions();
const figures = all.flatMap((d) => [
  { name: `${d.case.id} ${d.idiom} by the rules`, d, f: d.rules },
  { name: `${d.case.id} ${d.idiom} finished`, d, f: d.finished },
]);

describe('the representation study (first slice)', () => {
  it('has four cases, three directions each', () => {
    expect(CASES.map((c) => c.id)).toEqual(['P1', 'P2', 'E1', 'M1']);
    expect(all.length).toBe(12);
  });

  for (const { name, d, f } of figures) {
    describe(name, () => {
      it('is a valid scene at every sampled moment', () => {
        expect(problemsOf(f)).toEqual([]);
      });

      it('draws only what a statement or a declared neutral base asks for, and nothing inferred (C1, C4)', () => {
        const rep = d.case.rep;
        const commitment = new Map(rep.statements.map((s) => [s.id, s.commitment]));
        for (const at of samples(f)) {
          for (const { element } of elementsOf(f.compose(at).scene)) {
            const cites = citesOf(element.purpose);
            expect(cites.length, `${element.id} cites nothing`).toBeGreaterThan(0);
            for (const c of cites) {
              if (c.startsWith('base:')) continue;
              expect(commitment.has(c), `${element.id} cites unknown '${c}'`).toBe(true);
              expect(commitment.get(c), `${element.id} draws an inference`).not.toBe('inferred');
            }
            // An element that stands only for possibilities is drawn in the possible register.
            const statements = cites.filter((c) => !c.startsWith('base:'));
            const onlyPossible = statements.length > 0 && statements.every((c) => ['possible', 'unknown'].includes(commitment.get(c)!)) && statements.some((c) => commitment.get(c) === 'possible');
            if (onlyPossible && element.kind !== 'label') expect(element.style.dash === 'tentative' || element.style.material === 'translucent', `${element.id} draws a possibility as established`).toBe(true);
          }
        }
      });

      it('is deterministic', () => {
        for (const at of samples(f)) expect(JSON.stringify(f.compose(at))).toBe(JSON.stringify(f.compose(at)));
      });

      it('accounts for every statement it can draw (C7)', () => {
        const ids = [...f.coverage.shown, ...f.coverage.notShown].map((x) => x.id);
        for (const s of d.case.rep.statements.filter((x) => x.commitment !== 'inferred')) expect(ids, s.id).toContain(s.id);
      });
    });
  }

  it('gives each case three directions at least two axes apart (README)', () => {
    for (const c of CASES) {
      const ds = all.filter((d) => d.case.id === c.id);
      for (let i = 0; i < ds.length; i++)
        for (let j = i + 1; j < ds.length; j++) expect(axesApart(ds[i].finished.axes, ds[j].finished.axes), `${c.id} ${ds[i].idiom}–${ds[j].idiom}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('leaves a figure with no hand finishing exactly as the rules drew it', () => {
    for (const d of all.filter((x) => x.adjustments.length === 0))
      for (const at of samples(d.rules)) expect(JSON.stringify(d.finished.compose(at))).toBe(JSON.stringify(d.rules.compose(at)));
  });
});
