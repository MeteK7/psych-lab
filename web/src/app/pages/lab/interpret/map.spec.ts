// @ts-expect-error: the spec runs in Node; the app's types don't include Node's.
import { readFileSync } from 'node:fs';
import { ESTABLISHED, INFERRED_ONLY, representationProblems } from '../../../shared/visual';
import { tablesIn } from '../trial/sheets';
import { TRACK_A_MARKER } from './account';
import type { AccountStatement, Mapping, ReviewedAccount } from './map';
import { COMMITMENT_OF, ONE_PHASE, mapAccount } from './map';
import { MAPPING_CASES, MAPPING_TIME_CASES } from './mapping-cases';
import { corpusTexts } from './sources';

/** STUDY CODE, Track A (TRACK-A: AI-generated, development only, not validated). The mapping's tests. */

const DOCS = '../docs/';
const read = (p: string): string => readFileSync(p, 'utf-8');

/** The properties every mapping holds, whatever its input. */
function holdsProperties(a: ReviewedAccount, m: Mapping): void {
  const rows = new Map(a.statements.map((s) => [s.id, s]));
  expect(representationProblems(m.representation), a.id).toEqual([]);
  expect(m.problems).toEqual([]);
  expect(m.marker).toBe(TRACK_A_MARKER);
  // The account's phases exactly, or one neutral phase; `repeats` only when the account says so.
  if (!m.refused.length) expect(m.representation.time).toEqual(a.time ? { phases: [...a.time.phases], ...(a.time.repeats ? { repeats: true } : {}) } : { phases: [ONE_PHASE] });
  expect(m.representation.facets).toEqual({});
  expect(m.representation.elements).toEqual(a.elements);
  for (const s of m.representation.statements) {
    const from = m.mapped.find((x) => x.to === s.id)?.from;
    const row = from === undefined ? undefined : rows.get(from);
    // Nothing added: every statement comes from one account statement, with one of its forms.
    expect(row, `${a.id} ${s.id}`).toBeDefined();
    const forms = Array.isArray(row!.say) ? row!.say : [row!.say];
    expect(forms).toContainEqual(s.say);
    // Nothing strengthened, nothing weakened: exactly its category's commitment, or a reported denial.
    expect(s.commitment, `${a.id} ${s.id}`).toBe(row!.denied ? 'denied' : COMMITMENT_OF[row!.category]);
    if (ESTABLISHED.includes(s.commitment)) expect(['R', 'L']).toContain(row!.category);
    if (INFERRED_ONLY.includes(s.say.p)) expect(s.commitment).toBe('inferred');
    expect(s.basis?.startsWith(`${row!.id}:`)).toBe(true);
    // Its phases copied exactly. None, which the contract reads as every phase, only when the account
    // has no phases or the statement is marked throughout.
    if (s.phases) expect(s.phases).toEqual(row!.phases);
    else expect(!a.time || row!.throughout === true, `${a.id} ${s.id} holds in every phase without saying so`).toBe(true);
  }
  // Every account statement is either mapped whole or a gap, never both, never neither (unless refused).
  for (const s of a.statements) {
    const mapped = m.mapped.filter((x) => x.from === s.id).length;
    const gaps = m.gaps.filter((g) => g.id === s.id).length;
    if (m.refused.length) expect(mapped).toBe(0);
    else {
      expect([mapped > 0, gaps > 0], `${a.id} ${s.id}`).toContain(true);
      expect(mapped > 0 && gaps > 0, `${a.id} ${s.id}`).toBe(false);
      if (mapped) expect(mapped).toBe(Array.isArray(s.say) ? s.say.length : 1);
    }
  }
}

