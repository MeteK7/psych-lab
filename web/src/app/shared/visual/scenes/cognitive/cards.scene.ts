import { SceneDefinition } from '../../composition/scene';
import { box, cardScene, ring } from '../cards';

/**
 * Cognitive shifts card figures (scenes/cards.ts), one metaphor per exercise, in the area's soft
 * blue (cognitive@2). Neutral is what the person brings; blue is what the exercise does with it.
 * Policy assertions: `cards.policy.spec.ts`.
 */

/** CS1, "Other ways to read it": one situation, three lenses, the readings sorted by fit. */
export const CARD_OTHER_READINGS: SceneDefinition = cardScene('card.other-readings', 'cs_other_readings', 'cognitive', 1, [
  {
    kind: 'shape',
    id: 'situation',
    geometry: { type: 'path', d: `${box(40, 44, 42, 32, 6)}M50 56h22M50 64h13` },
    style: { role: 'context', line: 'fine' },
    purpose: { serves: ['concept'], why: 'The situation as it was first read: a note, in neutral, because it is what the person brings.' },
  },
  {
    kind: 'shape',
    id: 'rays',
    geometry: { type: 'path', d: 'M82 60L142 29M82 60H142M82 60L142 91' },
    style: { role: 'near', line: 'hair' },
    purpose: { serves: ['understanding'], why: 'The same situation goes to each lens: one situation, not three.' },
  },
  {
    kind: 'shape',
    id: 'lenses',
    geometry: { type: 'path', d: `${ring(155, 28, 13)}${ring(155, 60, 13)}${ring(155, 92, 13)}` },
    style: { role: 'subject', line: 'fine', material: 'tonal' },
    purpose: {
      serves: ['concept'],
      why: 'The three lenses the exercise offers, as circles of the same size: three equal ways of looking, none preferred. No magnifying glass (visual-language.md §11).',
    },
  },
  {
    kind: 'shape',
    id: 'sorting',
    geometry: { type: 'path', d: 'M168 28C204 28 208 60 240 60M168 60C204 60 208 28 240 28M168 92H240' },
    style: { role: 'near', line: 'regular', dash: 'tentative' },
    purpose: {
      serves: ['concept'],
      why: 'Each lens gives a reading, and the readings change places when they are sorted by fit: the crossing shows the sorting. Dotted, because a reading is a possibility, not a conclusion.',
    },
  },
  {
    kind: 'shape',
    id: 'scales',
    geometry: { type: 'path', d: `${box(246, 22, 200, 12, 6)}${box(246, 54, 200, 12, 6)}${box(246, 86, 200, 12, 6)}` },
    style: { role: 'mid', material: 'tonal' },
    purpose: { serves: ['understanding'], why: 'The full length of each fit, so a shorter reading reads as fitting less, not as smaller.' },
  },
  {
    kind: 'shape',
    id: 'fit',
    geometry: { type: 'path', d: `${box(246, 22, 172, 12, 6)}${box(246, 54, 118, 12, 6)}${box(246, 86, 58, 12, 6)}` },
    style: { role: 'subject', material: 'solid' },
    purpose: { serves: ['concept'], why: 'How well each reading fits, best at the top: what the exercise asks the person to judge.' },
  },
]);

