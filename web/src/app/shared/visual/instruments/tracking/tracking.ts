import { Composed, composeScene } from '../../composition/compose';
import type { Point as ScenePoint, Purpose, SceneElement } from '../../composition/scene';
import type { StyleRef, ThemeId } from '../../styling/vocabulary';

/**
 * The dot game ("Picture it, then follow the dot", "Follow the dot, then plan"): a ring around a
 * moving dot, and the person's marker. Composed every frame from the game's state and drawn by the
 * canvas backend; the game itself (timing, scoring, input) stays in the exercise. Its preview,
 * "How the game works", is composed from the same parts and drawn by the SVG backend, so the two
 * always look alike. Both are compositions built from data (composition/compose.ts).
 *
 * The ring shows that the pointer is inside it by weight as well as colour (visual-policy.md §6);
 * in high contrast it takes the system highlight, like every focal element. Policy assertions:
 * `tracking.policy.spec.ts`.
 */
export const TRACKING = { id: 'state-reset.tracking', version: 1, theme: 'action' as ThemeId } as const;

/** The ring's widths in game px: the game's own, heavier than S1's figure lines, so it reads while moving. */
export const RING_WIDTH = { inside: 5, outside: 2 } as const;
const DOT_RADIUS = 7;
const MARKER_ARM = 6;

export interface Point {
  x: number;
  y: number;
}

export interface TrackingInput {
  size: { width: number; height: number };
  target: Point;
  /** The keyboard marker (pointer users also see their own cursor). */
  cursor: Point;
  ringRadius: number;
  onTarget: boolean;
}

/** Why each element is there (docs/visual-policy.md principle 6). */
export const TRACKING_PURPOSES: readonly { id: string; purpose: Purpose }[] = [
  { id: 'dot', purpose: { serves: ['interaction'], why: 'What to follow.' } },
  {
    id: 'ring',
    purpose: {
      serves: ['interaction', 'feedback'],
      why: 'Where the pointer has to stay; heavier and in the Action colour while it is inside, so the feedback never rests on colour alone.',
    },
  },
  { id: 'marker', purpose: { serves: ['interaction'], why: 'Where the keyboard marker is; pointer users see their own cursor too.' } },
  {
    id: 'box, leader-*, label-*, pointer',
    purpose: { serves: ['understanding'], why: 'In the preview only: the parts of the game, named before the practice round.' },
  },
];
const PURPOSE = (id: string): Purpose => TRACKING_PURPOSES.find((p) => p.id === id)!.purpose;

/** The ring's style: the pointer inside it makes it the focal element, heavier (the emphasis is set by the state). */
export function ringStyle(onTarget: boolean): StyleRef {
  return onTarget ? { role: 'subject', width: RING_WIDTH.inside } : { role: 'context', width: RING_WIDTH.outside };
}

function ringAndDot(at: Point, ringRadius: number, onTarget: boolean): SceneElement[] {
  return [
    {
      kind: 'shape',
      id: 'ring',
      geometry: { type: 'circle', cx: at.x, cy: at.y, r: ringRadius },
      style: ringStyle(onTarget),
      purpose: PURPOSE('ring'),
    },
    {
      kind: 'shape',
      id: 'dot',
      geometry: { type: 'circle', cx: at.x, cy: at.y, r: DOT_RADIUS },
      style: { role: 'ink', material: 'solid' },
      purpose: PURPOSE('dot'),
    },
  ];
}

export function composeTracking({ size, target, cursor, ringRadius, onTarget }: TrackingInput): Composed {
  const { x, y } = cursor;
  const a = MARKER_ARM;
  const marker: SceneElement = {
    kind: 'shape',
    id: 'marker',
    geometry: { type: 'path', d: `M${x - a} ${y}H${x + a}M${x} ${y - a}V${y + a}` },
    style: { role: 'ink', line: 'regular' },
    purpose: PURPOSE('marker'),
  };
  return composeScene({
    id: TRACKING.id,
    version: TRACKING.version,
    theme: TRACKING.theme,
    size,
    layers: [
      { id: 'target', plane: 'subject', elements: ringAndDot(target, ringRadius, onTarget) },
      { id: 'person', plane: 'subject', elements: [marker] },
    ],
    ...(onTarget ? { emphasis: { ring: 'focal' as const } } : {}),
    alt: 'The dot game: a ring around a moving dot, and the marker.',
  });
}

export interface PreviewInput {
  ringRadius: number;
  /** The three labels, in the exercise's own words. */
  labels: { dot: string; ring: string; pointer: string };
}

/** "How the game works": the ring with the pointer inside it, labelled. */
export function composeTrackingPreview({ ringRadius, labels }: PreviewInput): Composed {
  const at = { x: 150, y: 110 };
  const parts = PURPOSE('box, leader-*, label-*, pointer');
  const hair: StyleRef = { role: 'context', line: 'hair' };
  const pointer = 'M160 116 l0 22 l6 -6 l5 11 l4 -2 l-5 -11 l8 0 z';
  const label = (id: string, key: string, x: number, y: number): SceneElement => ({
    kind: 'label',
    id,
    text: key,
    at: [x, y] as ScenePoint,
    align: 'start',
    purpose: parts,
  });
  const leader = (id: string, x1: number, y1: number, x2: number, y2: number): SceneElement => ({
    kind: 'shape',
    id,
    geometry: { type: 'line', x1, y1, x2, y2 },
    style: hair,
    purpose: parts,
  });
  return composeScene(
    {
      id: TRACKING.id,
      version: TRACKING.version,
      theme: TRACKING.theme,
      size: { width: 480, height: 200 },
      layers: [
        {
          id: 'box',
          plane: 'annotation',
          elements: [{ kind: 'shape', id: 'box', geometry: { type: 'rect', x: 1, y: 1, width: 478, height: 198, rx: 8 }, style: hair, purpose: parts }],
        },
        { id: 'target', plane: 'subject', elements: ringAndDot(at, ringRadius, true) },
        {
          id: 'person',
          plane: 'subject',
          elements: [
            // The pointer: filled with the ground so the ring doesn't show through, outlined in ink.
            { kind: 'shape', id: 'pointer-fill', geometry: { type: 'path', d: pointer }, style: { role: 'ground', material: 'tonal' }, purpose: parts },
            { kind: 'shape', id: 'pointer', geometry: { type: 'path', d: pointer }, style: { role: 'ink', line: 'fine' }, purpose: parts },
          ],
        },
        {
          id: 'labels',
          plane: 'annotation',
          elements: [
            leader('leader-dot', at.x, at.y - DOT_RADIUS, at.x, 40),
            label('label-dot', 'label.dot', 158, 36),
            leader('leader-ring', at.x + ringRadius, 104, 250, 88),
            label('label-ring', 'label.ring', 256, 92),
            leader('leader-pointer', 176, 146, 250, 160),
            label('label-pointer', 'label.pointer', 256, 164),
          ],
        },
      ],
      emphasis: { ring: 'focal' },
      alt: 'How the game works: the ring with the pointer inside it, labelled.',
    },
    { 'label.dot': labels.dot, 'label.ring': labels.ring, 'label.pointer': labels.pointer },
  );
}
