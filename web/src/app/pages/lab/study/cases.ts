import { CS_NOT_ENOUGH } from '../../../../content';
import type { ThemeId } from '../../../shared/visual/styling/vocabulary';
import type { Representation, Words } from './representation';

/**
 * STUDY CODE: the four depth cases of the first slice (docs/visual-study/README.md), their
 * representations exactly as written in pass A (corpus-*.md). Inferred statements are kept, so a
 * spec can check that no idiom draws them.
 */
export interface StudyCase {
  id: 'P1' | 'P2' | 'E1' | 'M1';
  domain: 'psychology' | 'education' | 'project management';
  source: string;
  text: string;
  rep: Representation;
  words: Words;
  /** The style pack's one setting the study varies. Education and planning borrow an area theme (PL-3). */
  theme: ThemeId;
  /** Shown under the figure, never in it (C8). */
  possibilities?: readonly string[];
  /** Framing words shown with the figure, when its setting is a stand-in (S1). */
  framing?: string;
}

const noHello = CS_NOT_ENOUGH.situation.scenarios.find((s) => s.id === 'no_hello')!;

const P1: StudyCase = {
  id: 'P1',
  domain: 'psychology',
  source: 'Not enough to go on (CS3): reviewed scenario no_hello',
  text: noHello.text,
  theme: 'cognitive',
  possibilities: noHello.readings.map((r) => r.text),
  framing: 'The drawing isn’t your moment. It’s a stand-in: two people passing, to show what is known and what is open.',
  words: { own: 'You', other: 'Classmate', ...Object.fromEntries(noHello.readings.map((r) => [r.id, r.text])) },
  rep: {
    id: 'P1',
    elements: [
      { id: 'own', kind: 'presence', own: true, salience: 'equal' },
      { id: 'other', kind: 'presence', salience: 'equal' },
    ],
    statements: [
      { id: 's1', say: { p: 'passes', a: 'own', b: 'other' }, commitment: 'implied', basis: '“walks past you”: X walked past Y' },
      { id: 's2', say: { p: 'exchange-absent', kind: 'spoken greeting', from: 'other', to: 'own' }, commitment: 'reported', phases: ['pass'], basis: '“without saying hello”' },
      { id: 'i1', say: { p: 'notices', who: 'other', whom: 'own' }, commitment: 'inferred', basis: 'needed by every reading but “didn’t see me”; not stated' },
      { id: 'i2', say: { p: 'expects', who: 'own', what: 'greeting' }, commitment: 'inferred', basis: 'pragmatic' },
      { id: 'q1', say: { p: 'question', about: 'other', asks: 'attention' }, commitment: 'unknown', basis: 'not stated' },
      { id: 'q2', say: { p: 'question', about: 'own', asks: 'whether' }, commitment: 'unknown', basis: 'whether own greeted: not stated' },
      { id: 'q3', say: { p: 'question', about: 's2', asks: 'cause' }, commitment: 'unknown', basis: 'not stated' },
      { id: 'a1', say: { p: 'alternatives', question: 'q3', options: noHello.readings.map((r) => r.id), origin: 'content' }, commitment: 'possible', basis: 'reviewed readings (cs-not-enough v4)' },
    ],
    time: { phases: ['approach', 'pass', 'apart'] },
    facets: {
      space: { setting: 'stand-in', place: 'open-floor', viewpoints: ['own', 'across'] },
      dynamics: { pace: 'moderate' },
      field: { quality: 'clarity', source: 'q3', evolves: true },
    },
  },
};

const P2: StudyCase = {
  id: 'P2',
  domain: 'psychology',
  source: 'Change the camera angle: written for the study (a message read alone)',
  text: 'I read a short reply from my manager on my phone, alone at home in the evening. It felt cold.',
  theme: 'cognitive',
  framing: 'The drawing isn’t your moment. It’s a stand-in: a room at home, to show where you’re looking from.',
  words: { own: 'You', sender: 'Manager', reply: 'Reply', phone: 'Phone', home: 'Home' },
  rep: {
    id: 'P2',
    elements: [
      { id: 'own', kind: 'presence', own: true, salience: 'primary' },
      { id: 'sender', kind: 'presence', salience: 'secondary' },
      { id: 'reply', kind: 'object' },
      { id: 'phone', kind: 'object' },
      { id: 'home', kind: 'place' },
    ],
    statements: [
      { id: 's1', say: { p: 'sends', from: 'sender', item: 'reply', to: 'own' }, commitment: 'reported', basis: '“a short reply from my manager”' },
      { id: 's2', say: { p: 'receives', who: 'own', item: 'reply' }, commitment: 'reported', basis: '“I read”' },
      { id: 's3', say: { p: 'located-in', what: 'own', place: 'home', alone: true }, commitment: 'reported', basis: '“alone at home in the evening”' },
      { id: 's4', say: { p: 'apart', a: 'own', b: 'sender' }, commitment: 'implied', basis: 'own was alone' },
      { id: 's5', say: { p: 'feels', who: 'own', charge: 0.5 }, commitment: 'reported', basis: '“It felt cold”: attributed; the mapping turns the feeling into charge (G-09)' },
      { id: 's6', say: { p: 'holds', who: 'own', what: 'phone' }, commitment: 'reported', basis: '“on my phone”' },
      { id: 'i1', say: { p: 'intends', who: 'sender', what: 'coldness' }, commitment: 'inferred', basis: 'not stated' },
      { id: 'q1', say: { p: 'question', about: 'sender', asks: 'intent' }, commitment: 'unknown', basis: 'not stated' },
      { id: 'q2', say: { p: 'question', about: 'sender', asks: 'setting' }, commitment: 'unknown', basis: 'not stated' },
    ],
    time: { phases: ['evening'] },
    facets: {
      space: { setting: 'reported', place: 'home', viewpoints: ['own', 'behind', 'across', 'outside'] },
      field: { quality: 'agitation', source: 's5', evolves: false },
    },
  },
};

