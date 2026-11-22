// @ts-expect-error: the spec runs in Node; the app's types don't include Node's.
import { writeFileSync } from 'node:fs';
import { CASES, StudyCase } from './cases';
import type { IdiomId } from './idioms/contract';
import { fieldChoice, fieldPatterns } from './idioms/field';
import { kineticChoice, kineticPatterns } from './idioms/kinetic';
import { Pattern, Refused, kindOf, listLacks } from './idioms/registry';
import { spatialChoice, spatialPatterns } from './idioms/spatial';
import { LISTS } from './idioms/draws';
import { Predicate, Statement, drawable } from './representation';
import { UNSEEN } from './unseen';

/**
 * STUDY CODE, revision 8 (findings-revision-8.md): patterns that know what they draw (OI-39).
 * 1. Drift: each accepted case's pattern lists every kind its coverage accounts for.
 * 2. Hand-written expectations: one structure each pattern must draw, one it must refuse.
 * 3. A bounded structural probe: one synthetic statement, in each variant its predicate allows,
 *    added to every accepted case; every result must be drawn (with the statement accounted for)
 *    or refused by declared needs, never failed. The four counts are written for the findings.
 */
const IDIOMS: IdiomId[] = ['spatial', 'kinetic', 'field'];
const choiceOf = (idiom: IdiomId) => (idiom === 'spatial' ? spatialChoice : idiom === 'kinetic' ? kineticChoice : fieldChoice) as typeof kineticChoice;
const patternsOf = (idiom: IdiomId) => (idiom === 'spatial' ? spatialPatterns() : idiom === 'kinetic' ? kineticPatterns() : fieldPatterns()) as Pattern<object>[];
const ACCEPTED = [...CASES, ...UNSEEN.filter((u) => ['U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'U7'].includes(u.id))];
const byId = (id: string) => ACCEPTED.find((c) => c.id === id)!;

// ---------- Synthetic statements ----------

type Role = 'presence' | 'object' | 'place' | 'process';
/** Each kind's element arguments (with the role a fresh element takes) and its other arguments. */
const SHAPES: Record<string, { roles: Record<string, Role>; rest?: Record<string, unknown>; list?: string }> = {
  passes: { roles: { a: 'presence', b: 'presence' } },
  'exchange-absent': { roles: { from: 'presence', to: 'presence' }, rest: { kind: 'note' } },
  sends: { roles: { from: 'presence', item: 'object', to: 'presence' } },
  receives: { roles: { who: 'presence', item: 'object' } },
  holds: { roles: { who: 'presence', what: 'object' } },
  'located-in': { roles: { what: 'object', place: 'place' } },
  apart: { roles: { a: 'presence', b: 'presence' } },
  feels: { roles: { who: 'presence' }, rest: { charge: 0.5 } },
  reacts: { roles: { who: 'presence' }, rest: { kind: 'none' } },
  flows: { roles: { what: 'object', from: 'place', to: 'place' } },
  joins: { roles: { what: 'object', into: 'object', at: 'place' } },
  cycles: { roles: { what: 'object' }, list: 'through' },
  'part-of': { roles: { part: 'object', whole: 'object' } },
  complete: { roles: { what: 'process' } },
  precedes: { roles: { a: 'process', b: 'process' } },
  'depends-on': { roles: { what: 'process', on: 'process' } },
  absent: { roles: { what: 'object' } },
  waiting: { roles: { what: 'process', for: 'object' } },
  contact: { roles: { a: 'object', b: 'object' } },
  displaced: { roles: { what: 'object', by: 'object' } },
  shifts: { roles: { what: 'process' }, rest: { later: true } },
  exceeds: { roles: { a: 'object', b: 'object' }, rest: { aspect: 'size' } },
  behind: { roles: { what: 'process' }, rest: { amount: 'a week' } },
  above: { roles: { a: 'place', b: 'place' } },
  transforms: { roles: { what: 'object', at: 'place' }, rest: { from: 'one state', to: 'another' } },
  form: { roles: { what: 'object' }, rest: { feature: 'round' } },
};
const ASKS = ['attention', 'whether', 'cause', 'time', 'intent', 'setting', 'fate', 'motion'] as const;

type Variant = 'fresh' | 'reuse' | 'self' | 'repeat';

/** The case with one (or, for `repeat`, two) synthetic statements of `kind` added. */
function withSynthetic(c: StudyCase, kind: string, variant: Variant, n = 1): { c: StudyCase; ids: string[] } {
  const elements = [...c.rep.elements];
  const words: Record<string, string> = { ...c.words };
  const statements: Statement[] = [...c.rep.statements];
  let fresh = 0;
  const make = (role: Role): string => {
    const id = `zz${++fresh}x${n}`;
    elements.push({ id, kind: role });
    words[id] = `Thing ${fresh}`;
    return id;
  };
  const reuse = (role: Role, avoid: string[]): string => {
    const pick = elements.find((e) => e.kind === role && !avoid.includes(e.id) && !e.id.startsWith('zz')) ?? elements.find((e) => !avoid.includes(e.id) && !e.id.startsWith('zz'));
    return pick ? pick.id : make(role);
  };
  const ids: string[] = [];
  for (let k = 0; k < (variant === 'repeat' ? 2 : 1); k++) {
    const id = `zz-s${k}-${kind}`;
    let say: Predicate;
    let commitment: Statement['commitment'] = 'reported';
    if (kind.startsWith('question:')) {
      const about = variant === 'reuse' || variant === 'self' ? reuse('object', []) : make('object');
      say = { p: 'question', about, asks: kind.slice(9) as (typeof ASKS)[number] };
      commitment = 'unknown';
    } else if (kind === 'alternatives') {
      const qid = `zz-q${k}`;
      statements.push({ id: qid, say: { p: 'question', about: reuse('object', []), asks: 'cause' }, commitment: 'unknown', basis: 'synthetic' });
      words[`zz-o${k}a`] = 'One reading';
      words[`zz-o${k}b`] = 'Another reading';
      say = { p: 'alternatives', question: qid, options: [`zz-o${k}a`, `zz-o${k}b`], origin: 'source' };
      commitment = 'possible';
    } else {
      const shape = SHAPES[kind];
      const args: Record<string, unknown> = { ...(shape.rest ?? {}) };
      const used: string[] = [];
      let self: string | undefined;
      for (const [arg, role] of Object.entries(shape.roles)) {
        let el: string;
        if (variant === 'self') el = self ??= make(role);
        else if (variant === 'reuse') el = reuse(role, used);
        else el = make(role);
        used.push(el);
        args[arg] = el;
      }
      if (shape.list) args[shape.list] = variant === 'self' ? [self ?? make('place')] : variant === 'reuse' ? [reuse('place', []), reuse('place', [reuse('place', [])])] : [make('place'), make('place')];
      if (kind === 'reacts') args['to'] = statements[0].id;
      say = { p: kind, ...args } as unknown as Predicate;
    }
    statements.push({ id, say, commitment, basis: 'synthetic (revision-8 probe)' });
    ids.push(id);
  }
  return { c: { ...c, words, rep: { ...c.rep, elements, statements } }, ids };
}

/** Which variants a kind allows: `self` only where it has two element roles or a list. */
function variantsOf(kind: string): Variant[] {
  if (kind.startsWith('question:') || kind === 'alternatives') return ['fresh', 'reuse'];
  const shape = SHAPES[kind];
  const many = Object.keys(shape.roles).length + (shape.list ? 1 : 0) >= 2 || !!shape.list;
  return many ? ['fresh', 'reuse', 'self'] : ['fresh', 'reuse'];
}

const KINDS = [...Object.keys(SHAPES), ...ASKS.map((a) => `question:${a}`), 'alternatives'];
const REPEATED = ['exceeds', 'cycles', 'flows', 'depends-on', 'question:cause', 'alternatives'];

type Outcome = 'shown' | 'declared not shown' | 'refused by declared need' | 'failed';

function outcome(c: StudyCase, ids: string[], idiom: IdiomId): { outcome: Outcome; note: string } {
  try {
    const r = choiceOf(idiom)(c);
    if (r.choice.failed?.length) return { outcome: 'failed', note: r.choice.failed.map((f) => `${f.pattern}: ${f.reason}`).join('; ') };
    if (r.figure.coverage.shown.some((x) => x.id === ids[0])) return { outcome: 'shown', note: r.choice.pattern };
    if (r.figure.coverage.notShown.some((x) => x.id === ids[0])) return { outcome: 'declared not shown', note: r.choice.pattern };
    return { outcome: 'failed', note: `drawn by ${r.choice.pattern} but ${ids[0]} not in its coverage` };
  } catch (e) {
    if (!(e instanceof Refused)) return { outcome: 'failed', note: String(e).slice(0, 200) };
    const fails = e.refusal.tried.filter((x) => x.lacks.some((l) => l.includes('fails on this case')));
    return fails.length ? { outcome: 'failed', note: fails.map((x) => `${x.pattern}: ${x.lacks.find((l) => l.includes('fails on this case'))}`).join('; ') } : { outcome: 'refused by declared need', note: '' };
  }
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
      const p = patternsOf(idiom).find((x) => x.name === name)!;
      const needsOf = (c: StudyCase) => [...listLacks(c, p.draws, p.single), ...p.lacks(c)];
      expect(needsOf(byId(drawCase)), `${name} draws ${drawCase}`).toEqual([]);
      const { c } = withSynthetic(byId(drawCase), kind, variant);
      expect(needsOf(c).length, `${name} refuses ${drawCase} + ${kind}`).toBeGreaterThan(0);
    });

  // ---------- 3. The probe ----------

  const counts: Record<Outcome, number> = { shown: 0, 'declared not shown': 0, 'refused by declared need': 0, failed: 0 };
  const failures: string[] = [];
  for (const base of ACCEPTED)
    it(`probe: ${base.id}, every kind in every variant, in every idiom: drawn and accounted for, or refused by declared need`, () => {
      const runs: [string, Variant][] = [...KINDS.flatMap((k) => variantsOf(k).map((v): [string, Variant] => [k, v])), ...REPEATED.map((k): [string, Variant] => [k, 'repeat'])];
      for (const [kind, variant] of runs) {
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
    // The probe must not pass by refusing everything.
    expect(counts.shown + counts['declared not shown']).toBeGreaterThan(0);
  });
});

void drawable;
