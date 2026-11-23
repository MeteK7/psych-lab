import { Representation, Statement, drawable } from './contract';
import { Dispatchable, Pattern, Registry, dispatch, isRefused, listLacks } from './dispatch';

/** S12 (Stage 3, M2): the dispatch, on small hand-made patterns. */
const rep: Representation = {
  v: 1,
  id: 'r',
  elements: [
    { id: 'a', kind: 'presence', own: true },
    { id: 'b', kind: 'object' },
    { id: 'p', kind: 'place' },
  ],
  statements: [
    { id: 's1', say: { p: 'holds', who: 'a', what: 'b' }, commitment: 'reported' },
    { id: 's2', say: { p: 'located-in', what: 'a', place: 'p' }, commitment: 'reported' },
    { id: 'q1', say: { p: 'question', about: 'b', asks: 'cause' }, commitment: 'unknown' },
    { id: 'i1', say: { p: 'intends', who: 'a', what: 'keep' }, commitment: 'inferred' },
  ],
  time: { phases: ['one'] },
  facets: {},
};

interface Fig extends Dispatchable {
  by: string;
  sub?: string[];
}

/** A pattern that shows `shows` and declares the rest of the drawable statements not shown. */
const pattern = (name: string, shows: string[], more: Partial<Pattern<null, Fig>> = {}): Pattern<null, Fig> => ({
  name,
  idiom: 'test',
  draws: ['holds', 'located-in', 'question:*'],
  lacks: () => [],
  draw: (r) => ({
    by: name,
    coverage: {
      shown: drawable(r).filter((s) => shows.includes(s.id)).map((s) => ({ id: s.id, how: 'a mark' })),
      notShown: drawable(r).filter((s) => !shows.includes(s.id)).map((s) => ({ id: s.id, why: 'not by this one' })),
    },
  }),
  ...more,
});

describe('S12 dispatch: choice (M2)', () => {
  it('chooses the able pattern leaving the fewest established statements undrawn; ties go to the first registered', () => {
    const reg = new Registry<null, Fig>().register(pattern('one', ['s1'])).register(pattern('both', ['s1', 's2'])).register(pattern('both-again', ['s1', 's2']));
    const d = dispatch(reg, 'test', rep, null);
    expect(isRefused(d)).toBe(false);
    if (isRefused(d)) return;
    expect(d.figure.by).toBe('both');
    expect(d.choice).toEqual({ pattern: 'both', undrawn: 0, alsoAble: [{ pattern: 'one', undrawn: 1 }, { pattern: 'both-again', undrawn: 0 }], failed: [] });
  });

  it('reads needs from the lists: a kind it doesn’t draw, and a repeat of a kind it draws once', () => {
    expect(listLacks(rep, ['holds'])).toEqual(["a way to draw 'located-in'", "a way to draw 'question:cause'"]);
    const twice: Representation = { ...rep, statements: [...rep.statements, { id: 's3', say: { p: 'holds', who: 'a', what: 'p' }, commitment: 'implied' }] };
    expect(listLacks(twice, ['holds', 'located-in', 'question:*'], ['holds'])).toEqual(["a single 'holds'"]);
  });

  it('keeps idioms apart, and idioms are open names', () => {
    const reg = new Registry<null, Fig>().register(pattern('here', ['s1', 's2'])).register({ ...pattern('there', ['s1', 's2']), idiom: 'another' });
    const d = dispatch(reg, 'another', rep, null);
    expect(!isRefused(d) && d.choice.pattern).toBe('there');
  });

  it('refuses one registration twice under one name', () => {
    expect(() => new Registry<null, Fig>().register(pattern('x', [])).register(pattern('x', []))).toThrowError(/already registered/);
  });
});

