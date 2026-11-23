// @ts-expect-error: the spec runs in Node; the app's types don't include Node's.
import { writeFileSync } from 'node:fs';
import { listLacks as engineListLacks, probe } from '../../../shared/visual';
import { CASES, StudyCase } from './cases';
import type { IdiomId } from './idioms/contract';
import { contextOf, studyRegistry } from './idioms/dispatch';
import { fieldChoice } from './idioms/field';
import { kineticChoice } from './idioms/kinetic';
import { Refused, kindOf, listLacks } from './idioms/registry';
import { spatialChoice } from './idioms/spatial';
import { LISTS } from './idioms/draws';
import { UNSEEN } from './unseen';

/**
 * STUDY CODE, revision 8 (findings-revision-8.md): patterns that know what they draw (OI-39).
 * 1. Drift: each accepted case's pattern lists every kind its coverage accounts for.
 * 2. Hand-written expectations: one structure each pattern must draw, one it must refuse.
 * 3. A bounded structural probe (Stage 3: through the engine's dispatch since M2, its counts pinned;
 *    its generator the engine's since M3, `probe`): one synthetic statement, in each variant its predicate allows,
 *    added to every accepted case; every result must be drawn (with the statement accounted for)
 *    or refused by declared needs, never failed. The four counts are written for the findings.
 */
