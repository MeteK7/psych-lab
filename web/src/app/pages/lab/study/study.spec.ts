import { elementsOf } from '../../../shared/visual/composition/scene';
import { CASES } from './cases';
import { directions, unscaledVariants } from './figures';
import type { Figure, IdiomId } from './idioms/contract';
import { field } from './idioms/field';
import { spatial } from './idioms/spatial';
import { kinetic } from './idioms/kinetic';
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
  it('has twelve cases, three directions each (slices 1 and 2)', () => {
    expect(CASES.map((c) => c.id)).toEqual(['P1', 'P2', 'E1', 'M1', 'P3', 'P4', 'P5', 'P6', 'E2', 'E3', 'M2', 'M3']);
    expect(all.length).toBe(36);
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

  it('revision 4: each adopted rule draws exactly what the hand change it replaces drew', () => {
    // The hand changes as they stood before revision 4 (finish.ts, slice 2): P1-F1 and its four repeats, E2-S1, M2-S1.
    const currents = { turn: 0.6, headingStart: 76, reach: 170, perHeading: 4 };
    const replaced: [string, IdiomId, object][] = [
      ...['P1', 'P3', 'P4', 'E3', 'M3'].map((id): [string, IdiomId, object] => [id, 'field', currents]),
      ['E2', 'spatial', { lift: { sky: 1.6 } }],
      ['M2', 'spatial', { aside: 2.6 }],
    ];
    for (const [id, idiom, set] of replaced) {
      const c = CASES.find((x) => x.id === id)!;
      const byHand = idiom === 'field' ? field(c, set) : spatial(c, set);
      const byRule = idiom === 'field' ? field(c) : spatial(c);
      for (const at of samples(byRule)) expect(JSON.stringify(byRule.compose(at)), `${id} ${idiom} at ${at}`).toBe(JSON.stringify(byHand.compose(at)));
    }
  });

  describe('R4-4: amounts the text doesn’t give', () => {
    const variants = unscaledVariants();
    const at = (f: Figure, u: number) => JSON.stringify(f.compose(u));

    it('covers P4, E3 and M3 in every idiom, four treatments each', () => {
      expect([...new Set(variants.map((v) => v.case.id))]).toEqual(['P4', 'E3', 'M3']);
      expect(variants.length).toBe(3 * 3 * 4);
    });

    it('draws the adopted treatment by the rules: range in kinetic; the constant, provisionally, in spatial and field', () => {
      for (const v of variants.filter((x) => x.treatment === (x.idiom === 'kinetic' ? 'range' : 'constant'))) {
        const d = all.find((x) => x.case.id === v.case.id && x.idiom === v.idiom)!;
        for (const u of samples(v.figure)) expect(at(v.figure, u), `${v.case.id} ${v.idiom}`).toBe(at(d.finished, u));
      }
    });

    it('kinetic range encodes no amount the text doesn’t give: nothing in it moves when the hidden constant does', () => {
      for (const id of ['P4', 'E3']) {
        const c = CASES.find((x) => x.id === id)!;
        const [one, other] = [kinetic(c, { unspecified: 1 }), kinetic(c, { unspecified: 2.5 })];
        for (const u of samples(one)) expect(at(one, u), `${id} at ${u}`).toBe(at(other, u));
        // The constant, by contrast, draws the amount.
        expect(at(kinetic(c, { unscaled: 'constant', unspecified: 1 }), 1)).not.toBe(at(kinetic(c, { unscaled: 'constant', unspecified: 2.5 }), 1));
      }
    });

    it('kinetic range still draws M3’s stated amount at a scale (R4-4 doesn’t give it one: open)', () => {
      const c = CASES.find((x) => x.id === 'M3')!;
      expect(at(kinetic(c, { unspecified: 1 }), 1)).not.toBe(at(kinetic(c, { unspecified: 2.5 }), 1));
    });

    it('keeps “taller” in E3’s kinetic figure under every treatment', () => {
      const c = CASES.find((x) => x.id === 'E3')!;
      const top = (f: Figure, id: string) => {
        const e = elementsOf(f.compose(1).scene).find((x) => x.element.id === `${id}-stem`)!.element as { geometry: { y2: number } };
        return e.geometry.y2;
      };
      for (const treatment of ['constant', 'labelled', 'range', 'break'] as const) {
        const f = kinetic(c, { unscaled: treatment });
        expect(top(f, 'a'), treatment).toBeLessThan(top(f, 'b') - 10);
      }
    });

    for (const v of variants.filter((x) => x.treatment !== 'constant'))
      it(`${v.case.id} ${v.idiom} ${v.treatment}: valid, every element cited, and different from the constant`, () => {
        expect(problemsOf(v.figure)).toEqual([]);
        const last = samples(v.figure).at(-1)!;
        for (const { element } of elementsOf(v.figure.compose(last).scene)) expect(citesOf(element.purpose).length, element.id).toBeGreaterThan(0);
        const constant = variants.find((x) => x.case === v.case && x.idiom === v.idiom && x.treatment === 'constant')!;
        // A break has no form on a plant's stem in a room (spatial2.ts, plants): drawn as the constant, declared.
        const same = v.case.id === 'E3' && v.idiom === 'spatial' && v.treatment === 'break';
        if (same) expect(JSON.stringify(v.figure.compose(last))).toBe(JSON.stringify(constant.figure.compose(last)));
        else expect(JSON.stringify(v.figure.compose(last))).not.toBe(JSON.stringify(constant.figure.compose(last)));
      });
  });
});