describe('S12 dispatch: refusal and named failure (M2)', () => {
  it('refuses as a result, with every pattern’s unmet needs', () => {
    const reg = new Registry<null, Fig>()
      .register(pattern('narrow', ['s1'], { draws: ['holds'] }))
      .register(pattern('needy', ['s1', 's2'], { lacks: () => ['a field facet'] }));
    const d = dispatch(reg, 'test', rep, null);
    expect(isRefused(d) && d.refusal).toEqual({
      idiom: 'test',
      tried: [
        { pattern: 'narrow', lacks: ["a way to draw 'located-in'", "a way to draw 'question:cause'"] },
        { pattern: 'needy', lacks: ['a field facet'] },
      ],
    });
  });

  it('names a pattern that fails on the case, beside the choice another made', () => {
    const reg = new Registry<null, Fig>()
      .register(pattern('breaks', [], { draw: () => { throw new Error('no second presence'); } }))
      .register(pattern('works', ['s1', 's2']));
    const d = dispatch(reg, 'test', rep, null);
    expect(!isRefused(d) && d.choice.failed).toEqual([{ pattern: 'breaks', reason: 'fails on this case: no second presence' }]);
  });

  it('fails a figure that doesn’t account for its representation (an omission, or an inference listed)', () => {
    const omits = pattern('omits', [], { draw: () => ({ by: 'omits', coverage: { shown: [{ id: 's1', how: 'x' }], notShown: [{ id: 'i1', why: 'x' }] } }) });
    const d = dispatch(new Registry<null, Fig>().register(omits), 'test', rep, null, { compose: false });
    expect(isRefused(d)).toBe(true);
    const lacks = isRefused(d) ? d.refusal.tried[0].lacks[0] : '';
    expect(lacks).toMatch(/^fails on this case: its coverage: .*'s2' is neither shown nor declared not shown/);
    expect(lacks).toContain("'i1', which is inferred");
  });

  it('leaves patterns out on request, for the checks', () => {
    const reg = new Registry<null, Fig>().register(pattern('first', ['s1', 's2'])).register(pattern('second', ['s1']));
    const d = dispatch(reg, 'test', rep, null, { without: ['first'] });
    expect(!isRefused(d) && d.choice.pattern).toBe('second');
  });
});

describe('S12 dispatch: composition (M2)', () => {
  /** No single pattern draws `holds`; a base draws `located-in`, the additions the rest. */
  const single = pattern('placing', ['s2'], { draws: ['located-in', 'question:*'] });
  const domainOf = (r: Representation): Statement[] => r.statements.filter((s) => s.say.p === 'located-in');
  const registry = () =>
    new Registry<null, Fig>()
      .register(single)
      .registerBase({ name: 'empty', idiom: 'test', draws: ['holds'], domain: () => [], lacks: () => [] })
      .registerBase({ name: 'placing', idiom: 'test', draws: ['located-in'], domain: domainOf, lacks: () => [] })
      .registerAdditions('test', {
        adds: ['holds', 'question'],
        draw: (plan, r) => ({
          by: `${plan.base} + ${plan.rest.length}`,
          sub: plan.sub.statements.map((s) => s.id),
          coverage: { shown: drawable(r).map((s) => ({ id: s.id, how: 'drawn' })), notShown: [] },
        }),
      });

  it('composes only when no single pattern is able: the base narrowed to its statements and the inferred, the additions drawing the rest', () => {
    const d = dispatch(registry(), 'test', rep, null);
    expect(isRefused(d)).toBe(false);
    if (isRefused(d)) return;
    expect(d.figure.by).toBe('placing + 2');
    expect(d.figure.sub).toEqual(['s2', 'i1']);
    expect(d.choice).toEqual({ pattern: 'placing', undrawn: 0, alsoAble: [], failed: [], composition: { base: 'placing', added: ['s1', 'q1'] } });
    // With a single pattern able, nothing is composed.
    const reg = registry().register(pattern('everything', ['s1', 's2']));
    const e = dispatch(reg, 'test', rep, null);
    expect(!isRefused(e) && e.choice.pattern).toBe('everything');
  });

  it('says, when composition can’t either, what each base lacked', () => {
    const reg = new Registry<null, Fig>()
      .register(single)
      .registerBase({ name: 'placing', idiom: 'test', draws: ['located-in'], domain: domainOf, lacks: () => [] })
      .registerAdditions('test', { adds: ['question'], draw: () => ({ by: 'x', coverage: { shown: [], notShown: [] } }) });
    const d = dispatch(reg, 'test', rep, null);
    expect(isRefused(d) && d.refusal.tried.at(-1)).toEqual({ pattern: 'composition', lacks: ["as base, placing: an addition for 'holds' (s1)"] });
    const off = dispatch(reg, 'test', rep, null, { compose: false });
    expect(isRefused(off) && off.refusal.tried.map((x) => x.pattern)).toEqual(['placing']);
  });

  it('names a composition that fails while drawing', () => {
    const reg = new Registry<null, Fig>()
      .registerBase({ name: 'placing', idiom: 'test', draws: ['located-in'], domain: domainOf, lacks: () => [] })
      .registerAdditions('test', { adds: ['holds', 'question'], draw: () => { throw new Error('no room'); } });
    const d = dispatch(reg, 'test', rep, null);
    expect(isRefused(d) && d.refusal.tried).toEqual([{ pattern: 'composition', lacks: ['as base, placing: fails on this case: no room'] }]);
  });
});
