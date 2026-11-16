import { SceneDefinition, SceneElement } from '../../composition/scene';
import { box, cardScene, ring } from '../cards';
import { MCII_PATH } from './mcii-path.scene';

/**
 * Action and growth card figures (scenes/cards.ts), in the Action theme. Neutral is where the
 * person starts and where they are heading; the area colour is the step the exercise helps them
 * make. Policy assertions: `cards.policy.spec.ts`.
 */

/** The starting point and the first step, shared by the three exercises that end in a plan. */
const firstStep = (x: number, y: number, length: number): SceneElement[] => [
  {
    kind: 'shape',
    id: 'start',
    geometry: { type: 'circle', cx: x, cy: y, r: 5 },
    style: { role: 'context' },
    purpose: { serves: ['concept'], why: 'Where the person is now, before starting: neutral, an open ring.' },
  },
  {
    kind: 'shape',
    id: 'step',
    geometry: { type: 'line', x1: x + 6, y1: y, x2: x + length, y2: y },
    style: { role: 'subject', line: 'bold' },
    purpose: { serves: ['concept'], why: 'The first small step the plan names: short, drawn in, and the heaviest line in the figure.' },
  },
  {
    kind: 'shape',
    id: 'step-end',
    geometry: { type: 'circle', cx: x + length + 1, cy: y, r: 6 },
    style: { role: 'subject', material: 'solid' },
    purpose: { serves: ['understanding'], why: 'Where the first step ends: a point that is reached, not the goal.' },
  },
];

/** "Plan your first step": a long route to a goal, the first step drawn in, with a time set for it. */
export const CARD_FIRST_STEP: SceneDefinition = cardScene('card.first-step', 'action_bridge', 'action', 1, [
  {
    kind: 'shape',
    id: 'route',
    geometry: { type: 'path', d: 'M157 76C220 76 250 40 320 44S400 52 424 40' },
    style: { role: 'context', line: 'regular', dash: 'tentative' },
    purpose: { serves: ['concept'], why: 'The rest of the way: dotted, because it isn\'t planned yet and doesn\'t need to be.' },
  },
  {
    kind: 'shape',
    id: 'goal',
    geometry: { type: 'path', d: 'M424 40V16M424 16L442 22L424 28' },
    style: { role: 'context', line: 'fine' },
    purpose: { serves: ['concept'], why: 'The goal, far ahead: a small flag in neutral, so the figure is about the start, not the finish.' },
  },
  ...firstStep(62, 76, 88),
  {
    kind: 'shape',
    id: 'when',
    geometry: { type: 'path', d: `${ring(151, 38, 9)}M151 33V38H155M151 47V64` },
    // Regular (2 px): the hands meet on whole units, where a thinner line leaves a grey corner in forced colours.
    style: { role: 'subject', line: 'regular' },
    purpose: { serves: ['concept'], why: 'When the step will happen: a clock tied to it, because the plan names a time to start.' },
  },
]);

/** "Write down your goal": a written goal, today's part of it marked, leading to the flag. */
export const CARD_GOAL: SceneDefinition = cardScene('card.goal', 'goal_restatement', 'action', 1, [
  {
    kind: 'shape',
    id: 'note',
    geometry: { type: 'path', d: `${box(70, 20, 150, 80, 6)}M88 40H190M88 56H172M88 72H150` },
    style: { role: 'context', line: 'fine' },
    purpose: { serves: ['concept'], why: 'The goal, written down in the person\'s own words: lines on a note, never readable text.' },
  },
  {
    kind: 'shape',
    id: 'today',
    geometry: { type: 'line', x1: 88, y1: 86, x2: 132, y2: 86 },
    style: { role: 'subject', line: 'bold' },
    purpose: { serves: ['concept'], why: "Today's part of the goal: the one line in the area colour." },
  },
  {
    kind: 'shape',
    id: 'towards',
    geometry: { type: 'line', x1: 236, y1: 60, x2: 372, y2: 60 },
    style: { role: 'near', line: 'hair', dash: 'intended' },
    purpose: { serves: ['understanding'], why: 'From the note towards the goal: dashed, because it is intended, not done.' },
  },
  {
    kind: 'shape',
    id: 'goal',
    geometry: { type: 'path', d: 'M392 94V30M392 30L420 40L392 50Z' },
    style: { role: 'subject', line: 'regular', material: 'tonal' },
    purpose: { serves: ['concept'], why: 'The goal itself, in the area colour, because this exercise is about naming it.' },
  },
]);