/** CS2, "Why did it happen?": a setback, its causes placed on a map, one circled to change. */
export const CARD_WHY_IT_HAPPENED: SceneDefinition = cardScene('card.why-it-happened', 'cs_why_it_happened', 'cognitive', 1, [
  {
    kind: 'shape',
    id: 'setback',
    geometry: { type: 'path', d: 'M28 46H70L84 78H112' },
    style: { role: 'context' },
    purpose: { serves: ['concept'], why: 'The setback: a level line that drops. Neutral, because it is what happened, not a judgement of it.' },
  },
  {
    kind: 'shape',
    id: 'links',
    geometry: { type: 'path', d: 'M112 78L210 44M112 78L226 84M112 78L346 36M112 78L396 74M112 78L280 96' },
    style: { role: 'near', line: 'hair' },
    purpose: { serves: ['concept'], why: 'One setback, several possible causes: the exercise collects more than the first one.' },
  },
  {
    kind: 'shape',
    id: 'map',
    geometry: { type: 'path', d: box(176, 14, 272, 92, 8) },
    style: { role: 'subject', line: 'fine' },
    purpose: { serves: ['concept'], why: 'The map the exercise places causes on, as in the exercise itself (cs2.cause-map).' },
  },
  {
    kind: 'shape',
    id: 'midlines',
    geometry: { type: 'path', d: 'M312 14V106M176 60H448' },
    style: { role: 'subject', line: 'hair' },
    purpose: {
      serves: ['understanding'],
      why: "The map's two questions, as its midlines: solid, as in the cause map (review entry 3), so the four parts read as places.",
    },
  },
  {
    kind: 'shape',
    id: 'causes',
    geometry: { type: 'path', d: `${ring(210, 40, 5)}${ring(226, 84, 5)}${ring(346, 36, 5)}${ring(280, 92, 5)}${ring(396, 74, 6)}` },
    style: { role: 'subject', material: 'solid' },
    purpose: { serves: ['concept'], why: 'The causes, spread over different parts of the map: not everything comes from one place.' },
  },
  {
    kind: 'shape',
    id: 'chosen',
    geometry: { type: 'circle', cx: 396, cy: 74, r: 12 },
    style: { role: 'subject', line: 'fine' },
    purpose: { serves: ['concept'], why: 'One cause circled: what, if anything, the person chooses to change. A ring, not a mark of blame.' },
  },
]);

/** CS3, "Not enough to go on": facts so far, empty places for what isn't known, two readings still open. */
export const CARD_NOT_ENOUGH: SceneDefinition = cardScene('card.not-enough', 'cs_not_enough_to_go_on', 'cognitive', 1, [
  {
    kind: 'shape',
    id: 'facts',
    geometry: { type: 'path', d: `${box(36, 44, 32, 32, 5)}M45 60h14${box(76, 44, 32, 32, 5)}M85 60h14${box(116, 44, 32, 32, 5)}M125 60h14` },
    style: { role: 'context', line: 'fine' },
    purpose: { serves: ['concept'], why: 'The facts the person has, each one a filled place: neutral, because they are what is known.' },
  },
  {
    kind: 'shape',
    id: 'missing',
    geometry: { type: 'path', d: `${box(156, 44, 32, 32, 5)}${box(196, 44, 32, 32, 5)}` },
    style: { role: 'subject', line: 'regular', dash: 'tentative' },
    purpose: { serves: ['concept'], why: "The places still empty: what isn't known yet. Dotted, because they are open, not wrong." },
  },
  {
    kind: 'shape',
    id: 'find-out',
    geometry: { type: 'path', d: 'M172 53v14M165 60h14M172 106V86M166 92l6-6 6 6' },
    // Regular (2 px) on whole units, so the plus lies on whole pixels in every backend.
    style: { role: 'subject', line: 'regular' },
    purpose: { serves: ['concept'], why: 'A new fact coming into the first empty place: finding out, the step the exercise ends on.' },
  },
  {
    kind: 'shape',
    id: 'fork',
    geometry: { type: 'path', d: 'M240 60H290C330 60 340 30 384 30M290 60C330 60 340 90 384 90' },
    style: { role: 'near', line: 'regular', dash: 'tentative' },
    purpose: { serves: ['concept'], why: 'What is known so far leads two ways with equal weight: the facts can\'t yet tell the readings apart.' },
  },
  {
    kind: 'shape',
    id: 'readings',
    geometry: { type: 'path', d: `${ring(396, 30, 11)}${ring(396, 90, 11)}` },
    style: { role: 'subject', line: 'fine' },
    purpose: { serves: ['concept'], why: 'Two readings, the same size and both open: neither is chosen until there is enough to go on.' },
  },
]);

