import type { StudyCase } from './cases';

/**
 * STUDY CODE, revision 5, step 4: three unseen cases written blind, by an agent that saw only
 * representation-v0.md (v0.2), never the rules' code or the corpus. Not edited after writing.
 */
export const U2: StudyCase = {
  id: 'U2',
  domain: 'psychology',
  source: 'Pass C, revision 5: written blind (psychology)',
  text:
    "I sat in the dentist's waiting room with my heart racing, even though it was only a check-up. " +
    "Maybe it's the sound of the drill, maybe it's a bad visit when I was a child; I honestly don't know.",
  rep: {
    id: 'U2',
    elements: [
      { id: 'i', kind: 'presence', salience: 'primary', own: true },
      { id: 'room', kind: 'place', salience: 'secondary' },
      { id: 'checkup', kind: 'process', salience: 'secondary' },
    ],
    statements: [
      {
        id: 's1',
        say: { p: 'located-in', what: 'i', place: 'room' },
        commitment: 'reported',
        phases: ['waiting'],
        basis: '“I sat in the dentist’s waiting room”',
      },
      {
        id: 's2',
        say: { p: 'feels', who: 'i', charge: 0.7 },
        commitment: 'reported',
        phases: ['waiting'],
        basis:
          '“with my heart racing”: the person reports the feeling; the charge value 0.7 is a magnitude reading of “racing”, not a span',
      },
      {
        id: 's3',
        say: { p: 'question', about: 'checkup', asks: 'cause' },
        commitment: 'unknown',
        basis: '“I honestly don’t know”, about why the check-up brings this on',
      },
      {
        id: 's4',
        say: { p: 'alternatives', question: 's3', options: ['drill', 'childhood'], origin: 'person' },
        commitment: 'possible',
        basis:
          '“Maybe it’s the sound of the drill, maybe it’s a bad visit when I was a child”: two options offered by the person, neither preferred',
      },
      {
        id: 's5',
        say: { p: 'waiting', what: 'i', for: 'checkup' },
        commitment: 'inferred',
        phases: ['waiting'],
        basis:
          'Inferred from world knowledge: sitting in a waiting room before a check-up suggests waiting for it; the text never says so and no licensed pattern covers “waiting room”',
      },
    ],
    time: { phases: ['waiting'] },
    facets: {
      space: { setting: 'reported', place: 'room', viewpoints: ['own', 'within'] },
      field: { quality: 'agitation', source: 's2', evolves: false },
    },
  },
  words: {
    i: 'I',
    room: "dentist's waiting room",
    checkup: 'check-up',
    drill: 'the sound of the drill',
    childhood: 'a bad visit when I was a child',
  },
  theme: 'regulation',
  possibilities: ['the sound of the drill', 'a bad visit when I was a child'],
};

export const U3: StudyCase = {
  id: 'U3',
  domain: 'education',
  source: 'Pass C, revision 5: written blind (education)',
  text:
    'A river starts in the hills and flows down to the sea, carrying sand and stones along with it. ' +
    'Over many years it can change its course, and nobody can say exactly where it will run next.',
  rep: {
    id: 'U3',
    elements: [
      { id: 'river', kind: 'object', salience: 'primary' },
      { id: 'hills', kind: 'place', salience: 'secondary' },
      { id: 'sea', kind: 'place', salience: 'secondary' },
      { id: 'sand', kind: 'object', salience: 'secondary' },
      { id: 'stones', kind: 'object', salience: 'secondary' },
    ],
    statements: [
      {
        id: 'e1',
        say: { p: 'flows', what: 'river', from: 'hills', to: 'sea' },
        commitment: 'reported',
        phases: ['now'],
        basis: '“A river starts in the hills and flows down to the sea”',
      },
      {
        id: 'e2',
        say: { p: 'displaced', what: 'sand', by: 'river' },
        commitment: 'reported',
        phases: ['now'],
        basis: '“carrying sand and stones along with it”',
      },
      {
        id: 'e3',
        say: { p: 'displaced', what: 'stones', by: 'river' },
        commitment: 'reported',
        phases: ['now'],
        basis: '“carrying sand and stones along with it”',
      },
      {
        id: 'e4',
        say: { p: 'form', what: 'hills', feature: 'slope' },
        commitment: 'implied',
        basis: 'L-form: the noun “hills” fixes a sloping shape; nothing about size or material',
      },
      {
        id: 'e5',
        say: { p: 'above', a: 'hills', b: 'sea' },
        commitment: 'inferred',
        basis:
          'Inferred from “flows down”: the hills being higher than the sea follows from world knowledge of downhill flow; no licensed pattern covers “down”',
      },
      {
        id: 'e6',
        say: { p: 'question', about: 'river', asks: 'motion' },
        commitment: 'unknown',
        phases: ['years-on'],
        basis: '“nobody can say exactly where it will run next”',
      },
    ],
    time: { phases: ['now', 'years-on'] },
    facets: {
      space: { setting: 'reported', place: 'land', viewpoints: ['side', 'above'] },
      field: { quality: 'density', source: 'e2', evolves: false },
    },
  },
  words: {
    river: 'river',
    hills: 'hills',
    sea: 'sea',
    sand: 'sand',
    stones: 'stones',
  },
  theme: 'cognitive',
};

