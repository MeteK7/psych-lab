import type { StudyCase } from './cases';

/**
 * STUDY CODE, revision 6, step 4: three unseen cases written blind, by an agent that saw only
 * representation-v0.md (v0.2), never the rules' code, the corpus or earlier cases. Not edited after writing.
 */
export const U5: StudyCase = {
  id: 'U5',
  domain: 'psychology',
  source: 'Revision 6: written blind (psychology)',
  text: "At the supermarket checkout I realised I'd left my wallet in the car. It felt embarrassing, and I still don't know whether the cashier minded waiting.",
  rep: {
    v: 1,
    id: 'U5',
    elements: [
      { id: 'me', kind: 'presence', salience: 'primary', own: true },
      { id: 'checkout', kind: 'place' },
      { id: 'wallet', kind: 'object' },
      { id: 'car', kind: 'place', salience: 'secondary' },
      { id: 'cashier', kind: 'presence', salience: 'secondary' },
    ],
    statements: [
      {
        id: 's1',
        say: { p: 'located-in', what: 'me', place: 'checkout' },
        commitment: 'reported',
        phases: ['checkout'],
        basis: '“At the supermarket checkout I realised”',
      },
      {
        id: 's2',
        say: { p: 'located-in', what: 'wallet', place: 'car' },
        commitment: 'reported',
        phases: ['checkout'],
        basis: '“I\'d left my wallet in the car”',
      },
      {
        id: 's3',
        say: { p: 'apart', a: 'me', b: 'wallet' },
        commitment: 'inferred',
        phases: ['checkout'],
        basis: 'Follows from s1 and s2 only with the world knowledge that the checkout is not in the car; no licensed pattern covers it',
      },
      {
        id: 's4',
        say: { p: 'feels', who: 'me', charge: 0.6 },
        commitment: 'implied',
        phases: ['checkout'],
        basis: 'Licensed pattern “it felt …”: “It felt embarrassing”, attributed to the writer. The text gives no amount; 0.6 is the writer of this case\'s setting, not the text\'s',
      },
      {
        id: 's5',
        say: { p: 'waiting', what: 'cashier', for: 'me' },
        commitment: 'inferred',
        phases: ['checkout'],
        basis: '“whether the cashier minded waiting” presupposes the cashier waited, and for the writer; presupposition is not a licensed pattern',
      },
      {
        id: 's6',
        say: { p: 'question', about: 'cashier', asks: 'whether' },
        commitment: 'unknown',
        phases: ['now'],
        basis: '“I still don\'t know whether the cashier minded waiting”',
      },
    ],
    time: { phases: ['checkout', 'now'] },
    facets: {
      space: { setting: 'reported', place: 'shop', viewpoints: ['own', 'across'] },
      field: { quality: 'agitation', source: 's4', evolves: false },
    },
  },
  words: {
    me: 'I',
    checkout: 'checkout',
    wallet: 'wallet',
    car: 'car',
    cashier: 'cashier',
  },
  theme: 'cognitive',
};

