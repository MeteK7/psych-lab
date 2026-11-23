// @ts-expect-error: the spec runs in Node; the app's types don't include Node's.
import { readdirSync, readFileSync } from 'node:fs';
import { CASES } from './cases';
import { directions, IDIOMS } from './figures';
import { REWORDINGS, drawn, equivalence, geometry } from './pass-c';
import { audit, stripComments } from './pass-c-audit';
import { problemsOf, samples } from './study-page';
import { Refused } from './idioms/registry';
import { FORM_FEATURES } from './representation';
import { U1 } from './unseen';

/**
 * STUDY CODE, pass C (docs/visual-study/findings-pass-c.md). Behavioural independence of the study's
 * rules and contract, not of the production engine. Known dependences are pinned here as findings, so
 * that a change to any of them shows; they are not passes.
 */
const dir = 'src/app/pages/lab/study/';
const read = (sub: string, from = dir, as = sub): Record<string, string> =>
  Object.fromEntries((readdirSync(from + sub) as string[]).filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts')).map((f) => [`${as}/${f}`, readFileSync(from + sub + '/' + f, 'utf-8') as string]));
// Since Stage 3 M3 the rules the study draws with are partly the engine's: its kit, idioms, general patterns and composition (S12).
const engine = 'src/app/shared/visual/representation/';
const drawing = ['compose.ts', 'general.ts', 'needs.ts', 'setting.ts'];
const rules = {
  ...read('idioms'),
  ...Object.fromEntries(drawing.map((f) => [`engine/${f}`, readFileSync(engine + f, 'utf-8') as string])),
  ...read('kit', engine, 'engine/kit'),
  ...read('idioms', engine, 'engine/idioms'),
  ...read('patterns', engine, 'engine/patterns'),
};

describe('pass C: behavioural independence of the study rules', () => {
  describe('1. equivalent representations, equivalent behaviour', () => {
    for (const r of REWORDINGS)
      it(`${r.as}: the same geometry, timing and motion as ${r.from}, apart from text`, () => {
        for (const e of equivalence(r)) {
          expect(e.sameMotion, `${r.from} ${e.idiom} motion`).toBe(true);
          expect(e.differsAt, `${r.from} ${e.idiom}`).toEqual([]);
        }
      });

    it('carries no source-domain word into a reworded figure, except the known ones', () => {
      const leaks = REWORDINGS.flatMap((r) => equivalence(r).filter((e) => e.leaks.length).map((e) => `${r.from} ${e.idiom}: ${e.leaks.join(', ')}`));
      // "You": the own presence is always "you" (a rule, from the `own` flag). Since revision 5 (D5)
      // P3's reworded own presence, the team, is "you" by its flag, not "the team" by its id, so P3's
      // spatial and kinetic figures say "You" too. "Blood": E1's field pattern describes its lanes in
      // circulation words; revision 5 (D8) builds those descriptions from the statements' own words,
      // so it no longer leaks.
      expect(leaks).toEqual(['P3 spatial: You', 'P3 kinetic: You', 'P3 field: You', 'P4 spatial: You', 'P4 kinetic: You']);
    });
  });

  describe('2. domain knowledge in the rules’ code', () => {
    const hits = audit(rules);

    it('never names a case', () => {
      const ids = CASES.map((c) => c.id);
      expect(hits.filter((h) => ids.includes(h.word))).toEqual([]);
    });

    it('branches on case content in these places only (findings-pass-c.md §2)', () => {
      const branches = Object.entries(rules).flatMap(([file, src]) =>
        stripComments(src)
          .split('\n')
          .flatMap((line) => [...line.matchAll(/(?:===|!==) '([a-z-]+)'/g)].map((m) => ({ file, word: m[1], line })))
          .filter((b) => !/\.p [!=]== |asks ===|kind ===|layout ===|unscaled ===|grow ===|material ===|n === '|stances\(c\)\[\d\] ===|idiom [!=]== |\.name [!=]== |plane [!=]== |type [!=]== |quality [!=]== |kindOf [!=]== /.test(b.line))
          // The representation's own vocabulary (commitments, field qualities, the path frame, v0.2's
          // form features) is structure.
          .filter((b) => !['reported', 'implied', 'inferred', 'possible', 'unknown', 'clarity', 'density', 'agitation', 'path', ...FORM_FEATURES].includes(b.word))
          .map((b) => `${b.file}:${b.word}`),
      );
      expect([...new Set(branches)].sort()).toEqual([
        // Revision 5 (D5) removed `own` (grammar keyed to the id) and `team` (word(): "the team").
        'idioms/contract.ts:you',
        'idioms/field.ts:vapour', // E2's states: wider lanes for vapour
        'idioms/kinetic.ts:cloud', // E2's states: a form drawn for each
        'idioms/kinetic.ts:rain',
        'idioms/kinetic.ts:vapour',
        'idioms/spatial.ts:home', // P2's home
        'idioms/spatial.ts:left', // P2's window wall
      ]);
    });

    it('names corpus things in its identifiers in these places only', () => {
      const generic = new Set(['other', 'others', 'side', 'left', 'right']);
      const named = [...new Set(hits.filter((h) => h.where === 'code' && !generic.has(h.word)).map((h) => `${h.file}:${h.word}`))].sort();
      expect(named).toEqual([
        'idioms/kinetic.ts:sender',
        'idioms/kinetic2.ts:crowd',
        'idioms/kinetic2.ts:plant',
        'idioms/spatial.ts:phone',
        'idioms/spatial.ts:window',
        'idioms/spatial2.ts:crowd',
        'idioms/spatial2.ts:plant',
        'idioms/spatial2.ts:room',
      ]);
    });
  });

  describe('3. a representation the rules have never seen (U1)', () => {
    // Pass C found that U1 failed in every idiom: each reached the pattern written for P6's crowded
    // carriage (`contact`) or P2's feeling (`agitation`). Since revision 5 the dispatch refuses rather
    // than reaching another case's pattern, and the motion pattern draws U1 (revision-5.spec.ts).
    for (const idiom of IDIOMS)
      it(`${idiom}: drawn by the motion pattern, valid (revision 5; pass C found it failed)`, () => {
        const f = drawn(U1, idiom);
        expect(problemsOf(f)).toEqual([]);
      });

    it('draws in the field idiom only as a field of agitation; given another quality, the field idiom refuses', () => {
      for (const quality of ['density', 'clarity'] as const) {
        const v = { ...U1, rep: { ...U1.rep, facets: { ...U1.rep.facets, field: { quality, source: 's1', evolves: true } } } };
        expect(() => drawn(v, 'field'), quality).toThrow(Refused);
      }
    });
  });

  describe('4. a second style pack', () => {
    const areas = directions('areas');
    const subjects = directions('subjects');
    const shape = (v: unknown) => JSON.stringify(geometry(v), (k, x) => (k === 'theme' ? undefined : x));

    it('draws education and planning in their own ramps, psychology unchanged', () => {
      for (const d of subjects) {
        const was = areas.find((x) => x.case.id === d.case.id)!.case.theme;
        if (d.case.domain === 'psychology') expect(d.case.theme).toBe(was);
        else expect(d.case.theme, d.case.id).not.toBe(was);
      }
    });

    it('changes only the colour ramp: every figure’s geometry is the same', () => {
      for (const [k, d] of subjects.entries())
        for (const at of samples(d.finished)) expect(shape(d.finished.compose(at)), `${d.case.id} ${d.idiom}`).toBe(shape(areas[k].finished.compose(at)));
    });

    it('is valid in the new ramps', () => {
      for (const d of subjects.filter((x) => x.case.domain !== 'psychology')) expect(problemsOf(d.finished), `${d.case.id} ${d.idiom}`).toEqual([]);
    });
  });
});