/** CS4, "Change the camera angle": a camera close to the moment, then one that has stepped back. */
export const CARD_CAMERA_ANGLE: SceneDefinition = cardScene(
  'card.camera-angle',
  'cs_camera_angle',
  'cognitive',
  1,
  [
    {
      kind: 'shape',
      id: 'wide-view',
      geometry: { type: 'path', d: `${box(226, 14, 230, 94, 4)}M95 42L226 14M95 42L226 108` },
      style: { role: 'near', line: 'hair' },
      purpose: { serves: ['concept'], why: "What the stepped-back camera sees: the whole moment, and the place where the close camera stood." },
    },
    {
      kind: 'shape',
      id: 'floor',
      geometry: { type: 'ellipse', cx: 372, cy: 94, rx: 72, ry: 10 },
      style: { role: 'mid', material: 'tonal' },
      purpose: { serves: ['understanding'], why: 'The ground the moment happens on, so it reads as a place seen in space.' },
    },
    {
      kind: 'shape',
      id: 'moment',
      geometry: { type: 'path', d: 'M345 58H365A3 3 0 0 1 368 61V94H342V61A3 3 0 0 1 345 58ZM379 72H409A3 3 0 0 1 412 75V94H376V75A3 3 0 0 1 379 72Z' },
      style: { role: 'context', line: 'regular' },
      purpose: {
        serves: ['concept'],
        why: 'The moment, as two plain forms: neutral, because it is what happened. No people, so nothing in it can read as a face or a judgement.',
      },
    },
    {
      kind: 'shape',
      id: 'close-camera',
      geometry: {
        type: 'path',
        d: `${box(265, 66, 28, 18, 3)}M270 66V62H281V66ZM293 69H297L302 66V84L297 81H293ZM302 72L336 61M302 78L336 89`,
      },
      // Regular (2 px) on whole units: thinner lines that cross on whole units leave grey corners in forced colours.
      style: { role: 'subject', line: 'regular', material: 'tonal' },
      purpose: {
        serves: ['concept'],
        why: 'Going back through your own eyes: a small camera close to the moment, with a narrow view that takes in only part of it.',
      },
    },
    {
      kind: 'shape',
      id: 'step-back',
      geometry: { type: 'path', d: 'M276 56C236 22 160 8 112 16' },
      style: { role: 'subject', dash: 'tentative', line: 'regular' },
      purpose: {
        serves: ['concept'],
        why: 'Stepping back: from the close camera up and away to the second one. Dotted, because how far to step back is the person\'s choice.',
      },
    },
    {
      kind: 'shape',
      id: 'step-back-head',
      geometry: { type: 'path', d: 'M120 10L110 16L120 22' },
      style: { role: 'subject', line: 'fine' },
      purpose: { serves: ['understanding'], why: 'Which way the step goes: back, away from the moment.' },
    },
    {
      kind: 'shape',
      id: 'far-camera',
      geometry: {
        type: 'path',
        d: `${box(36, 29, 42, 26, 4)}M44 29V23A1 1 0 0 1 45 22H59A1 1 0 0 1 60 23V29ZM66 29V25H74V29ZM78 34H87L95 29V55L87 50H78Z`,
      },
      style: { role: 'subject', line: 'regular', material: 'tonal' },
      purpose: {
        serves: ['concept'],
        why: 'Looking as an observer would: a camera with a body, a viewfinder and a lens, further away and higher, so the whole moment is in its view.',
      },
    },
  ],
  ['Eight forms with the ground and the floor, one more than the element budget (visual-policy.md §3.13): the arrowhead says which way the step goes, which the dotted line alone does not.'],
);

export const COGNITIVE_CARDS: readonly SceneDefinition[] = [CARD_OTHER_READINGS, CARD_WHY_IT_HAPPENED, CARD_NOT_ENOUGH, CARD_CAMERA_ANGLE];