describe('Track A, A3: the first test inputs are reviewed corpus accounts, typed as they are', () => {
  const corpus = ['psychology', 'education', 'planning', 'stress'].flatMap((d) => {
    const md = read(`${DOCS}visual-study/corpus-${d}.md`);
    return md.split(/^### /m).slice(1).map((block) => ({ block, source: corpusTexts(`### ${block}`)[0] }));
  });

  it('copies each row of the corpus account unchanged: id, statement, category and basis', () => {
    for (const a of [...MAPPING_CASES, ...MAPPING_TIME_CASES]) {
      const found = corpus.find((c) => c.source?.id === a.id);
      expect(found, a.id).toBeDefined();
      expect(a.text).toBe(found!.source.text);
      const rows = tablesIn(found!.block)[0].rows.map((r) => r.slice(0, 4));
      expect(a.statements.map((s) => [s.id, s.statement, s.category, s.basis]), a.id).toEqual(rows);
    }
  });

  it('takes no text of the human trial, the robustness set, the calibration set or the sealed held-out set', () => {
    const trial = ['slice-1/texts.md', 'calibration/texts.md'].map((f) => read(`${DOCS}interpretation-trial/${f}`)).join('\n') + read(`${DOCS}interpretation-trial/robustness.md`);
    const heldOut = read(`${DOCS}interpretation-dev/held-out/texts.md`);
    for (const a of [...MAPPING_CASES, ...MAPPING_TIME_CASES]) {
      expect(trial.includes(a.text), a.id).toBe(false);
      expect(heldOut.includes(a.text), a.id).toBe(false);
    }
  });
});

describe('Track A, A3: mapping the three reviewed accounts', () => {
  const byId = new Map(MAPPING_CASES.map((a) => [a.id, mapAccount(a)]));
  const mapped = (id: string) => byId.get(id)!.representation.statements.map((s) => `${s.id} ${s.say.p} ${s.commitment}`);
  const gaps = (id: string) => byId.get(id)!.gaps.map((g) => g.id);
  const why = (id: string, row: string) => byId.get(id)!.gaps.find((g) => g.id === row)?.why;

  it('holds every property on each, and refuses none', () => {
    for (const a of MAPPING_CASES) {
      const m = byId.get(a.id)!;
      expect(m.refused, a.id).toEqual([]);
      holdsProperties(a, m);
    }
  });

  it('P-CS3-4: maps the reported absence and the open question; leaves out the unlicensed implication and the set with no question in the account', () => {
    expect(mapped('P-CS3-4')).toEqual(['R1 exchange-absent reported', 'U1 question unknown']);
    expect(gaps('P-CS3-4')).toEqual(['L1', 'I1', 'I2', 'U2', 'P']);
    expect(why('P-CS3-4', 'L1')).toBe('implied, but no licensed pattern from the registry is named');
    expect(why('P-CS3-4', 'I1')).toBe('no predicate form: the account gives none');
    expect(why('P-CS3-4', 'P')).toMatch(/the contract rejects it: .*alternatives\.question must name a statement \(has 'q2'\)/);
  });

  it('M-2: maps the three dependencies of one statement, and leaves out the date and a question the contract can\'t ask', () => {
    expect(mapped('M-2')).toEqual(['R2.1 depends-on reported', 'R2.2 depends-on reported', 'R2.3 depends-on reported']);
    expect(gaps('M-2')).toEqual(['R1', 'U1']);
    expect(why('M-2', 'U1')).toMatch(/question\.asks must be one of attention, whether, cause, time, intent, setting, fate, motion/);
  });

  it('E-8: keeps the belief as the people\'s, the denied account as denied, and the source\'s own account as reported; leaves out "directness"', () => {
    expect(mapped('E-8')).toEqual(['R1 believes reported', 'R2 causes denied', 'R3 causes reported']);
    expect(gaps('E-8')).toEqual(['R4']);
    expect(why('E-8', 'R4')).toMatch(/unknown predicate 'directness'/);
    const rep = byId.get('E-8')!.representation;
    expect(rep.statements.find((s) => s.id === 'R1')!.say).toEqual({ p: 'believes', who: 'people', statement: 'R2' });
  });
});

describe('Track A, A3: what the mapping refuses or leaves out (offline fixtures, written for these tests)', () => {
  const elements = [
    { id: 'own', kind: 'presence' as const, own: true },
    { id: 'friend', kind: 'presence' as const },
    { id: 'letter', kind: 'object' as const },
  ];
  const acc = (statements: AccountStatement[], extra: Partial<ReviewedAccount> = {}): ReviewedAccount => ({ id: 'T', text: 'A test text.', source: 'a test fixture', elements, statements, ...extra });
  const q = (id = 'U1'): AccountStatement => ({ id, statement: 'Why', category: 'U', basis: 'test', say: { p: 'question', about: 'friend', asks: 'cause' } });

  it('maps each category to exactly its commitment', () => {
    const a = acc([
      { id: 'R1', statement: 'r', category: 'R', basis: 'b', say: { p: 'sends', from: 'friend', item: 'letter', to: 'own' } },
      { id: 'L1', statement: 'l', category: 'L', basis: 'b', licence: 'takes-up', say: { p: 'holds', who: 'own', what: 'letter' } },
      { id: 'I1', statement: 'i', category: 'I', basis: 'b', say: { p: 'intends', who: 'friend', what: 'kindness' } },
      q(),
      { id: 'P1', statement: 'p', category: 'P', basis: 'b', holder: 'the writer', say: { p: 'alternatives', question: 'U1', options: ['busy', 'forgot'], origin: 'person' } },
    ]);
    const m = mapAccount(a);
    holdsProperties(a, m);
    expect(m.representation.statements.map((s) => [s.id, s.commitment])).toEqual([['R1', 'reported'], ['L1', 'implied'], ['I1', 'inferred'], ['U1', 'unknown'], ['P1', 'possible']]);
  });

  it('never strengthens: an interpreter-only predicate under an established category is left out, not weakened to fit', () => {
    const a = acc([{ id: 'R1', statement: 'r', category: 'R', basis: 'b', say: { p: 'intends', who: 'friend', what: 'kindness' } }]);
    const m = mapAccount(a);
    holdsProperties(a, m);
    expect([m.mapped, m.gaps[0].why]).toEqual([[], expect.stringMatching(/'intends' may only be inferred/)]);
  });

  it('leaves out an implied statement whose licence is missing, unknown, or doesn\'t give its predicate', () => {
    const l = (licence: string | undefined): AccountStatement => ({ id: 'L1', statement: 'l', category: 'L', basis: 'b', ...(licence ? { licence } : {}), say: { p: 'sends', from: 'friend', item: 'letter', to: 'own' } });
    expect(mapAccount(acc([l(undefined)])).gaps[0].why).toBe('implied, but no licensed pattern from the registry is named');
    expect(mapAccount(acc([l('hands')])).gaps[0].why).toBe("implied through 'hands', which isn't in the registry");
    expect(mapAccount(acc([l('takes-up')])).gaps[0].why).toBe('takes-up gives joins or holds, not sends');
  });

  it('doesn\'t attribute possibilities the contract can\'t: a third person\'s set is left out, not given to the writer', () => {
    const set = (holder: string, origin: string): AccountStatement => ({ id: 'P1', statement: 'p', category: 'P', basis: 'b', holder, say: { p: 'alternatives', question: 'U1', options: ['busy', 'forgot'], origin } });
    const rana = mapAccount(acc([q(), set('Rana', 'person')]));
    expect([rana.mapped.map((x) => x.to), rana.gaps]).toEqual([['U1'], [{ id: 'P1', why: "the contract can't say these are Rana's possibilities: its sets come only from the person telling, the source, or reviewed content" }]]);
    expect(mapAccount(acc([q(), set('the writer', 'content')])).gaps[0].why).toMatch(/marked as offered by reviewed content, but its holder is "the writer"/);
    expect(mapAccount(acc([q(), set('', 'content')])).gaps).toEqual([]);
  });

  it('maps a denial only from a reported statement', () => {
    const d = (category: 'R' | 'I'): AccountStatement => ({ id: 'X1', statement: 'x', category, basis: 'b', denied: true, say: { p: 'sends', from: 'friend', item: 'letter', to: 'own' } });
    expect(mapAccount(acc([d('R')])).representation.statements[0].commitment).toBe('denied');
    expect(mapAccount(acc([d('I')])).gaps[0].why).toBe('only a reported statement can carry a denial');
  });

  it('leaves out, in turn, whatever depends on a statement it left out', () => {
    const a = acc([
      { id: 'U1', statement: 'Whether', category: 'U', basis: 'b', say: { p: 'question', about: 'friend', asks: 'state' } },
      { id: 'P1', statement: 'p', category: 'P', basis: 'b', say: { p: 'alternatives', question: 'U1', options: ['busy', 'forgot'], origin: 'content' } },
      { id: 'R1', statement: 'r', category: 'R', basis: 'b', say: { p: 'sends', from: 'friend', item: 'letter', to: 'own' } },
    ]);
    const m = mapAccount(a);
    holdsProperties(a, m);
    expect([m.mapped.map((x) => x.to), m.gaps.map((g) => g.id)]).toEqual([['R1'], ['U1', 'P1']]);
  });

  it('maps a statement with several forms whole or not at all', () => {
    const a = acc([{ id: 'R1', statement: 'r', category: 'R', basis: 'b', say: [{ p: 'holds', who: 'own', what: 'letter' }, { p: 'holds', who: 'own', what: 'parcel' }] }]);
    const m = mapAccount(a);
    holdsProperties(a, m);
    expect([m.mapped, m.gaps.map((g) => g.id)]).toEqual([[], ['R1']]);
  });

  it('refuses an account whose elements or ids the contract can\'t take, and maps nothing from it', () => {
    const twoOwn = mapAccount(acc([q()], { elements: [...elements, { id: 'me', kind: 'presence', own: true }] }));
    expect([twoOwn.mapped, twoOwn.refused]).toEqual([[], [expect.stringMatching(/more than one own presence/)]]);
    expect(mapAccount(acc([q(), q()])).refused).toEqual(["statement 'U1' is in the account more than once"]);
    expect(mapAccount(acc([{ ...q(), id: 'friend' }])).refused).toContain("'friend' is both an element and a statement");
  });

  it('passes the flags on, gives the same result for the same input, and never changes its input', () => {
    const a = acc([q()], { flags: ['T U1: a test flag'] });
    const before = JSON.stringify(a);
    const m = mapAccount(a);
    expect(m.flags).toEqual(['T U1: a test flag']);
    expect(mapAccount(a)).toEqual(m);
    expect(JSON.stringify(a)).toBe(before);
  });

  it('holds its properties when any reviewed case\'s categories are changed (generated variants)', () => {
    const cats = ['R', 'L', 'I', 'P', 'U'] as const;
    for (const a of MAPPING_CASES)
      for (const s of a.statements)
        for (const c of cats) {
          const v: ReviewedAccount = { ...a, statements: a.statements.map((x) => (x.id === s.id ? { ...x, category: c } : x)) };
          holdsProperties(v, mapAccount(v));
        }
  });
});

describe('Track A, A3 step 2: mapping the three reviewed accounts with phases', () => {
  const byId = new Map(MAPPING_TIME_CASES.map((a) => [a.id, mapAccount(a)]));
  const gapsOf = (id: string) => Object.fromEntries(byId.get(id)!.gaps.map((g) => [g.id, g.why]));
  const UNSTATED = "its time isn't stated: in an account with phases, a statement names its phases or is marked throughout";

  it('holds every property on each, and refuses none', () => {
    for (const a of MAPPING_TIME_CASES) {
      expect(byId.get(a.id)!.refused, a.id).toEqual([]);
      holdsProperties(a, byId.get(a.id)!);
    }
  });

  it('phases only what pass A phased: E-3’s R2 and R3, "after"', () => {
    const phased = MAPPING_TIME_CASES.flatMap((a) => a.statements.filter((s) => s.phases).map((s) => `${a.id} ${s.id} ${s.phases!.join(',')}`));
    expect(phased).toEqual(['E-3 R2 after', 'E-3 R3 after']);
    expect(MAPPING_TIME_CASES.flatMap((a) => a.statements.filter((s) => s.throughout))).toEqual([]);
  });

  it('E-3: won’t let "five slices" hold "after" by default, and can’t name three of the five', () => {
    expect(byId.get('E-3')!.mapped).toEqual([]);
    const g = gapsOf('E-3');
    expect(g['R1']).toBe(UNSTATED);
    expect(g['R2']).toMatch(/absent\.what must name an element \(has 'slice × 3'\)/);
    expect(g['R3']).toMatch(/unknown predicate 'present'/);
    expect(g['I1']).toBe('no predicate form: the account gives none');
  });

  it('E-7: leaves the order and the inferred causes out, since pass A gave them no phase', () => {
    expect(byId.get('E-7')!.mapped).toEqual([]);
    const g = gapsOf('E-7');
    expect([g['R4'], g['I1']]).toEqual([UNSTATED, UNSTATED]);
    expect([g['R1'], g['R2'], g['R3']]).toEqual(Array(3).fill('no predicate form: the account gives none'));
  });

  it('P-CS3-1: draws nothing of the note or the meeting after class without its time', () => {
    expect(byId.get('P-CS3-1')!.mapped).toEqual([]);
    const g = gapsOf('P-CS3-1');
    for (const id of ['R1', 'R2', 'U1', 'P']) expect(g[id], id).toBe(UNSTATED);
    for (const id of ['L1', 'I1', 'I2', 'U2']) expect(g[id], id).toBe('no predicate form: the account gives none');
  });

  it('never lets a statement hold in every phase unsaid when it loses its phases, and holds its properties when it is marked throughout (generated variants)', () => {
    for (const a of [...MAPPING_TIME_CASES, ...MAPPING_CASES.map((c) => ({ ...c, time: { phases: ['first', 'second'] } }))])
      for (const s of a.statements) {
        const lost: ReviewedAccount = { ...a, statements: a.statements.map((x) => (x.id === s.id ? { ...x, phases: undefined, throughout: undefined } : x)) };
        const m = mapAccount(lost);
        holdsProperties(lost, m);
        expect(m.mapped.some((x) => x.from === s.id), `${a.id} ${s.id}`).toBe(false);
        const marked: ReviewedAccount = { ...a, statements: a.statements.map((x) => (x.id === s.id ? { ...x, phases: undefined, throughout: true } : x)) };
        holdsProperties(marked, mapAccount(marked));
      }
  });
});

describe('Track A, A3 step 2: time rules (offline fixtures, written for these tests)', () => {
  const elements = [
    { id: 'giver', kind: 'presence' as const },
    { id: 'taker', kind: 'presence' as const },
    { id: 'cup', kind: 'object' as const },
    { id: 'shelf', kind: 'place' as const },
  ];
  const time = { phases: ['handed', 'put down'] };
  const acc = (statements: AccountStatement[], extra: Partial<ReviewedAccount> = {}): ReviewedAccount => ({ id: 'T', text: 'A test text.', source: 'a test fixture', elements, time, statements, ...extra });
  const holds = (more: Partial<AccountStatement> = {}): AccountStatement => ({ id: 'L1', statement: 'The taker held the cup', category: 'L', basis: 'b', licence: 'takes-up', say: { p: 'holds', who: 'taker', what: 'cup' }, ...more });

  it('keeps a held thing in the phase named, and only there: a handover is not "is holding"', () => {
    const a = acc([
      { id: 'R1', statement: 'The giver handed the taker the cup', category: 'R', basis: 'b', say: [{ p: 'sends', from: 'giver', item: 'cup', to: 'taker' }, { p: 'receives', who: 'taker', item: 'cup' }], phases: ['handed'] },
      holds({ phases: ['handed'] }),
      { id: 'R2', statement: 'The taker put the cup on the shelf', category: 'R', basis: 'b', say: { p: 'located-in', what: 'cup', place: 'shelf' }, phases: ['put down'] },
    ]);
    const m = mapAccount(a);
    holdsProperties(a, m);
    expect(m.representation.statements.map((s) => [s.id, s.say.p, s.phases])).toEqual([
      ['R1.1', 'sends', ['handed']],
      ['R1.2', 'receives', ['handed']],
      ['L1', 'holds', ['handed']],
      ['R2', 'located-in', ['put down']],
    ]);
  });

  it('leaves out a held thing whose time isn’t stated, rather than let it hold throughout', () => {
    const m = mapAccount(acc([holds()]));
    expect([m.mapped, m.gaps]).toEqual([[], [{ id: 'L1', why: "its time isn't stated: in an account with phases, a statement names its phases or is marked throughout" }]]);
  });

  it('maps "throughout" as every phase, only when said', () => {
    const m = mapAccount(acc([holds({ throughout: true })]));
    expect(m.representation.statements[0].phases).toBeUndefined();
    expect(m.mapped).toEqual([{ from: 'L1', to: 'L1' }]);
  });

  it('leaves out a statement whose phases are undeclared, or that names phases and throughout, or names phases in an account with none', () => {
    expect(mapAccount(acc([holds({ phases: ['later'] })])).gaps[0].why).toBe("names phases the account doesn't declare: later");
    expect(mapAccount(acc([holds({ phases: ['handed'], throughout: true })])).gaps[0].why).toBe('names its phases and is also marked throughout');
    expect(mapAccount(acc([holds({ phases: ['handed'] })], { time: undefined })).gaps[0].why).toBe('names phases (handed), but the account declares none');
  });

  it('gives every reason the account’s own rules find, together', () => {
    expect(mapAccount(acc([holds({ licence: undefined })])).gaps[0].why).toBe("its time isn't stated: in an account with phases, a statement names its phases or is marked throughout; implied, but no licensed pattern from the registry is named");
  });

  it('refuses an account that declares no phases, or a phase twice', () => {
    expect(mapAccount(acc([holds({ throughout: true })], { time: { phases: [] } })).refused).toEqual(['declares time with no phases']);
    expect(mapAccount(acc([holds({ throughout: true })], { time: { phases: ['handed', 'handed'] } })).refused).toEqual(["declares the phase 'handed' more than once"]);
  });

  it('copies "repeats" only when the account says so, and a statement’s phases as given', () => {
    const a = acc([holds({ phases: ['put down', 'handed'] })], { time: { phases: ['handed', 'put down'], repeats: true } });
    const m = mapAccount(a);
    holdsProperties(a, m);
    expect([m.representation.time, m.representation.statements[0].phases]).toEqual([{ phases: ['handed', 'put down'], repeats: true }, ['put down', 'handed']]);
    expect(mapAccount(acc([holds({ throughout: true })])).representation.time).toEqual({ phases: ['handed', 'put down'] });
  });
});
