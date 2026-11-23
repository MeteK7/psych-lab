import { elementsOf } from '../composition/scene';
import { Representation, drawable } from './contract';
import { Registry, dispatch, isRefused, kindOf, listLacks } from './dispatch';
import { DrawContext, ENGINE_IDIOMS, registerGeneral } from './general';
import { FIELD_RULES } from './idioms/field';
import { KINETIC_RULES } from './idioms/kinetic';
import { SPATIAL_RULES } from './idioms/spatial';
import { CheckedFigure, figureProblems } from './invariants';
import { citesOf } from './kit/elements';
import { GENERAL_LISTS } from './patterns/lists';
import { EngineIdiom, Figure, Setting } from './setting';

/**
 * S12 (Stage 3, M3): the engine's general patterns, on small neutral representations. Each draws its
 * own in every idiom, keeping the invariants and accounting only for the kinds its lists name, and
 * refuses a structure it doesn't draw.
 */
const MOVES: Representation = {
  v: 1,
  id: 'moves',
  elements: [
    { id: 'm', kind: 'object', salience: 'primary' },
    { id: 'n', kind: 'object' },
    { id: 'p', kind: 'place' },
    { id: 'q', kind: 'place' },
  ],
  statements: [
    { id: 's1', say: { p: 'flows', what: 'm', from: 'p', to: 'q' }, commitment: 'reported', phases: ['go'] },
    { id: 's2', say: { p: 'contact', a: 'm', b: 'n' }, commitment: 'reported', phases: ['meet'] },
    { id: 's3', say: { p: 'displaced', what: 'n', by: 'm' }, commitment: 'reported', phases: ['after'] },
    { id: 'f1', say: { p: 'form', what: 'm', feature: 'round' }, commitment: 'implied' },
    { id: 'q1', say: { p: 'question', about: 'n', asks: 'fate' }, commitment: 'unknown' },
  ],
  time: { phases: ['go', 'meet', 'after'] },
  facets: { space: { setting: 'reported', place: 'ground', viewpoints: ['front', 'side'] }, dynamics: { pace: 'moderate' }, field: { quality: 'agitation', source: 's2', evolves: true } },
};

const DEPENDS: Representation = {
  v: 1,
  id: 'depends',
  elements: [
    { id: 'w', kind: 'process', salience: 'secondary' },
    { id: 'a', kind: 'process', salience: 'equal' },
    { id: 'b', kind: 'process', salience: 'primary' },
    { id: 'c', kind: 'process', salience: 'secondary' },
    { id: 'p', kind: 'place', salience: 'secondary' },
  ],
  statements: [
    { id: 'd1', say: { p: 'part-of', part: 'a', whole: 'w' }, commitment: 'reported' },
    { id: 'd2', say: { p: 'part-of', part: 'b', whole: 'w' }, commitment: 'reported' },
    { id: 'd3', say: { p: 'located-in', what: 'a', place: 'p' }, commitment: 'reported' },
    { id: 'd4', say: { p: 'complete', what: 'a' }, commitment: 'implied' },
    { id: 'd5', say: { p: 'depends-on', what: 'b', on: 'c' }, commitment: 'reported' },
    { id: 'q1', say: { p: 'question', about: 'c', asks: 'whether' }, commitment: 'unknown' },
  ],
  time: { phases: ['first', 'second'] },
  facets: { space: { setting: 'stand-in', viewpoints: ['across'] }, field: { quality: 'clarity', source: 'd5', evolves: false } },
};