const E1: StudyCase = {
  id: 'E1',
  domain: 'education',
  source: 'Education: written for the study',
  text: 'The right side of the heart pumps blood to the lungs, where it takes up oxygen. It returns to the left side, which pumps it out to the body and back.',
  theme: 'attention',
  words: { right: 'Right side', lungs: 'Lungs', left: 'Left side', body: 'Body', blood: 'Blood', oxygen: 'Oxygen' },
  rep: {
    id: 'E1',
    elements: [
      { id: 'right', kind: 'place' },
      { id: 'lungs', kind: 'place' },
      { id: 'left', kind: 'place' },
      { id: 'body', kind: 'place' },
      { id: 'blood', kind: 'process', salience: 'primary' },
      { id: 'oxygen', kind: 'object' },
    ],
    statements: [
      { id: 's1', say: { p: 'flows', what: 'blood', from: 'right', to: 'lungs' }, commitment: 'reported', phases: ['to-lungs'], basis: '“pumps blood to the lungs”' },
      { id: 's2', say: { p: 'joins', what: 'oxygen', into: 'blood', at: 'lungs' }, commitment: 'reported', basis: '“where it takes up oxygen”' },
      { id: 's3', say: { p: 'flows', what: 'blood', from: 'lungs', to: 'left' }, commitment: 'reported', phases: ['to-left'], basis: '“It returns to the left side”' },
      { id: 's4', say: { p: 'flows', what: 'blood', from: 'left', to: 'body' }, commitment: 'reported', phases: ['to-body'], basis: '“pumps it out to the body”' },
      { id: 's5', say: { p: 'flows', what: 'blood', from: 'body', to: 'right' }, commitment: 'reported', phases: ['to-right'], basis: '“and back”' },
      { id: 's6', say: { p: 'cycles', what: 'blood', through: ['right', 'lungs', 'left', 'body'] }, commitment: 'implied', basis: '“returns to”, “and back”' },
      { id: 'i1', say: { p: 'releases', what: 'oxygen', at: 'body' }, commitment: 'inferred', basis: 'true, and not in the text' },
      { id: 'q1', say: { p: 'question', about: 'oxygen', asks: 'fate' }, commitment: 'unknown', basis: 'what happens to the oxygen in the body: the text is silent' },
    ],
    time: { phases: ['to-lungs', 'to-left', 'to-body', 'to-right'], repeats: true },
    facets: {
      space: { setting: 'reported', place: 'ground', viewpoints: ['front', 'side'] },
      dynamics: { pace: 'moderate' },
      field: { quality: 'density', source: 's2', evolves: false },
    },
  },
};

const M1: StudyCase = {
  id: 'M1',
  domain: 'project management',
  source: 'Project management: written for the study',
  text: 'Design is finished, so build is next. But build can’t start until the software licence arrives, and procurement hasn’t said when that will be.',
  theme: 'recovery',
  words: { design: 'Design', build: 'Build', licence: 'Licence', procurement: 'Procurement' },
  rep: {
    id: 'M1',
    elements: [
      { id: 'design', kind: 'process' },
      { id: 'build', kind: 'process', salience: 'primary' },
      { id: 'licence', kind: 'object' },
      { id: 'procurement', kind: 'presence', salience: 'secondary' },
    ],
    statements: [
      { id: 's1', say: { p: 'complete', what: 'design' }, commitment: 'reported', basis: '“Design is finished”' },
      { id: 's2', say: { p: 'precedes', a: 'design', b: 'build' }, commitment: 'reported', basis: '“so build is next”' },
      { id: 's3', say: { p: 'depends-on', what: 'build', on: 'licence' }, commitment: 'reported', basis: '“can’t start until the software licence arrives”' },
      { id: 's4', say: { p: 'absent', what: 'licence' }, commitment: 'implied', basis: 'X can’t start until Y arrives' },
      { id: 's5', say: { p: 'waiting', what: 'build', for: 'licence' }, commitment: 'implied', basis: 'X can’t start until Y arrives' },
      { id: 's6', say: { p: 'exchange-absent', kind: 'date', from: 'procurement', to: 'team' }, commitment: 'reported', basis: '“hasn’t said when”' },
      { id: 'i1', say: { p: 'late', what: 'licence' }, commitment: 'inferred', basis: 'not stated' },
      { id: 'q1', say: { p: 'question', about: 'licence', asks: 'time' }, commitment: 'unknown', basis: 'stated as not said' },
    ],
    time: { phases: ['now', 'later'] },
    facets: {
      space: { setting: 'stand-in', place: 'ground', viewpoints: ['within', 'above'] },
      metaphor: { frame: 'path', stations: ['design', 'build'], gate: 'licence' },
      dynamics: { pace: 'slow' },
      field: { quality: 'density', source: 's5', evolves: true },
    },
  },
};

export const CASES: readonly StudyCase[] = [P1, P2, E1, M1];
