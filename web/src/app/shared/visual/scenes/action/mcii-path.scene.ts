import { SceneDefinition } from '../../composition/scene';

/**
 * MCII, "Your wish, and what's in the way" (docs/mcii-design.md §5). The original picture's
 * composition, kept: a horizontal path from now to a marker for the wish, a low wall across it,
 * and a dashed bridge over the wall. Nothing else. Version 2 drops the version 1 landscape,
 * which added layers without meaning (review, 2026-11-08). S1 is used only where it fixes or
 * clarifies something: see `changes`.
 * Geometry: the original's, moved 40 units up to fit the 480 × 120 banner frame.
 * Policy assertions: `mcii-path.policy.spec.ts`. Static states only; motion is MCII step 4c.
 */
const ROUTE = ['path', 'now', 'wish', 'wish-centre', 'label-now', 'label-wish'];
const OBSTACLE = ['wall', 'wall-courses', 'label-obstacle'];
const PLAN = ['bridge', 'label-plan'];
const NAMES = { serves: ['understanding'], why: "Names the element in the exercise's own words, from versioned content." } as const;

export const MCII_PATH: SceneDefinition = {
  id: 'mcii.path',
  version: 2,
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
            why: 'The desired future, as a place ahead rather than something achieved (no flag or trophy). Heavier at the wish steps, then equal with the wall once the obstacle appears.',
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
        },
      ],
    },
    {
      id: 'labels',
      plane: 'annotation',
      elements: [
        { kind: 'label', id: 'label-now', text: 'mcii.scene_labels.now', at: [40, 110], align: 'middle', purpose: NAMES },
        { kind: 'label', id: 'label-wish', text: 'mcii.scene_labels.wish', at: [430, 110], align: 'middle', purpose: NAMES },
        { kind: 'label', id: 'label-obstacle', text: 'mcii.scene_labels.obstacle', at: [240, 110], align: 'middle', purpose: NAMES },
        { kind: 'label', id: 'label-plan', text: 'mcii.scene_labels.plan', at: [240, 22], align: 'middle', purpose: NAMES },
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
      // Set aside: the route turns neutral grey at the same lightness, so it stays legible.
      aside: { visible: ROUTE, emphasis: { path: 'receded', now: 'receded', wish: 'receded', 'wish-centre': 'receded' } },
    },
  },
  alt: {
    future: 'mcii.scenes.future.alt',
    contrast: 'mcii.scenes.contrast.alt',
    plan: 'mcii.scenes.plan.alt',
    aside: 'mcii.scenes.aside.alt',
  },
  changes: [
    'Set aside stays readable: the route turns neutral grey at the same lightness (5.3:1 in light) instead of fading to 45% opacity, which drops below the 3:1 minimum for graphics.',
    'Works in Windows High Contrast: every element is mapped to a system colour; the original has no forced-colours handling.',
    "Colours come from the Action theme, a little softer than the buttons, so the page's controls stay the strongest colour.",
    'Clearer hierarchy: the path is lighter (2 px instead of 3) than the elements it connects, and the wish is emphasised only at the wish steps.',
    'Everything else is unchanged: the same elements, positions, sizes and labels.',
  ],
};
