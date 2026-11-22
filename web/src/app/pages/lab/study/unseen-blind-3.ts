import type { StudyCase } from './cases';

/**
 * STUDY CODE, revision 7, step 4: three unseen cases written blind, by an agent that saw only
 * representation-v0.md (v0.2), never the rules' code, the corpus or earlier cases. Not edited after writing.
 */
export const U8: StudyCase = {
  id: 'U8',
  domain: 'psychology',
  source: 'Revision 7: written blind (psychology)',
  text:
    'I went swimming in the lake before breakfast. The water was colder than I expected, and it felt like my whole body woke up at once; I’m not sure why I waited so long to try it.',
  rep: {
    id: 'U8',
    elements: [
      { id: 'me', kind: 'presence', salience: 'primary', own: true },
      { id: 'lake', kind: 'place' },
      { id: 'water', kind: 'object' },
      { id: 'expectation', kind: 'quality', salience: 'secondary' },
      { id: 'body', kind: 'object', salience: 'secondary' },
      { id: 'swim', kind: 'process' },
      { id: 'breakfast', kind: 'process', salience: 'secondary' },
      { id: 'delay', kind: 'quantity', salience: 'secondary' },
    ],
    statements: [
      {
        id: 's1',
        say: { p: 'located-in', what: 'me', place: 'lake' },
        commitment: 'reported',
        phases: ['swim'],
        basis: '“I went swimming in the lake”',
      },
      {
        id: 's2',
        say: { p: 'precedes', a: 'swim', b: 'breakfast' },
        commitment: 'reported',
        basis: '“before breakfast”',
      },
      {
        id: 's3',
        say: { p: 'exceeds', a: 'water', b: 'expectation', aspect: 'cold' },
        commitment: 'reported',
        phases: ['swim'],
        basis: '“The water was colder than I expected”',
      },
      {
        id: 's4',
        say: { p: 'expects', who: 'me', what: 'expectation' },
        commitment: 'inferred',
        phases: ['earlier'],
        basis:
          '“than I expected” mentions an expectation, but expects is inferred-only in v0.2, so it can only be proposed, not drawn',
      },
      {
        id: 's5',
        say: { p: 'part-of', part: 'water', whole: 'lake' },
        commitment: 'inferred',
        basis:
          'Reading “the water” as the lake’s water is a bridging reference from world knowledge; no licensed pattern covers it',
      },
      {
        id: 's6',
        say: { p: 'contact', a: 'me', b: 'water' },
        commitment: 'inferred',
        phases: ['swim'],
        basis: 'Swimming means being in the water: world knowledge, not stated',
      },
      {
        id: 's7',
        say: { p: 'part-of', part: 'body', whole: 'me' },
        commitment: 'reported',
        basis: '“my whole body”',
      },
      {
        id: 's8',
        say: { p: 'feels', who: 'me', charge: 0.7 },
        commitment: 'implied',
        phases: ['swim'],
        basis:
          'Licensed pattern “it felt …”: “it felt like my whole body woke up at once”, attributed to the writer. The value 0.7 is the interpreter’s reading of “whole body … at once”; the text gives no number',
      },
      {
        id: 's9',
        say: { p: 'waiting', what: 'me', for: 'swim' },
        commitment: 'reported',
        phases: ['earlier'],
        basis: '“I waited so long to try it”',
      },
      {
        id: 's10',
        say: { p: 'question', about: 'delay', asks: 'cause' },
        commitment: 'unknown',
        basis: '“I’m not sure why I waited so long to try it”',
      },
    ],
    time: { phases: ['earlier', 'swim', 'breakfast'] },
    facets: {
      space: { setting: 'reported', place: 'lake', viewpoints: ['own', 'within'] },
      field: { quality: 'clarity', source: 's8', evolves: true },
    },
  },
  words: {
    me: 'I',
    lake: 'lake',
    water: 'water',
    expectation: 'what I expected',
    body: 'whole body',
    swim: 'swim',
    breakfast: 'breakfast',
    delay: 'waiting so long',
  },
  theme: 'recovery',
};

export const U9: StudyCase = {
  id: 'U9',
  domain: 'education',
  source: 'Revision 7: written blind (education)',
  text:
    'The Moon travels around the Earth about once a month, and the same side of it always faces us. Scientists are still not certain how the Moon first formed.',
  rep: {
    id: 'U9',
    elements: [
      { id: 'moon', kind: 'object', salience: 'primary' },
      { id: 'earth', kind: 'place' },
      { id: 'side', kind: 'object', salience: 'secondary' },
      { id: 'us', kind: 'presence', salience: 'secondary', count: 'many' },
      { id: 'formation', kind: 'process' },
    ],
    statements: [
      {
        id: 's1',
        say: { p: 'cycles', what: 'moon', through: ['earth'] },
        commitment: 'reported',
        phases: ['now'],
        basis:
          '“The Moon travels around the Earth about once a month”: the text asserts a repeated circuit; cycles is the closest predicate, and its period (“once a month”) has no argument in v0.2',
      },
      {
        id: 's2',
        say: { p: 'part-of', part: 'side', whole: 'moon' },
        commitment: 'reported',
        phases: ['now'],
        basis:
          '“the same side of it”. That this side “always faces us” has no predicate in the closed list and is carried only by the viewpoints',
      },
      {
        id: 's3',
        say: { p: 'located-in', what: 'us', place: 'earth' },
        commitment: 'inferred',
        basis: 'Reading “us” as people on the Earth is world knowledge; the text does not say where we are',
      },
      {
        id: 's4',
        say: { p: 'question', about: 'formation', asks: 'cause' },
        commitment: 'unknown',
        phases: ['now'],
        basis:
          '“Scientists are still not certain how the Moon first formed”. The text asks how, not why; cause is the nearest of the allowed asks',
      },
    ],
    time: { phases: ['formation', 'now'] },
    facets: {
      space: { setting: 'reported', place: 'space', viewpoints: ['above', 'across'] },
      dynamics: { pace: 'slow' },
      field: { quality: 'clarity', source: 's4', evolves: false },
    },
  },
  words: {
    moon: 'Moon',
    earth: 'Earth',
    side: 'same side',
    us: 'us',
    formation: 'how the Moon formed',
  },
  theme: 'cognitive',
};

