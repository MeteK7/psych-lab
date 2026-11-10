import type { Purpose } from '../../composition/scene';
import type { DrawPaint, FrameItem, ResolvedFrame } from '../../rendering/frame';
import { resolveLabel, resolveStyle } from '../../styling/resolve';
import type { ThemeId } from '../../styling/vocabulary';

/**
 * The dot game ("Picture it, then follow the dot", "Follow the dot, then plan"): a ring around a
 * moving dot, and the person's marker. Drawn every frame by the canvas backend; the game itself
 * (timing, scoring, input) stays in the exercise. Its preview, "How the game works", is drawn from
 * the same parts by the SVG backend, so the two always look alike.
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

export function ringPaint(onTarget: boolean): DrawPaint {
  return onTarget
    ? { ...resolveStyle({ role: 'subject' }, 'focal'), width: RING_WIDTH.inside }
    : { ...resolveStyle({ role: 'context' }), width: RING_WIDTH.outside };
}

function ringAndDot(at: Point, ringRadius: number, onTarget: boolean): FrameItem[] {
  return [
    {
      kind: 'shape',
      id: 'ring',
      layer: 'target',
      shape: { type: 'circle', cx: at.x, cy: at.y, r: ringRadius },
      paint: ringPaint(onTarget),
    },
    {
      kind: 'shape',
      id: 'dot',
      layer: 'target',
      shape: { type: 'circle', cx: at.x, cy: at.y, r: DOT_RADIUS },
      paint: resolveStyle({ role: 'ink', material: 'solid' }),
    },
  ];
}

export function trackingFrame({ size, target, cursor, ringRadius, onTarget }: TrackingInput): ResolvedFrame {
  const { x, y } = cursor;
  const a = MARKER_ARM;
  const marker: FrameItem = {
    kind: 'shape',
    id: 'marker',
    layer: 'person',
    shape: { type: 'path', d: `M${x - a} ${y}H${x + a}M${x} ${y - a}V${y + a}` },
    paint: resolveStyle({ role: 'ink', line: 'regular' }),
  };
  return {
    width: size.width,
    height: size.height,
    theme: TRACKING.theme,
    items: [...ringAndDot(target, ringRadius, onTarget), marker],
  };
}

export interface PreviewInput {
  ringRadius: number;
  /** The three labels, in the exercise's own words. */
  labels: { dot: string; ring: string; pointer: string };
}

/** "How the game works": the ring with the pointer inside it, labelled. */
export function trackingPreviewFrame({ ringRadius, labels }: PreviewInput): ResolvedFrame {
  const at = { x: 150, y: 110 };
  const hair = resolveStyle({ role: 'context', line: 'hair' });
  const label = resolveLabel('label');
  const ink = resolveStyle({ role: 'ink', line: 'fine' });
  const ground = resolveStyle({ role: 'ground', material: 'tonal' });
  const text = (id: string, value: string, x: number, y: number): FrameItem => ({
    kind: 'text',
    id,
    layer: 'labels',
    text: value,
    x,
    y,
    anchor: 'start',
    fill: label.fill,
    size: label.size,
  });
  const leader = (id: string, x1: number, y1: number, x2: number, y2: number): FrameItem => ({
    kind: 'shape',
    id,
    layer: 'labels',
    shape: { type: 'line', x1, y1, x2, y2 },
    paint: hair,
  });
  return {
    width: 480,
    height: 200,
    theme: TRACKING.theme,
    items: [
      { kind: 'shape', id: 'box', layer: 'box', shape: { type: 'rect', x: 1, y: 1, width: 478, height: 198, rx: 8 }, paint: hair },
      ...ringAndDot(at, ringRadius, true),
      {
        kind: 'shape',
        id: 'pointer',
        layer: 'person',
        shape: { type: 'path', d: 'M160 116 l0 22 l6 -6 l5 11 l4 -2 l-5 -11 l8 0 z' },
        paint: { ...ink, fill: ground.fill },
      },
      leader('leader-dot', at.x, at.y - DOT_RADIUS, at.x, 40),
      text('label-dot', labels.dot, 158, 36),
      leader('leader-ring', at.x + ringRadius, 104, 250, 88),
      text('label-ring', labels.ring, 256, 92),
      leader('leader-pointer', 176, 146, 250, 160),
      text('label-pointer', labels.pointer, 256, 164),
    ],
  };
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