const DOT_WHY = 'The dot to follow with the eyes, on its path: a game that takes some attention while the picture is held.';

/** "Picture it, then follow the dot": a picture held in mind, the dot to follow, then the first step. */
export const CARD_PICTURE_DOT: SceneDefinition = cardScene('card.picture-dot', 'state_reset+action_bridge', 'action', 1, [
  {
    kind: 'shape',
    id: 'picture',
    geometry: { type: 'path', d: `${box(40, 22, 120, 76, 8)}M58 80L88 54L108 70L124 58L144 80` },
    style: { role: 'context', line: 'fine' },
    purpose: { serves: ['concept'], why: 'The picture of what the person is reluctant to start, held in mind: a framed scene in neutral, never a face.' },
  },
  {
    kind: 'shape',
    id: 'dot-path',
    geometry: { type: 'path', d: 'M178 60C200 30 222 30 244 60S288 90 310 60' },
    style: { role: 'near', line: 'regular', dash: 'tentative' },
    purpose: { serves: ['understanding'], why: 'Where the dot moves: dotted, a path rather than a thing.' },
  },
  {
    kind: 'shape',
    id: 'dot',
    geometry: { type: 'circle', cx: 277, cy: 82, r: 7 },
    style: { role: 'subject', material: 'solid' },
    purpose: { serves: ['concept'], why: DOT_WHY },
  },
  ...firstStep(344, 76, 80),
]);

/** "Follow the dot, then plan": the dot to follow, then the first step. */
export const CARD_DOT_PLAN: SceneDefinition = cardScene('card.dot-plan', 'game_only+action_bridge', 'action', 1, [
  {
    kind: 'shape',
    id: 'dot-path',
    geometry: { type: 'path', d: 'M50 60C80 26 112 26 142 60S204 94 234 60S290 30 310 50' },
    style: { role: 'near', line: 'regular', dash: 'tentative' },
    purpose: { serves: ['understanding'], why: 'Where the dot moves: dotted, a path rather than a thing.' },
  },
  {
    kind: 'shape',
    id: 'dot',
    geometry: { type: 'circle', cx: 188, cy: 86, r: 7 },
    style: { role: 'subject', material: 'solid' },
    purpose: { serves: ['concept'], why: 'The dot to follow with the eyes: a short game before planning.' },
  },
  ...firstStep(344, 76, 80),
]);

/** "Your wish, and what's in the way": mcii.path's own forms in its `contrast` state, without labels. */
const WISH_FORMS = ['path', 'now', 'wish', 'wish-centre', 'wall', 'wall-courses'];
const mciiForms = MCII_PATH.layers
  .flatMap((l) => l.elements)
  .filter((e) => WISH_FORMS.includes(e.id))
  .map((e) => ({ ...e, enter: undefined }) as SceneElement)
  // The courses cross on whole units: at 1.5 px the crossings draw as grey corners in forced colours, so the card draws them at 2 px.
  .map((e) => (e.id === 'wall-courses' && e.kind === 'shape' ? { ...e, style: { ...e.style, line: 'regular' } } : e) as SceneElement);

export const CARD_WISH: SceneDefinition = cardScene('card.wish', 'mcii', 'action', 1, mciiForms, [
  "The exercise's own figure (mcii.path@4) in its `contrast` state, with the same forms, places and colours, so the card shows what the exercise will show. Its labels and motion are left out: a card has no words in its figure and nothing moves.",
  "The wall's courses are 2 px instead of 1.5. At 1.5 px their crossings draw as grey corners in forced colours on the canvas backend (mcii.path has the same; its accepted version is unchanged).",
]);

export const ACTION_CARDS: readonly SceneDefinition[] = [CARD_FIRST_STEP, CARD_GOAL, CARD_PICTURE_DOT, CARD_DOT_PLAN, CARD_WISH];
