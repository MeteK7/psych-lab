import { SceneDefinition } from '../../composition/scene';

/**
 * MCII, "Your wish, and what's in the way" (docs/mcii-design.md §5). The original picture's
 * composition, kept: a horizontal path from now to a marker for the wish, a low wall across it,
 * and a dashed bridge over the wall. Nothing else. Version 2 drops the version 1 landscape,
 * which added layers without meaning (review, 2026-11-08). Version 3 keeps the wish in its colour
 * when it's set aside, because the wish stands for hope and grey reads as loss (review, 2026-11-08).
 * S1 is used only where it fixes or clarifies something: see `changes`. Version 4 adds motion
 * between the states (MCII step 4c); the states themselves are version 3's, as approved
 * (docs/visual-reviews.md, entry 1).
 * Geometry: the original's, moved 40 units up to fit the 480 × 120 banner frame.
 * Motion: the wall rises into place when the obstacle appears; the bridge is drawn from left to
 * right when there's a plan; emphasis changes ease. Nothing else moves, and nothing moves under
 * reduced motion.
 * Policy assertions: `mcii-path.policy.spec.ts`.
 */
const ROUTE = ['path', 'now', 'wish', 'wish-centre', 'label-now', 'label-wish'];
const OBSTACLE = ['wall', 'wall-courses', 'label-obstacle'];
const PLAN = ['bridge', 'label-plan'];
const NAMES = { serves: ['understanding'], why: "Names the element in the exercise's own words, from versioned content." } as const;

export const MCII_PATH: SceneDefinition = {
  id: 'mcii.path',
  version: 4,
  theme: 'action',
  frame: 'banner',
  layers: [
    {
      id: 'subject',
      plane: 'subject',
      elements: [
        {
          kind: 'shape',
          id: 'path',
          geometry: { type: 'line', x1: 40, y1: 80, x2: 419, y2: 80 },
          style: { role: 'context' },
          purpose: {
            serves: ['understanding'],
            why: 'Gives the reading direction from the present (left) to the wish (right): the line every other element sits on. A neutral colour and a lighter weight keep it behind the elements it connects.',
          },
        },
        {
          kind: 'shape',
          id: 'now',
          geometry: { type: 'circle', cx: 40, cy: 80, r: 5 },
          style: { role: 'context', material: 'tonal' },
          purpose: { serves: ['concept'], why: 'The starting point: the present situation, where mental contrasting begins.' },
        },
        {
          kind: 'shape',
          id: 'wish',
          geometry: { type: 'circle', cx: 430, cy: 80, r: 11 },
          style: { role: 'subject', material: 'tonal' },
          purpose: {
            serves: ['concept', 'feedback'],
            why: 'The desired future, as a place ahead rather than something achieved (no flag or trophy). It keeps its colour in every state, including set aside, because it stands for hope. Heavier at the wish steps, then equal with the wall once the obstacle appears.',
          },
        },
        {
          kind: 'shape',
          id: 'wish-centre',
          geometry: { type: 'circle', cx: 430, cy: 80, r: 4 },
          style: { role: 'subject', material: 'solid' },
          purpose: { serves: ['understanding'], why: 'Makes the ring read as a destination marker, as in the original.' },
        },
        {
          kind: 'shape',
          id: 'wall',
          geometry: { type: 'rect', x: 216, y: 56, width: 48, height: 32, rx: 2 },
          style: { role: 'subject', material: 'tonal' },
          purpose: {
            serves: ['concept'],
            why: "The obstacle. The same colour and line weight as the wish, because the method holds the wish and what's in the way with equal weight. Low, so it reads as something to get past, not a threat.",
          },
          enter: {
            effect: 'rise',
            why: 'Shows what this step adds: the obstacle comes up into its place on the path just pictured. A short rise rather than a drop, so it arrives without looking sudden or threatening.',
          },
        },
        {
          kind: 'shape',
          id: 'wall-courses',
          geometry: {
            type: 'path',
            d: 'M216 67 H264 M216 78 H264 M232 56 V67 M250 56 V67 M224 67 V78 M241 67 V78 M256 67 V78 M232 78 V88 M250 78 V88',
          },
          style: { role: 'subject', line: 'fine' },
          purpose: { serves: ['understanding'], why: 'Courses of bricks, so the rectangle reads as a wall.' },
          enter: { with: 'wall' },
        },
        {
          kind: 'shape',
          id: 'bridge',
          geometry: { type: 'path', d: 'M170 80 Q240 -10 310 80' },
          style: { role: 'ink', dash: 'intended' },
          purpose: {
            serves: ['concept'],
            why: "The if-then plan: a way over the obstacle. Dashed, because a plan is intended, not done; a solid bridge would suggest it's already solved.",
          },
          enter: {
            effect: 'draw',
            why: 'The plan is drawn from this side of the wall to the far side, in the reading direction: a way over that the participant has just made, rather than one that was always there. It stays dashed while it draws.',
          },
        },
      ],
    },
    {
      id: 'labels',
      plane: 'annotation',
      elements: [
        { kind: 'label', id: 'label-now', text: 'mcii.scene_labels.now', at: [40, 110], align: 'middle', names: ['now'], purpose: NAMES },
        { kind: 'label', id: 'label-wish', text: 'mcii.scene_labels.wish', at: [430, 110], align: 'middle', names: ['wish'], purpose: NAMES },
        { kind: 'label', id: 'label-obstacle', text: 'mcii.scene_labels.obstacle', at: [240, 110], align: 'middle', names: ['wall'], purpose: NAMES, enter: { with: 'wall', effect: 'fade' } },
        { kind: 'label', id: 'label-plan', text: 'mcii.scene_labels.plan', at: [240, 22], align: 'middle', names: ['bridge'], purpose: NAMES, enter: { with: 'bridge' } },
      ],
    },
  ],
  states: {
    initial: 'future',
    states: {
      future: { visible: ROUTE, emphasis: { wish: 'focal' } },
      // The wish and the wall with equal weight: neither is focal.
      contrast: { visible: [...ROUTE, ...OBSTACLE] },
      plan: { visible: [...ROUTE, ...OBSTACLE, ...PLAN] },
      // Set aside: the path to the wish gets quieter; the wish keeps its colour, so it reads as
      // "for now", not as lost. The step's own words carry the decision.
      aside: { visible: ROUTE, emphasis: { path: 'receded', now: 'receded' } },
    },
  },
  // The changes the exercise makes (mcii-scenes.ts): the obstacle step, then a plan or setting aside.
  transitions: [
    ['future', 'contrast'],
    ['contrast', 'plan'],
    ['contrast', 'aside'],
  ],
  alt: {
    future: 'mcii.scenes.future.alt',
    contrast: 'mcii.scenes.contrast.alt',
    plan: 'mcii.scenes.plan.alt',
    aside: 'mcii.scenes.aside.alt',
  },
  changes: [
    'Set aside keeps the wish in its colour and at full contrast; only the path to it gets lighter (1.5 px instead of 2). The original fades the whole picture to 45% opacity, which drops below the 3:1 minimum for graphics.',
    'Works in Windows High Contrast: every element is mapped to a system colour; the original has no forced-colours handling.',
    "Colours come from the Action theme, a little softer than the buttons, so the page's controls stay the strongest colour.",
    'Clearer hierarchy: the path is lighter (2 px instead of 3) than the elements it connects, and the wish is emphasised only at the wish steps.',
    'Everything else is unchanged: the same elements, positions, sizes and labels.',
  ],
};
