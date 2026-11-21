import { CS_NOT_ENOUGH } from '../../../../content';
import type { ThemeId } from '../../../shared/visual/styling/vocabulary';
import type { Representation, Words } from './representation';

/**
 * STUDY CODE: the four depth cases of the first slice (docs/visual-study/README.md), their
 * representations exactly as written in pass A (corpus-*.md). Inferred statements are kept, so a
 * spec can check that no idiom draws them.
 */
export interface StudyCase {
  id: string;
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
      { id: 's1', say: { p: 'passes', a: 'own', b: 'other', mover: 'other' }, commitment: 'implied', basis: '“walks past you”: X walked past Y; X moved, Y is the point of reference' },
      { id: 's2', say: { p: 'exchange-absent', kind: 'spoken greeting', from: 'other', to: 'own' }, commitment: 'reported', phases: ['pass'], basis: '“without saying hello”' },
      { id: 'i1', say: { p: 'notices', who: 'other', whom: 'own' }, commitment: 'inferred', basis: 'needed by every reading but “didn’t see me”; not stated' },
      { id: 'i2', say: { p: 'expects', who: 'own', what: 'greeting' }, commitment: 'inferred', basis: 'pragmatic' },
      { id: 'q1', say: { p: 'question', about: 'other', asks: 'attention' }, commitment: 'unknown', basis: 'not stated' },
      { id: 'q2', say: { p: 'question', about: 'own', asks: 'whether' }, commitment: 'unknown', basis: 'whether own greeted: not stated' },
      { id: 'q3', say: { p: 'question', about: 's2', asks: 'cause' }, commitment: 'unknown', basis: 'not stated' },
      { id: 'q4', say: { p: 'question', about: 'own', asks: 'motion' }, commitment: 'unknown', basis: 'the classmate walked; whether you were walking or standing is not stated' },
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
  words: { right: 'Right side', lungs: 'Lungs', left: 'Left side', body: 'Body', blood: 'Blood', oxygen: 'Oxygen', heart: 'Heart' },
  rep: {
    id: 'E1',
    elements: [
      { id: 'heart', kind: 'place' },
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
      { id: 'p1', say: { p: 'part-of', part: 'right', whole: 'heart' }, commitment: 'implied', basis: '“the right side of the heart”' },
      { id: 'p2', say: { p: 'part-of', part: 'left', whole: 'heart' }, commitment: 'implied', basis: '“the left side” (of the heart, from the first sentence)' },
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

// ── Slice 2 (2026-11-21): the eight further depth cases, as written in pass A ─────────────────────

const scenario = (id: string) => CS_NOT_ENOUGH.situation.scenarios.find((s) => s.id === id)!;
const noReply = scenario('no_reply');
const moved = scenario('meeting_moved');

const P3: StudyCase = {
  id: 'P3',
  domain: 'psychology',
  source: 'Not enough to go on (CS3): reviewed scenario no_reply',
  text: noReply.text,
  theme: 'cognitive',
  possibilities: noReply.readings.map((r) => r.text),
  framing: 'The drawing isn’t your moment. It’s a stand-in: a way between you and a friend, to show what is known and what is open.',
  words: { own: 'You', friend: 'Friend', message: 'Message', reply: 'Reply', ...Object.fromEntries(noReply.readings.map((r) => [r.id, r.text])) },
  rep: {
    id: 'P3',
    elements: [
      { id: 'own', kind: 'presence', own: true, salience: 'equal' },
      { id: 'friend', kind: 'presence', salience: 'equal' },
      { id: 'message', kind: 'object' },
      { id: 'reply', kind: 'object' },
    ],
    statements: [
      { id: 's1', say: { p: 'sends', from: 'own', item: 'message', to: 'friend' }, commitment: 'implied', basis: 'presupposition of “replied to your message”' },
      { id: 's2', say: { p: 'exchange-absent', kind: 'reply', from: 'friend', to: 'own' }, commitment: 'reported', basis: '“hasn’t replied … for a day”' },
      { id: 's3', say: { p: 'waiting', what: 'own', for: 'reply' }, commitment: 'implied', basis: '“hasn’t replied”: a reply is still to come or not' },
      { id: 'i1', say: { p: 'notices', who: 'friend', whom: 'message' }, commitment: 'inferred', basis: 'that the friend read it: not stated' },
      { id: 'q1', say: { p: 'question', about: 'friend', asks: 'attention' }, commitment: 'unknown', basis: 'whether the friend has seen it' },
      { id: 'q2', say: { p: 'question', about: 's2', asks: 'cause' }, commitment: 'unknown', basis: 'not stated' },
      { id: 'q3', say: { p: 'question', about: 'reply', asks: 'time' }, commitment: 'unknown', basis: 'whether and when a reply will come' },
      { id: 'a1', say: { p: 'alternatives', question: 'q2', options: noReply.readings.map((r) => r.id), origin: 'content' }, commitment: 'possible', basis: 'reviewed readings (cs-not-enough v4)' },
    ],
    time: { phases: ['sent', 'a day'] },
    facets: {
      space: { setting: 'stand-in', place: 'ground', viewpoints: ['within', 'above'] },
      metaphor: { frame: 'path', stations: ['own', 'friend'] },
      dynamics: { pace: 'slow' },
      field: { quality: 'clarity', source: 'q2', evolves: true },
    },
  },
};

const P4: StudyCase = {
  id: 'P4',
  domain: 'psychology',
  source: 'Not enough to go on (CS3): reviewed scenario meeting_moved',
  text: moved.text,
  theme: 'cognitive',
  possibilities: moved.readings.map((r) => r.text),
  framing: 'The drawing isn’t your week. It’s a stand-in: a way through time, to show what is known and what is open.',
  words: { own: 'You', manager: 'Manager', meeting: 'Meeting', ...Object.fromEntries(moved.readings.map((r) => [r.id, r.text])) },
  rep: {
    id: 'P4',
    elements: [
      { id: 'own', kind: 'presence', own: true, salience: 'equal' },
      { id: 'manager', kind: 'presence', salience: 'equal' },
      { id: 'meeting', kind: 'process', salience: 'primary' },
    ],
    statements: [
      { id: 's1', say: { p: 'shifts', what: 'meeting', by: 'manager', later: true }, commitment: 'reported', basis: '“moves your weekly meeting”: later is the usual sense; the amount is not stated' },
      { id: 's2', say: { p: 'exchange-absent', kind: 'reason', from: 'manager', to: 'own' }, commitment: 'reported', basis: '“without saying why”' },
      { id: 'i1', say: { p: 'intends', who: 'manager', what: 'something about you' }, commitment: 'inferred', basis: 'the feared and mild readings: not stated' },
      { id: 'q1', say: { p: 'question', about: 's1', asks: 'cause' }, commitment: 'unknown', basis: 'stated as not said' },
      { id: 'a1', say: { p: 'alternatives', question: 'q1', options: moved.readings.map((r) => r.id), origin: 'content' }, commitment: 'possible', basis: 'reviewed readings (cs-not-enough v4)' },
    ],
    time: { phases: ['its slot', 'moved'] },
    facets: {
      space: { setting: 'stand-in', place: 'ground', viewpoints: ['within', 'above'] },
      metaphor: { frame: 'path', stations: ['meeting'] },
      dynamics: { pace: 'moderate' },
      field: { quality: 'clarity', source: 'q1', evolves: true },
    },
  },
};

const P5: StudyCase = {
  id: 'P5',
  domain: 'psychology',
  source: 'Change the camera angle: written for the study (a remark in a meeting)',
  text: 'In the team meeting, when I gave my update, someone made a joke about how long it took, and a few people laughed.',
  theme: 'cognitive',
  framing: 'The drawing isn’t your moment. It’s a stand-in: a meeting room, to show where you’re looking from.',
  words: { own: 'You', joker: 'Someone', team: 'The team' },
  rep: {
    id: 'P5',
    elements: [
      { id: 'own', kind: 'presence', own: true, salience: 'primary' },
      { id: 'joker', kind: 'presence', salience: 'equal' },
      { id: 'team', kind: 'presence', count: 'several' },
      { id: 'room', kind: 'place' },
    ],
    statements: [
      { id: 's1', say: { p: 'located-in', what: 'own', place: 'room' }, commitment: 'reported', basis: '“in the team meeting”' },
      { id: 's2', say: { p: 'sends', from: 'own', item: 'update', to: 'team' }, commitment: 'reported', basis: '“when I gave my update”' },
      { id: 's3', say: { p: 'sends', from: 'joker', item: 'remark', to: 'team' }, commitment: 'reported', basis: '“someone made a joke about how long it took”' },
      { id: 's4', say: { p: 'reacts', who: 'team', to: 's3', kind: 'laughter' }, commitment: 'reported', basis: '“a few people laughed”: a few, not all' },
      { id: 'i1', say: { p: 'intends', who: 'joker', what: 'unkindness' }, commitment: 'inferred', basis: 'not stated' },
      { id: 'i2', say: { p: 'notices', who: 'team', whom: 'own' }, commitment: 'inferred', basis: 'they laughed at you: they laughed; at what is not stated' },
      { id: 'q1', say: { p: 'question', about: 'joker', asks: 'intent' }, commitment: 'unknown', basis: 'not stated' },
      { id: 'q2', say: { p: 'question', about: 'team', asks: 'attention' }, commitment: 'unknown', basis: 'what the others thought' },
    ],
    time: { phases: ['update', 'remark', 'laughter'] },
    facets: {
      space: { setting: 'reported', place: 'meeting-room', viewpoints: ['own', 'behind', 'across', 'above'] },
      dynamics: { pace: 'moderate' },
      field: { quality: 'density', source: 's4', evolves: true },
    },
  },
};

const P6: StudyCase = {
  id: 'P6',
  domain: 'psychology',
  source: 'Change the camera angle: written for the study (a moment in a crowd)',
  text: 'On a crowded train, I stumbled when it braked and grabbed a stranger’s arm. I apologised, and they said nothing.',
  theme: 'cognitive',
  framing: 'The drawing isn’t your moment. It’s a stand-in: a train carriage, to show where you’re looking from.',
  words: { own: 'You', stranger: 'Stranger', crowd: 'Others', train: 'Train' },
  rep: {
    id: 'P6',
    elements: [
      { id: 'own', kind: 'presence', own: true, salience: 'primary' },
      { id: 'stranger', kind: 'presence', salience: 'equal' },
      { id: 'crowd', kind: 'presence', count: 'many' },
      { id: 'train', kind: 'place' },
    ],
    statements: [
      { id: 's1', say: { p: 'located-in', what: 'own', place: 'train' }, commitment: 'reported', basis: '“on a crowded train”' },
      { id: 's2', say: { p: 'displaced', what: 'own', by: 'braking' }, commitment: 'reported', basis: '“I stumbled when it braked”' },
      { id: 's3', say: { p: 'contact', a: 'own', b: 'stranger' }, commitment: 'reported', basis: '“grabbed a stranger’s arm”' },
      { id: 's4', say: { p: 'sends', from: 'own', item: 'apology', to: 'stranger' }, commitment: 'reported', basis: '“I apologised”' },
      { id: 's5', say: { p: 'exchange-absent', kind: 'spoken reply', from: 'stranger', to: 'own' }, commitment: 'reported', basis: '“they said nothing”' },
      { id: 's6', say: { p: 'located-in', what: 'crowd', place: 'train' }, commitment: 'implied', basis: '“crowded”' },
      { id: 'i1', say: { p: 'intends', who: 'stranger', what: 'annoyance' }, commitment: 'inferred', basis: 'not stated' },
      { id: 'q1', say: { p: 'question', about: 'stranger', asks: 'attention' }, commitment: 'unknown', basis: 'any response other than speech' },
      { id: 'q2', say: { p: 'question', about: 'crowd', asks: 'attention' }, commitment: 'unknown', basis: 'whether others noticed' },
    ],
    time: { phases: ['braking', 'grabbed', 'apology', 'silence'] },
    facets: {
      space: { setting: 'reported', place: 'carriage', viewpoints: ['own', 'behind', 'above'] },
      dynamics: { pace: 'moderate' },
      field: { quality: 'density', source: 's6', evolves: false },
    },
  },
};

const E2: StudyCase = {
  id: 'E2',
  domain: 'education',
  source: 'Education: written for the study',
  text: 'Water evaporates from the sea, condenses into clouds, falls as rain, and flows back to the sea in rivers.',
  theme: 'attention',
  words: { sea: 'Sea', sky: 'Clouds', land: 'Land', water: 'Water' },
  rep: {
    id: 'E2',
    elements: [
      { id: 'sea', kind: 'place' },
      { id: 'sky', kind: 'place' },
      { id: 'land', kind: 'place' },
      { id: 'water', kind: 'process', salience: 'primary' },
    ],
    statements: [
      { id: 's1', say: { p: 'transforms', what: 'water', from: 'liquid', to: 'vapour', at: 'sea' }, commitment: 'reported', phases: ['up'], basis: '“evaporates from the sea”' },
      { id: 's2', say: { p: 'transforms', what: 'water', from: 'vapour', to: 'cloud', at: 'sky' }, commitment: 'reported', phases: ['condense'], basis: '“condenses into clouds”' },
      // Pass A wrote "falls as rain" and "in rivers" as movement only; both are also changes of form
      // (corrected in slice 2, logs.md): s2b and s4b.
      { id: 's2b', say: { p: 'transforms', what: 'water', from: 'cloud', to: 'rain', at: 'sky' }, commitment: 'reported', phases: ['rain'], basis: '“falls as rain”' },
      { id: 'ab1', say: { p: 'above', a: 'sky', b: 'land' }, commitment: 'implied', basis: '“falls as rain”: what falls from X to Y licenses X above Y (revision 4)' },
      { id: 's3', say: { p: 'flows', what: 'water', from: 'sky', to: 'land' }, commitment: 'reported', phases: ['rain'], basis: '“falls as rain” (on land: implied by the rivers)' },
      { id: 's4b', say: { p: 'transforms', what: 'water', from: 'rain', to: 'liquid', at: 'land' }, commitment: 'implied', basis: '“in rivers”: the rain gathers as flowing water' },
      { id: 's4', say: { p: 'flows', what: 'water', from: 'land', to: 'sea' }, commitment: 'reported', phases: ['back'], basis: '“flows back to the sea in rivers”' },
      { id: 's5', say: { p: 'cycles', what: 'water', through: ['sea', 'sky', 'land'] }, commitment: 'implied', basis: '“back to the sea”' },
      { id: 'i1', say: { p: 'intends', who: 'sun', what: 'drives it' }, commitment: 'inferred', basis: 'the sun drives it: true, and not in the text' },
    ],
    time: { phases: ['up', 'condense', 'rain', 'back'], repeats: true },
    facets: {
      space: { setting: 'reported', place: 'ground', viewpoints: ['front', 'side'] },
      dynamics: { pace: 'moderate' },
      field: { quality: 'density', source: 's1', evolves: false },
    },
  },
};

const E3: StudyCase = {
  id: 'E3',
  domain: 'education',
  source: 'Education: written for the study (twin of P1: one observation, several explanations)',
  text: 'The plant by the window grew taller than the plant in the corner. It might be the extra light, or it might be that the window plant was watered more.',
  theme: 'attention',
  possibilities: ['The extra light', 'More water'],
  words: { a: 'Plant by the window', b: 'Plant in the corner', light: 'The extra light', water: 'More water' },
  rep: {
    id: 'E3',
    elements: [
      { id: 'a', kind: 'object', salience: 'equal' },
      { id: 'b', kind: 'object', salience: 'equal' },
    ],
    statements: [
      { id: 's1', say: { p: 'exceeds', a: 'a', b: 'b', aspect: 'height' }, commitment: 'reported', basis: '“grew taller than”' },
      { id: 'q1', say: { p: 'question', about: 's1', asks: 'cause' }, commitment: 'unknown', basis: '“it might be … or it might be”' },
      { id: 'a1', say: { p: 'alternatives', question: 'q1', options: ['light', 'water'], origin: 'source' }, commitment: 'possible', basis: 'offered by the text itself' },
    ],
    time: { phases: ['grown'] },
    facets: {
      space: { setting: 'reported', place: 'home', viewpoints: ['front', 'side'] },
      field: { quality: 'clarity', source: 'q1', evolves: true },
    },
  },
};

const M2: StudyCase = {
  id: 'M2',
  domain: 'project management',
  source: 'Project management: written for the study (twin of P3: waiting on a reply)',
  text: 'The launch date depends on the supplier confirming the parts, and they haven’t replied to our last two emails.',
  theme: 'recovery',
  words: { team: 'Team', supplier: 'Supplier', launch: 'Launch', confirmation: 'Confirmation', email: 'Emails' },
  rep: {
    id: 'M2',
    elements: [
      { id: 'team', kind: 'presence', count: 'several' },
      { id: 'supplier', kind: 'presence' },
      { id: 'launch', kind: 'process', salience: 'primary' },
      { id: 'confirmation', kind: 'object' },
    ],
    statements: [
      { id: 's1', say: { p: 'depends-on', what: 'launch', on: 'confirmation' }, commitment: 'reported', basis: '“depends on the supplier confirming”' },
      { id: 's2', say: { p: 'sends', from: 'team', item: 'email', to: 'supplier' }, commitment: 'implied', basis: 'presupposition of “our last two emails”: two sent' },
      { id: 's3', say: { p: 'exchange-absent', kind: 'reply', from: 'supplier', to: 'team' }, commitment: 'reported', basis: '“haven’t replied”' },
      { id: 's4', say: { p: 'waiting', what: 'launch', for: 'confirmation' }, commitment: 'implied', basis: 'X depends on Y, Y not yet here' },
      { id: 'i1', say: { p: 'late', what: 'launch' }, commitment: 'inferred', basis: 'not stated' },
      { id: 'q1', say: { p: 'question', about: 's3', asks: 'cause' }, commitment: 'unknown', basis: 'not stated' },
      { id: 'q2', say: { p: 'question', about: 'confirmation', asks: 'time' }, commitment: 'unknown', basis: 'not stated' },
    ],
    time: { phases: ['sent twice', 'waiting'] },
    facets: {
      space: { setting: 'stand-in', place: 'ground', viewpoints: ['within', 'above'] },
      metaphor: { frame: 'path', stations: ['team', 'supplier'] },
      dynamics: { pace: 'slow' },
      field: { quality: 'density', source: 's4', evolves: true },
    },
  },
};

const M3: StudyCase = {
  id: 'M3',
  domain: 'project management',
  source: 'Project management: written for the study (twin of P4: several explanations)',
  text: 'The build is two days late. It could be the flaky test server, the new library upgrade, or just that two people were off sick.',
  theme: 'recovery',
  possibilities: ['The flaky test server', 'The new library upgrade', 'Two people off sick'],
  words: { build: 'Build', server: 'The flaky test server', upgrade: 'The new library upgrade', sick: 'Two people off sick' },
  rep: {
    id: 'M3',
    elements: [{ id: 'build', kind: 'process', salience: 'primary' }],
    statements: [
      { id: 's1', say: { p: 'behind', what: 'build', amount: 'two days' }, commitment: 'reported', basis: '“two days late”' },
      { id: 'q1', say: { p: 'question', about: 's1', asks: 'cause' }, commitment: 'unknown', basis: '“it could be”' },
      { id: 'a1', say: { p: 'alternatives', question: 'q1', options: ['server', 'upgrade', 'sick'], origin: 'source' }, commitment: 'possible', basis: 'offered by the text itself' },
    ],
    time: { phases: ['planned', 'now'] },
    facets: {
      space: { setting: 'stand-in', place: 'ground', viewpoints: ['within', 'above'] },
      metaphor: { frame: 'path', stations: ['build'] },
      dynamics: { pace: 'moderate' },
      field: { quality: 'clarity', source: 'q1', evolves: true },
    },
  },
};

export const CASES: readonly StudyCase[] = [P1, P2, E1, M1, P3, P4, P5, P6, E2, E3, M2, M3];