export const U6: StudyCase = {
  id: 'U6',
  domain: 'education',
  source: 'Revision 6: written blind (education)',
  text: 'Volcanoes form when molten rock, called magma, rises from deep inside the Earth and escapes through a crack in the crust. Scientists still cannot predict exactly when a volcano will erupt.',
  rep: {
    v: 1,
    id: 'U6',
    elements: [
      { id: 'magma', kind: 'object', salience: 'primary' },
      { id: 'depths', kind: 'place' },
      { id: 'crust', kind: 'place' },
      { id: 'crack', kind: 'place' },
      { id: 'volcano', kind: 'object' },
    ],
    statements: [
      {
        id: 's1',
        say: { p: 'located-in', what: 'magma', place: 'depths' },
        commitment: 'reported',
        phases: ['rise'],
        basis: '“molten rock, called magma, rises from deep inside the Earth”',
      },
      {
        id: 's2',
        say: { p: 'flows', what: 'magma', from: 'depths', to: 'crack' },
        commitment: 'reported',
        phases: ['rise', 'escape'],
        basis: '“rises from deep inside the Earth and escapes through a crack in the crust”',
      },
      {
        id: 's3',
        say: { p: 'part-of', part: 'crack', whole: 'crust' },
        commitment: 'reported',
        basis: '“a crack in the crust”',
      },
      {
        id: 's4',
        say: { p: 'depends-on', what: 'volcano', on: 'magma' },
        commitment: 'reported',
        phases: ['escape'],
        basis: '“Volcanoes form when molten rock … rises … and escapes”: the text asserts the condition under which volcanoes form',
      },
      {
        id: 's5',
        say: { p: 'above', a: 'crust', b: 'depths' },
        commitment: 'inferred',
        basis: 'Reading “rises” as upward motion puts the crust above the depths; direction from a verb is not a licensed pattern',
      },
      {
        id: 's6',
        say: { p: 'form', what: 'crack', feature: 'long' },
        commitment: 'implied',
        basis: 'L-form: the noun “a crack” fixes a narrow, drawn-out opening; only that shape, nothing of its size',
      },
      {
        id: 's7',
        say: { p: 'question', about: 'volcano', asks: 'time' },
        commitment: 'unknown',
        basis: '“Scientists still cannot predict exactly when a volcano will erupt”',
      },
    ],
    time: { phases: ['rise', 'escape'] },
    facets: {
      space: { setting: 'reported', place: 'ground', viewpoints: ['side'] },
      field: { quality: 'agitation', source: 's2', evolves: true },
    },
  },
  words: {
    magma: 'magma',
    depths: 'depths',
    crust: 'crust',
    crack: 'crack',
    volcano: 'volcano',
  },
  theme: 'action',
};

export const U7: StudyCase = {
  id: 'U7',
  domain: 'project management',
  source: 'Revision 6: written blind (project management)',
  text: "The network cabling in the new office isn't finished, and our move can't start until it is. We could push the move back a month or start with a temporary connection, and we haven't decided which.",
  rep: {
    v: 1,
    id: 'U7',
    elements: [
      { id: 'move', kind: 'process', salience: 'primary' },
      { id: 'cabling', kind: 'object' },
      { id: 'office', kind: 'place' },
    ],
    statements: [
      {
        id: 's1',
        say: { p: 'located-in', what: 'cabling', place: 'office' },
        commitment: 'reported',
        basis: '“The network cabling in the new office”',
      },
      {
        id: 's2',
        say: { p: 'depends-on', what: 'move', on: 'cabling' },
        commitment: 'implied',
        basis: 'Licensed pattern “X can\'t start until Y”: “our move can\'t start until it is [finished]”',
      },
      {
        id: 's3',
        say: { p: 'waiting', what: 'move', for: 'cabling' },
        commitment: 'implied',
        phases: ['now'],
        basis: 'Licensed pattern “X can\'t start until Y”: while Y is not there, X is waiting; the text reports Y is not there yet (“isn\'t finished”)',
      },
      {
        id: 's4',
        say: { p: 'question', about: 'move', asks: 'fate' },
        commitment: 'unknown',
        basis: '“we haven\'t decided which”',
      },
      {
        id: 's5',
        say: { p: 'alternatives', question: 's4', options: ['delay', 'temporary'], origin: 'source' },
        commitment: 'possible',
        basis: '“We could push the move back a month or start with a temporary connection”',
      },
    ],
    time: { phases: ['now', 'move'] },
    facets: {
      space: { setting: 'reported', place: 'office', viewpoints: ['outside'] },
      field: { quality: 'clarity', source: 's4', evolves: false },
    },
  },
  words: {
    move: 'move',
    cabling: 'cabling',
    office: 'office',
    delay: 'push back a month',
    temporary: 'temporary connection',
  },
  theme: 'action',
  possibilities: ['push back a month', 'temporary connection'],
};