const FELT: Representation = {
  v: 1,
  id: 'felt',
  elements: [
    { id: 'me', kind: 'presence', salience: 'primary', own: true },
    { id: 'p', kind: 'place', salience: 'secondary' },
    { id: 'x', kind: 'process', salience: 'secondary' },
  ],
  statements: [
    { id: 'e1', say: { p: 'located-in', what: 'me', place: 'p' }, commitment: 'reported' },
    { id: 'e2', say: { p: 'feels', who: 'me', charge: 0.6 }, commitment: 'reported' },
    { id: 'q1', say: { p: 'question', about: 'x', asks: 'cause' }, commitment: 'unknown' },
    { id: 'a1', say: { p: 'alternatives', question: 'q1', options: ['o1', 'o2'], origin: 'person' }, commitment: 'possible' },
  ],
  time: { phases: ['then'] },
  facets: { space: { setting: 'reported', place: 'p', viewpoints: ['own', 'across'] }, field: { quality: 'agitation', source: 'e2', evolves: false } },
};

const WORDS: Record<string, string> = { m: 'One', n: 'Two', p: 'Here', q: 'There', w: 'Whole', a: 'First', b: 'Second', c: 'Third', me: 'You', x: 'It', o1: 'One reading', o2: 'Another reading' };

/** A neutral setting. The theme is one the test setup's style pack provides. */
const setting: Setting = {
  theme: 'action',
  words: WORDS,
  scene: (idiom) => ({ id: `engine.test.${idiom}`, seed: `engine-test-${idiom}` }),
  alt: (rep) => `A figure of ${rep.statements.length} statements.`,
};

const TUNING: Record<EngineIdiom, object> = { kinetic: KINETIC_RULES, spatial: SPATIAL_RULES, field: FIELD_RULES };
const context = (idiom: EngineIdiom): DrawContext => ({ setting, tuning: TUNING[idiom], finish: {} });
const registry = registerGeneral(new Registry<DrawContext, Figure>());

/** A figure as the invariants see it: every moment it can show, and each element's citations. */
function checked(f: Figure): CheckedFigure {
  const m = f.motion;
  const moments = m.kind === 'timeline' ? [0, 0.25, 0.5, 0.75, 1] : m.kind === 'viewpoint' ? m.positions.map((_, i) => i) : [0];
  return {
    moments,
    draw(at) {
      const composed = f.compose(at);
      return { composed, cites: Object.fromEntries(elementsOf(composed.scene).map(({ element }) => [element.id, citesOf(element.purpose)])) };
    },
    coverage: f.coverage,
  };
}

/** [pattern, the representation it draws, a statement that makes it refuse]. */
const CASES: [keyof typeof GENERAL_LISTS, Representation, Representation['statements'][number]][] = [
  ['motion', MOVES, { id: 'x1', say: { p: 'flows', what: 'n', from: 'q', to: 'p' }, commitment: 'reported' }],
  ['dependency', DEPENDS, { id: 'x1', say: { p: 'depends-on', what: 'a', on: 'c' }, commitment: 'reported' }],
  ['felt', FELT, { id: 'x1', say: { p: 'feels', who: 'me', charge: 0.2 }, commitment: 'reported' }],
];

describe('S12 general patterns (M3)', () => {
  for (const idiom of ENGINE_IDIOMS)
    for (const [name, rep, extra] of CASES) {
      it(`${idiom} ${name}: draws its own representation, keeping the invariants, within its lists`, () => {
        const d = dispatch(registry, idiom, rep, context(idiom));
        expect(isRefused(d) ? d.refusal : 'drawn').toBe('drawn');
        if (isRefused(d)) return;
        expect(d.choice.pattern).toBe(name);
        expect(d.choice.failed).toEqual([]);
        expect(figureProblems(checked(d.figure), rep)).toEqual([]);
        const lists = GENERAL_LISTS[name];
        for (const s of drawable(rep)) expect(lists.draws.includes(kindOf(s)) || (kindOf(s).startsWith('question:') && lists.draws.includes('question:*')), `${name} accounts for ${kindOf(s)}`).toBe(true);
      });

      it(`${idiom} ${name}: refuses its representation with a second '${extra.say.p}'`, () => {
        const more = { ...rep, statements: [...rep.statements, extra] };
        const p = registry.patternsOf(idiom).find((x) => x.name === name)!;
        expect([...listLacks(more, p.draws, p.single), ...p.lacks(more, context(idiom))].length).toBeGreaterThan(0);
      });
    }
});