const IDIOMS: IdiomId[] = ['spatial', 'kinetic', 'field'];
const choiceOf = (idiom: IdiomId) => (idiom === 'spatial' ? spatialChoice : idiom === 'kinetic' ? kineticChoice : fieldChoice) as typeof kineticChoice;
const ACCEPTED = [...CASES, ...UNSEEN.filter((u) => ['U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'U7'].includes(u.id))];
const byId = (id: string) => ACCEPTED.find((c) => c.id === id)!;

type Variant = probe.ProbeVariant;
type Outcome = probe.ProbeOutcome;
const { withSynthetic } = probe;

/** One idiom's drawing of a case, as the probe reads it: the study's refusal is a refusal; anything else thrown is a failure. */
function outcome(c: StudyCase, ids: string[], idiom: IdiomId): { outcome: Outcome; note: string } {
  return probe.outcomeOf(() => {
    try {
      return choiceOf(idiom)(c);
    } catch (e) {
      if (e instanceof Refused) return { refusal: e.refusal };
      throw e;
    }
  }, ids[0]);
}

// ---------- 1. Drift ----------

describe('revision 8: patterns that know what they draw', () => {
  it('lists, for every accepted case’s pattern, every kind its coverage accounts for (drift)', () => {
    for (const c of ACCEPTED.filter((x) => !['U5', 'U6', 'U7'].includes(x.id)))
      for (const idiom of IDIOMS) {
        const r = choiceOf(idiom)(c);
        const lists = LISTS[idiom][r.choice.pattern];
        expect(lists, `${c.id} ${idiom} ${r.choice.pattern}`).toBeDefined();
        const kinds = [...r.figure.coverage.shown, ...r.figure.coverage.notShown].map((x) => kindOf(c.rep.statements.find((s) => s.id === x.id)!));
        for (const k of kinds) expect(lists.draws.includes(k) || (k.startsWith('question:') && lists.draws.includes('question:*')), `${c.id} ${idiom} ${r.choice.pattern} accounts for ${k}`).toBe(true);
        expect(listLacks(c, lists.draws, lists.single), `${c.id} ${idiom}`).toEqual([]);
      }
  });

  // ---------- 2. Hand-written expectations ----------

  /** [idiom, pattern, a case it must draw, a structure it must refuse (kind added to that case, variant)]. */
  const EXPECT: [IdiomId, string, string, string, Variant][] = [
    ['kinetic', 'encounter', 'P1', 'passes', 'repeat'],
    ['field', 'clarity', 'P1', 'passes', 'repeat'],
    ['spatial', 'passing', 'P1', 'passes', 'repeat'],
    ['kinetic', 'jostled', 'P6', 'precedes', 'fresh'],
    ['field', 'crowdField', 'P6', 'precedes', 'fresh'],
    ['spatial', 'carriage', 'P6', 'precedes', 'fresh'],
    ['kinetic', 'reacting', 'P5', 'exceeds', 'fresh'],
    ['field', 'ripples', 'P5', 'exceeds', 'fresh'],
    ['spatial', 'meetingRoom', 'P5', 'exceeds', 'fresh'],
    ['kinetic', 'awaiting', 'P3', 'shifts', 'fresh'],
    ['field', 'openWait', 'P3', 'waiting', 'repeat'],
    ['field', 'heldWait', 'M2', 'exceeds', 'fresh'],
    ['kinetic', 'transmission', 'P2', 'feels', 'repeat'],
    ['field', 'agitation', 'P2', 'feels', 'repeat'],
    ['spatial', 'athome', 'P2', 'feels', 'repeat'],
    ['kinetic', 'shifted', 'P4', 'behind', 'fresh'],
    ['field', 'shiftedField', 'P4', 'behind', 'fresh'],
    ['kinetic', 'compared', 'E3', 'part-of', 'fresh'],
    ['field', 'grownField', 'E3', 'part-of', 'fresh'],
    ['spatial', 'plants', 'E3', 'part-of', 'fresh'],
    ['kinetic', 'lagging', 'M3', 'shifts', 'fresh'],
    ['field', 'lateField', 'M3', 'shifts', 'fresh'],
    ['kinetic', 'cycle', 'E1', 'cycles', 'repeat'],
    ['field', 'flow', 'E1', 'cycles', 'repeat'],
    ['spatial', 'system', 'E1', 'cycles', 'repeat'],
    ['kinetic', 'blocked', 'M1', 'reacts', 'fresh'],
    ['field', 'held', 'M1', 'exceeds', 'fresh'],
    ['spatial', 'way', 'M1', 'exceeds', 'fresh'],
    ['spatial', 'pathScene', 'P4', 'feels', 'fresh'],
    ['kinetic', 'motion', 'U1', 'precedes', 'fresh'],
    ['spatial', 'motion', 'U1', 'precedes', 'fresh'],
    ['kinetic', 'dependency', 'U4', 'depends-on', 'repeat'],
    ['field', 'dependency', 'U4', 'depends-on', 'repeat'],
    ['kinetic', 'felt', 'U2', 'exceeds', 'fresh'],
    ['field', 'felt', 'U2', 'exceeds', 'fresh'],
  ];

  for (const [idiom, name, drawCase, kind, variant] of EXPECT)
    it(`${idiom} ${name}: draws ${drawCase}; refuses ${drawCase} with ${variant === 'repeat' ? 'a second' : 'a'} '${kind}'`, () => {
      const p = studyRegistry().patternsOf(idiom).find((x) => x.name === name)!;
      const needsOf = (c: StudyCase) => [...engineListLacks(c.rep, p.draws, p.single), ...p.lacks(c.rep, contextOf(c, {}, {}))];
      expect(needsOf(byId(drawCase)), `${name} draws ${drawCase}`).toEqual([]);
      const { c } = withSynthetic(byId(drawCase), kind, variant);
      expect(needsOf(c).length, `${name} refuses ${drawCase} + ${kind}`).toBeGreaterThan(0);
    });

  // ---------- 3. The probe ----------

  const counts: Record<Outcome, number> = { shown: 0, 'declared not shown': 0, 'refused by declared need': 0, failed: 0 };
  const failures: string[] = [];
  for (const base of ACCEPTED)
    it(`probe: ${base.id}, every kind in every variant, in every idiom: drawn and accounted for, or refused by declared need`, () => {
      for (const [kind, variant] of probe.runs()) {
        const { c, ids } = withSynthetic(base, kind, variant);
        for (const idiom of IDIOMS) {
          const o = outcome(c, ids, idiom);
          counts[o.outcome]++;
          if (o.outcome === 'failed') failures.push(`${base.id} + ${kind} (${variant}) ${idiom}: ${o.note}`);
        }
      }
    }, 300000);

  it('records the probe’s counts, and finds no failure', () => {
    writeFileSync('../../probe-r8.json', JSON.stringify({ counts, failures }, null, 1));
    expect(failures).toEqual([]);
    // Stage 3, M2: pinned, run through the engine's dispatch. (Before M2: 687 / 360 / 4,368 / 0, of which 6
    // "shown" were field compositions listing a form twice; the engine's coverage check found them.)
    expect(counts).toEqual({ shown: 681, 'declared not shown': 366, 'refused by declared need': 4368, failed: 0 });
    // The probe must not pass by refusing everything.
    expect(counts.shown + counts['declared not shown']).toBeGreaterThan(0);
  });
});