export const U10: StudyCase = {
  id: 'U10',
  domain: 'project management',
  source: 'Revision 7: written blind (project management)',
  text:
    'The staff training programme has already spent most of its budget, and three of its five workshops are still to run. The steering group will decide next month whether to drop a workshop or ask for more funding.',
  rep: {
    id: 'U10',
    elements: [
      { id: 'programme', kind: 'process', salience: 'primary' },
      { id: 'budget', kind: 'quantity' },
      { id: 'spent', kind: 'quantity' },
      { id: 'rest', kind: 'quantity', salience: 'secondary' },
      { id: 'workshops', kind: 'process', count: 5 },
      { id: 'remaining', kind: 'process', count: 3 },
      { id: 'held', kind: 'process', salience: 'secondary', count: 2 },
      { id: 'group', kind: 'presence', salience: 'secondary', count: 'several' },
      { id: 'decision', kind: 'process' },
    ],
    statements: [
      {
        id: 's1',
        say: { p: 'part-of', part: 'budget', whole: 'programme' },
        commitment: 'reported',
        phases: ['now'],
        basis: '“its budget”',
      },
      {
        id: 's2',
        say: { p: 'part-of', part: 'spent', whole: 'budget' },
        commitment: 'reported',
        phases: ['now'],
        basis: '“has already spent most of its budget”',
      },
      {
        id: 's3',
        say: { p: 'exceeds', a: 'spent', b: 'rest', aspect: 'amount' },
        commitment: 'reported',
        phases: ['now'],
        basis: '“most of its budget”: “most” itself says the spent part is larger than what is left',
      },
      {
        id: 's4',
        say: { p: 'part-of', part: 'workshops', whole: 'programme' },
        commitment: 'reported',
        basis: '“its five workshops”',
      },
      {
        id: 's5',
        say: { p: 'part-of', part: 'remaining', whole: 'workshops' },
        commitment: 'reported',
        phases: ['now'],
        basis:
          '“three of its five workshops are still to run”. “Still to run” has no predicate of its own in v0.2; it is carried by the element’s word',
      },
      {
        id: 's6',
        say: { p: 'part-of', part: 'held', whole: 'workshops' },
        commitment: 'inferred',
        basis: 'Five minus three: arithmetic, not stated',
      },
      {
        id: 's7',
        say: { p: 'complete', what: 'held' },
        commitment: 'inferred',
        phases: ['now'],
        basis:
          'That the other two workshops have run is read from “still to run”; the text does not say so, and they could have been dropped or moved',
      },
      {
        id: 's8',
        say: { p: 'exceeds', a: 'remaining', b: 'rest', aspect: 'cost' },
        commitment: 'inferred',
        phases: ['now'],
        basis:
          'That the rest of the budget will not cover the three workshops is read from the choice being considered; the text joins the clauses with “and” and never says the money is short',
      },
      {
        id: 's9',
        say: { p: 'intends', who: 'group', what: 'decision' },
        commitment: 'inferred',
        phases: ['next month'],
        basis:
          '“The steering group will decide next month” is the plan’s commitment, but intends is inferred-only in v0.2',
      },
      {
        id: 's10',
        say: { p: 'depends-on', what: 'remaining', on: 'decision' },
        commitment: 'inferred',
        basis:
          'That the remaining workshops hang on the decision is world knowledge about plans; no “can’t start until” in the text',
      },
      {
        id: 's11',
        say: { p: 'question', about: 'programme', asks: 'whether' },
        commitment: 'unknown',
        phases: ['now'],
        basis: '“will decide next month whether to drop a workshop or ask for more funding”',
      },
      {
        id: 's12',
        say: { p: 'alternatives', question: 's11', options: ['opt-drop', 'opt-fund'], origin: 'source' },
        commitment: 'possible',
        phases: ['now'],
        basis: '“whether to drop a workshop or ask for more funding”: the plan itself names the two options',
      },
    ],
    time: { phases: ['now', 'next month'] },
    facets: {
      space: { setting: 'stand-in', place: 'office', viewpoints: ['above', 'side'] },
      field: { quality: 'density', source: 's3', evolves: false },
    },
  },
  words: {
    programme: 'training programme',
    budget: 'budget',
    spent: 'spent',
    rest: 'what is left',
    workshops: 'workshops',
    remaining: 'workshops still to run',
    held: 'workshops already run',
    group: 'steering group',
    decision: 'decision',
    'opt-drop': 'drop a workshop',
    'opt-fund': 'ask for more funding',
  },
  theme: 'regulation',
  possibilities: ['drop a workshop', 'ask for more funding'],
};
