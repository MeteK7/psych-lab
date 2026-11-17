/**
 * S2 Generation, spatial (2026-11-14, pulled by `camera-angle.room`): a pinhole camera for a
 * constructed space. World points are in metres (x right, y up, z ahead); a camera stands at a
 * position, looks at a target, and projects onto a frame. Pure geometry: no colour, no DOM, no
 * other capability (dependency rule 1). A spatial view (visual-policy.md §3.4) moves its camera
 * along one declared path through keyframes; `along` gives the camera anywhere on that path.
 */
export type V3 = readonly [number, number, number];
export type Pt = readonly [number, number];

export const sub = (p: V3, q: V3): V3 => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
export const dot = (p: V3, q: V3) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
export const cross = (p: V3, q: V3): V3 => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
export const length = (p: V3) => Math.hypot(p[0], p[1], p[2]);
export const normalize = (p: V3): V3 => {
  const l = length(p) || 1;
  return [p[0] / l, p[1] / l, p[2] / l];
};
export const mixV = (p: V3, q: V3, f: number): V3 => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f, p[2] + (q[2] - p[2]) * f];

/** Nothing nearer the camera than this is drawn (metres). */
export const NEAR = 0.06;

export interface Camera {
  pos: V3;
  /** Unit vectors: right, up and ahead. The camera never rolls: right is always level. */
  right: V3;
  up: V3;
  ahead: V3;
  /** Focal length, in frame units. */
  f: number;
  /** Where the line of sight meets the frame. */
  cx: number;
  cy: number;
}

export function camera(pos: V3, target: V3, f: number, cx: number, cy: number): Camera {
  const ahead = normalize(sub(target, pos));
  const right = normalize(cross([0, 1, 0], ahead));
  const up = cross(ahead, right);
  return { pos, right, up, ahead, f, cx, cy };
}

/** A world point in the camera's coordinates: x right, y up, z its distance ahead. */
export function toCamera(cam: Camera, p: V3): V3 {
  const d = sub(p, cam.pos);
  return [dot(d, cam.right), dot(d, cam.up), dot(d, cam.ahead)];
}

/** A point in camera coordinates, on the frame. */
export function onFrame(cam: Camera, c: V3): Pt {
  return [cam.cx + (cam.f * c[0]) / c[2], cam.cy - (cam.f * c[1]) / c[2]];
}

/** Whether a face with this outward normal, through this point, faces the camera. */
export function facesCamera(cam: Camera, normal: V3, at: V3): boolean {
  return dot(normal, sub(cam.pos, at)) > 0;
}

/** A polygon in camera coordinates, cut to the part in front of the near plane (Sutherland–Hodgman). */
export function clipNear(points: readonly V3[]): V3[] {
  const out: V3[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const q = points[(i + 1) % points.length];
    const pin = p[2] >= NEAR;
    const qin = q[2] >= NEAR;
    if (pin) out.push(p);
    if (pin !== qin) out.push(mixV(p, q, (NEAR - p[2]) / (q[2] - p[2])));
  }
  return out;
}

/** A segment in camera coordinates, cut to the part in front of the near plane; null when none is. */
export function clipSegment(p: V3, q: V3): [V3, V3] | null {
  if (p[2] < NEAR && q[2] < NEAR) return null;
  if (p[2] >= NEAR && q[2] >= NEAR) return [p, q];
  const m = mixV(p, q, (NEAR - p[2]) / (q[2] - p[2]));
  return p[2] < NEAR ? [m, q] : [p, m];
}

/** A point turned about the vertical axis by `angle` (radians), then moved to `at`. Angle 0 faces +z. */
export function place(local: V3, angle: number, at: V3): V3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [at[0] + local[0] * c + local[2] * s, at[1] + local[1], at[2] - local[0] * s + local[2] * c];
}

/**
 * A value on a smooth curve through keyframes, at `t` from 0 (the first) to keys.length − 1 (the
 * last): uniform Catmull-Rom, so a move across several keyframes passes through them without a
 * corner or a stop, and lands exactly on each at whole `t`.
 */
export function along(t: number, keys: readonly number[]): number {
  const c = Math.min(Math.max(t, 0), keys.length - 1);
  const i = Math.min(Math.floor(c), keys.length - 2);
  const u = c - i;
  const p0 = keys[Math.max(i - 1, 0)];
  const p1 = keys[i];
  const p2 = keys[i + 1];
  const p3 = keys[Math.min(i + 2, keys.length - 1)];
  return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
}

export function alongV(t: number, keys: readonly V3[]): V3 {
  return [along(t, keys.map((k) => k[0])), along(t, keys.map((k) => k[1])), along(t, keys.map((k) => k[2]))];
}
