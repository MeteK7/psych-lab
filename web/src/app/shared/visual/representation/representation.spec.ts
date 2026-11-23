import { composeScene } from '../composition/compose';
import type { SceneElement } from '../composition/scene';
import { representationProblems } from './check';
import { Representation } from './contract';
import { CheckedFigure, figureProblems } from './invariants';

/** S12 (Stage 3, M1): the contract's check and the invariants, on small hand-made cases. */
const base: Representation = {
  v: 1,
  id: 'r',
  elements: [
    { id: 'a', kind: 'presence', own: true },
    { id: 'b', kind: 'object' },
    { id: 'p', kind: 'place' },
  ],
  statements: [
    { id: 's1', say: { p: 'located-in', what: 'a', place: 'p' }, commitment: 'reported' },
    { id: 's2', say: { p: 'holds', who: 'a', what: 'b' }, commitment: 'implied', phases: ['one'] },
    { id: 'q1', say: { p: 'question', about: 'b', asks: 'cause' }, commitment: 'unknown' },
    { id: 'x1', say: { p: 'alternatives', question: 'q1', options: ['o1', 'o2'], origin: 'source' }, commitment: 'possible' },
    { id: 'i1', say: { p: 'intends', who: 'a', what: 'keep' }, commitment: 'inferred' },
  ],
  time: { phases: ['one', 'two'] },
  facets: { field: { quality: 'clarity', source: 's1', evolves: false } },
};

const with_ = (statements: Representation['statements'], extra: Partial<Representation> = {}): Representation => ({ ...base, ...extra, statements: [...base.statements, ...statements] });

describe('S12 representation: well-formedness (M1)', () => {
  it('takes a well-formed representation', () => {
    expect(representationProblems(base)).toEqual([]);
  });

  it('takes the v1 additions: causation, contrast, belief and denial', () => {
    const rep = with_([
      { id: 'c1', say: { p: 'causes', cause: 's1', effect: 'b' }, commitment: 'reported' },
      { id: 'c2', say: { p: 'contrasts', a: 's1', b: 's2' }, commitment: 'implied' },
      { id: 'd1', say: { p: 'apart', a: 'a', b: 'b' }, commitment: 'denied' },
      { id: 'b1', say: { p: 'believes', who: 'a', statement: 'd1' }, commitment: 'reported' },
    ]);
    expect(representationProblems(rep)).toEqual([]);
  });

  it('names every malformation', () => {
    const rep = {
      ...with_([
        { id: 's1', say: { p: 'complete', what: 'a' }, commitment: 'reported' },
        { id: 'e1', say: { p: 'sends', from: 'a', item: 'nothing', to: 'b' }, commitment: 'reported' },
        { id: 'e2', say: { p: 'notices', who: 'a', whom: 'b' }, commitment: 'reported' },
        { id: 'e3', say: { p: 'alternatives', question: 's2', options: ['only'], origin: 'source' }, commitment: 'possible' },
        { id: 'e4', say: { p: 'complete', what: 'a' }, commitment: 'reported', phases: ['three'] },
        { id: 'e5', say: { p: 'feels', who: 'a', charge: 3 }, commitment: 'reported' },
        { id: 'e6', say: { p: 'contrasts', a: 's1', b: 'b' }, commitment: 'reported' },
      ]),
      elements: [...base.elements, { id: 'c', kind: 'presence' as const, own: true }],
    };
    const problems = representationProblems(rep).join('\n');
    for (const expected of [
      "statement 's1' is declared more than once",
      'more than one own presence',
      "sends.item must name an element (has 'nothing')",
      "'notices' may only be inferred",
      'must list two or more option keys',
      'alternatives.question must name a question',
      "phase 'three' isn't among the time phases",
      'feels.charge must be between 0 and 1',
      "contrasts.b must name a statement (has 'b')",
    ])
      expect(problems).toContain(expected);
  });
});

describe('S12 representation: the invariants (M1)', () => {
  const figureOf = (elements: [SceneElement, string[]][], coverage: CheckedFigure['coverage']): CheckedFigure => ({
    moments: [0, 1],
    draw: () => ({
      composed: composeScene({ id: 'f', version: 1, theme: 'action', size: { width: 200, height: 100 }, alt: 'A figure.', layers: [{ id: 'l', plane: 'subject', elements: elements.map(([e]) => e) }] }, {}),
      cites: Object.fromEntries(elements.map(([e, c]) => [e.id, c])),
    }),
    coverage,
  });
  const mark = (id: string, style: object = { role: 'subject' }): SceneElement => ({ kind: 'shape', id, geometry: { type: 'circle', cx: 50, cy: 50, r: 10 }, style, purpose: { serves: ['concept'], why: 'A mark.' } }) as SceneElement;
  const full = { shown: [{ id: 's1', how: 'a mark' }, { id: 's2', how: 'a mark' }], notShown: [{ id: 'q1', why: 'open' }, { id: 'x1', why: 'listed beside' }] };

  it('passes a figure that keeps them', () => {
    expect(figureProblems(figureOf([[mark('m1'), ['s1', 's2']], [mark('g', { role: 'ground' }), ['base:ground']]], full), base)).toEqual([]);
  });

  it('catches an inference drawn, an element citing nothing, and a possibility drawn as established', () => {
    const problems = figureProblems(figureOf([[mark('m1'), ['i1']], [mark('m2'), []], [mark('m3'), ['x1']]], full), base).join('\n');
    expect(problems).toContain("element 'm1' draws an inference ('i1')");
    expect(problems).toContain("element 'm2' cites nothing");
    expect(problems).toContain("element 'm3' draws a possibility as established");
    // In the possible register it is fine.
    expect(figureProblems(figureOf([[mark('m3', { role: 'context', dash: 'tentative' }), ['x1']]], full), base)).toEqual([]);
  });

  it('catches denial drawn, and believed content drawn as fact (v1 has no register for either)', () => {
    const rep = with_([
      { id: 'd1', say: { p: 'apart', a: 'a', b: 'b' }, commitment: 'denied' },
      { id: 'b1', say: { p: 'believes', who: 'a', statement: 's2' }, commitment: 'reported' },
    ]);
    const cov = { shown: [...full.shown, { id: 'b1', how: 'a mark' }], notShown: [...full.notShown, { id: 'd1', why: 'no register for denial yet' }] };
    const problems = figureProblems(figureOf([[mark('m1'), ['d1']], [mark('m2'), ['s2']]], cov), rep).join('\n');
    expect(problems).toContain("draws a denied statement ('d1')");
    expect(problems).toContain("draws believed content ('s2') as fact");
  });

  it('catches incomplete or wrong coverage, and a figure that draws differently twice', () => {
    expect(figureProblems(figureOf([[mark('m1'), ['s1']]], { shown: [{ id: 's1', how: 'x' }, { id: 'i1', how: 'x' }], notShown: [] }), base).join('\n')).toMatch(
      /'s2' is neither shown nor declared not shown[\s\S]*lists 'i1', which is inferred/,
    );
    let n = 0;
    const unstable: CheckedFigure = { ...figureOf([[mark('m1'), ['s1', 's2']]], full), draw: () => ({ ...figureOf([[mark(`m${n++}`), ['s1', 's2']]], full).draw(0) }) };
    expect(figureProblems(unstable, base).join('\n')).toContain('drawing the same moment twice gives two figures');
  });
});