export const U4: StudyCase = {
  id: 'U4',
  domain: 'project management',
  source: 'Pass C, revision 5: written blind (project management)',
  text:
    'The first phase of the stock count, covering the main warehouse, is complete. ' +
    'The second phase, at the overflow site, needs two people from the sales team, and it is not yet clear whether they can be released for it.',
  rep: {
    id: 'U4',
    elements: [
      { id: 'count', kind: 'process', salience: 'secondary' },
      { id: 'phase1', kind: 'process', salience: 'equal' },
      { id: 'phase2', kind: 'process', salience: 'primary' },
      { id: 'warehouse', kind: 'place', salience: 'secondary' },
      { id: 'overflow', kind: 'place', salience: 'secondary' },
      { id: 'people', kind: 'presence', salience: 'primary', count: 2 },
      { id: 'sales', kind: 'presence', salience: 'secondary', count: 'several' },
    ],
    statements: [
      {
        id: 'p1',
        say: { p: 'part-of', part: 'phase1', whole: 'count' },
        commitment: 'reported',
        basis: '“The first phase of the stock count”',
      },
      {
        id: 'p2',
        say: { p: 'part-of', part: 'phase2', whole: 'count' },
        commitment: 'reported',
        basis: '“The second phase” (of the stock count, continuing the first sentence)',
      },
      {
        id: 'p3',
        say: { p: 'located-in', what: 'phase1', place: 'warehouse' },
        commitment: 'reported',
        phases: ['first'],
        basis: '“covering the main warehouse”',
      },
      {
        id: 'p4',
        say: { p: 'complete', what: 'phase1' },
        commitment: 'implied',
        phases: ['first'],
        basis: '“X is finished / done” pattern: “The first phase … is complete”',
      },
      {
        id: 'p5',
        say: { p: 'located-in', what: 'phase2', place: 'overflow' },
        commitment: 'reported',
        phases: ['second'],
        basis: '“The second phase, at the overflow site”',
      },
      {
        id: 'p6',
        say: { p: 'depends-on', what: 'phase2', on: 'people' },
        commitment: 'reported',
        phases: ['second'],
        basis: '“needs two people from the sales team”: the plan states the need',
      },
      {
        id: 'p7',
        say: { p: 'part-of', part: 'people', whole: 'sales' },
        commitment: 'reported',
        basis: '“two people from the sales team”',
      },
      {
        id: 'p8',
        say: { p: 'question', about: 'people', asks: 'whether' },
        commitment: 'unknown',
        phases: ['second'],
        basis: '“it is not yet clear whether they can be released for it”',
      },
      {
        id: 'p9',
        say: { p: 'precedes', a: 'phase1', b: 'phase2' },
        commitment: 'inferred',
        basis:
          'Inferred from the ordinals “first” and “second”: numbered phases usually run in that order, but the text does not say the second follows the first, and no licensed pattern covers ordinals',
      },
      {
        id: 'p10',
        say: { p: 'waiting', what: 'phase2', for: 'people' },
        commitment: 'inferred',
        phases: ['second'],
        basis:
          'Inferred: “needs” plus an open “whether” suggests the second phase is held until the people are released; the licensed waiting pattern is only “X can’t start until Y”, which the text does not use',
      },
    ],
    time: { phases: ['first', 'second'] },
    facets: {
      space: { setting: 'reported', place: 'warehouse', viewpoints: ['above', 'side'] },
      field: { quality: 'clarity', source: 'p8', evolves: false },
    },
  },
  words: {
    count: 'stock count',
    phase1: 'first phase',
    phase2: 'second phase',
    warehouse: 'main warehouse',
    overflow: 'overflow site',
    people: 'two people',
    sales: 'sales team',
  },
  theme: 'action',
};
