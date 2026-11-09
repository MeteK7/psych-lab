export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * Target position on a smooth Lissajous path. Incommensurate frequencies keep the path
 * from repeating within a 24-second set, so it can't be learned and anticipated.
 */
export function targetAt(tSeconds: number, size: Size, speed: number, margin: number): Point {
  const ax = size.width / 2 - margin;
  const ay = size.height / 2 - margin;
  return {
    x: size.width / 2 + ax * Math.sin(0.83 * speed * tSeconds),
    y: size.height / 2 + ay * Math.sin(1.31 * speed * tSeconds + Math.PI / 3),
  };
}

export function isOnTarget(cursor: Point, target: Point, radius: number): boolean {
  return Math.hypot(cursor.x - target.x, cursor.y - target.y) <= radius;
}

export type Direction = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

export function isDirection(key: string): key is Direction {
  return key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight';
}

/** Moves a keyboard cursor for the held arrow keys, clamped to the play area. */
export function moveCursor(cursor: Point, held: ReadonlySet<Direction>, distance: number, size: Size): Point {
  let dx = 0;
  let dy = 0;
  if (held.has('ArrowLeft')) dx -= 1;
  if (held.has('ArrowRight')) dx += 1;
  if (held.has('ArrowUp')) dy -= 1;
  if (held.has('ArrowDown')) dy += 1;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: clamp(cursor.x + (dx / length) * distance, 0, size.width),
    y: clamp(cursor.y + (dy / length) * distance, 0, size.height),
  };
}

/** Accumulates time-weighted on-target exposure across animation frames. */
export class TrackingScore {
  private onTargetMs = 0;
  private totalMs = 0;

  add(frameMs: number, onTarget: boolean): void {
    if (frameMs <= 0) return;
    this.totalMs += frameMs;
    if (onTarget) this.onTargetMs += frameMs;
  }

  get ratio(): number {
    return this.totalMs === 0 ? 0 : this.onTargetMs / this.totalMs;
  }

  get measuredMs(): number {
    return this.totalMs;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * How the ring shows that the pointer is inside it: heavier as well as in the accent colour, so
 * the feedback never rests on colour alone (visual-policy.md §6). Widths in canvas px.
 */
export const RING = {
  inside: { width: 5, colour: 'accent' },
  outside: { width: 2, colour: 'muted' },
} as const;

export function ringStyle(onTarget: boolean): (typeof RING)[keyof typeof RING] {
  return onTarget ? RING.inside : RING.outside;
}
