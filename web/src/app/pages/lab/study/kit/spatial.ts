import type { SceneElement } from '../../../../shared/visual/composition/scene';
import { Camera, V3, alongV, along, camera, clipNear, clipSegment, dot, facesCamera, normalize, onFrame, place, toCamera } from '../../../../shared/visual/generation/spatial/camera';
import { Pose } from '../../../../shared/visual/generation/spatial/figures';
import { boxFaces, capsulePath, floorEllipse, polygonPath } from '../../../../shared/visual/generation/spatial/solids';
import type { ColorRole, Facing, StyleRef } from '../../../../shared/visual/styling/vocabulary';
import { Cites, path, r2, shape } from './elements';
import type { Pt } from './paths';

/**
 * STUDY CODE: a general spatial builder for the spatial idiom, on the engine's own spatial geometry
 * (generation/spatial). The room (instruments/camera-room/room.ts) has one hand-built scene; its
 * face, person and shadow functions are private to it, so they are written again here, simplified
 * (no slabs: these scenes have no tables to sit at). Primitives log: "a spatial scene builder".
 */
export const FRAME = { width: 960, height: 540 } as const;

/** The platform light (from the upper left), as a direction in a space: the room's own. */
const LIGHT = normalize([-0.5, 0.8, -0.35]);

export function facingOf(normal: V3): Facing {
  const d = dot(normal, LIGHT);
  return d > 0.55 ? 'lit' : d > -0.1 ? 'base' : 'shade';
}

/** One drawn piece: `rank` 0 grounds, 1 shadows, 2 everything else, nearer drawn later. */
export interface Drawn {
  rank: 0 | 1 | 2;
  depth: number;
  element: SceneElement;
}

export interface Key {
  pos: V3;
  target: V3;
  f: number;
}

/** A camera on a smooth path through keys, at `t` from 0 to keys.length − 1. */
export function cameraOn(keys: readonly Key[], t: number): Camera {
  return camera(alongV(t, keys.map((k) => k.pos)), alongV(t, keys.map((k) => k.target)), along(t, keys.map((k) => k.f)), FRAME.width / 2, FRAME.height / 2);
}

/** Whether any of these points (grown by `margin`) is on the frame. */
function inView(points: readonly Pt[], margin = 0): boolean {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return Math.max(...xs) + margin >= 0 && Math.min(...xs) - margin <= FRAME.width && Math.max(...ys) + margin >= 0 && Math.min(...ys) - margin <= FRAME.height;
}

export class Space {
  readonly drawn: Drawn[] = [];
  constructor(readonly cam: Camera) {}

  /** A world point on the frame, or null behind the camera. */
  project(p: V3): Pt | null {
    const c = toCamera(this.cam, p);
    return c[2] > 0.06 ? onFrame(this.cam, c) : null;
  }

  depth(pts: readonly V3[]): number {
    return pts.reduce((s, p) => s + toCamera(this.cam, p)[2], 0) / pts.length;
  }

  /** A flat face, if it turns to the camera and is in view. */
  face(id: string, pts: readonly V3[], normal: V3, style: StyleRef, cites: Cites, why: string, rank: 0 | 2 = 2, twoSided = false): Drawn | null {
    const centre = pts.reduce<V3>((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]);
    if (!twoSided && !facesCamera(this.cam, normal, centre)) return null;
    const clipped = clipNear(pts.map((p) => toCamera(this.cam, p)));
    if (clipped.length < 3) return null;
    const onFrameAt = clipped.map((c) => onFrame(this.cam, c));
    if (!inView(onFrameAt)) return null;
    const material = style.material ?? 'shaded';
    const s: StyleRef = material === 'shaded' ? { ...style, material, facing: style.facing ?? facingOf(normal) } : style;
    const d: Drawn = { rank, depth: this.depth(pts), element: path(id, polygonPath(onFrameAt), s, cites, why) };
    this.drawn.push(d);
    return d;
  }

  /** A box's faces that turn to the camera, shaded by facing. */
  box(id: string, min: V3, max: V3, role: ColorRole, cites: Cites, why: string): void {
    boxFaces(min, max).forEach((f, i) => this.face(`${id}-${i}`, f.pts, f.normal, { role, material: 'shaded' }, cites, why));
  }

  /** A faceless person (visual-policy.md §7's exception), as one flat shape: all parts and the head. */
  person(id: string, pose: Pose, at: V3, angle: number, role: 'subject' | 'context', cites: Cites, why: string, only?: readonly string[]): Drawn | null {
    let d = '';
    const depths: number[] = [];
    for (const part of pose.parts) {
      if (only && !only.includes(part.name)) continue;
      const seg = clipSegment(toCamera(this.cam, place(part.from, angle, at)), toCamera(this.cam, place(part.to, angle, at)));
      if (!seg) continue;
      const [a, b] = seg;
      const [pa, pb] = [onFrame(this.cam, a), onFrame(this.cam, b)];
      const [ra, rb] = [(this.cam.f * part.r0) / a[2], (this.cam.f * part.r1) / b[2]];
      if (!inView([pa, pb], Math.max(ra, rb))) continue;
      d += capsulePath(pa, pb, ra, rb);
      depths.push((a[2] + b[2]) / 2);
    }
    if (!only) {
      const h = toCamera(this.cam, place(pose.head.at, angle, at));
      if (h[2] > 0.15) {
        const [x, y] = onFrame(this.cam, h);
        const r = (this.cam.f * pose.head.r) / h[2];
        const [rx, ry] = [r2(r), r2(r * 1.12)];
        d += `M${r2(x - rx)} ${r2(y)}A${rx} ${ry} 0 1 0 ${r2(x + rx)} ${r2(y)}A${rx} ${ry} 0 1 0 ${r2(x - rx)} ${r2(y)}Z`;
        depths.push(h[2]);
      }
    }
    if (!d) return null;
    // The parts twice over, as the room does: no seam where outlines cross inside the shape.
    const drawn: Drawn = { rank: 2, depth: depths.reduce((s, x) => s + x, 0) / depths.length, element: path(id, d + d, { role, material: 'shaded', facing: 'base' }, cites, why) };
    this.drawn.push(drawn);
    return drawn;
  }

  /** A soft shadow on the floor, under what it grounds. */
  shadow(id: string, grounds: string, x: number, z: number, rx: number, rz: number, cites: Cites, why: string): void {
    const clipped = clipNear(floorEllipse(x, z, rx, rz).map((p) => toCamera(this.cam, p)));
    if (clipped.length < 3) return;
    const pts = clipped.map((c) => onFrame(this.cam, c));
    if (!inView(pts)) return;
    this.drawn.push({ rank: 1, depth: 0, element: path(id, polygonPath(pts), { role: 'ink', material: 'shadow' }, cites, why, { grounds }) });
  }

  /**
   * A tube along a 3D polyline: a tapered capsule per step, joined in runs of `run` steps per shape
   * so the drawing order between a tube and a block stays right where they pass each other.
   */
  tube(id: string, pts: readonly V3[], radius: number, style: StyleRef, cites: Cites, why: string, run = 6): void {
    for (let start = 0, k = 0; start < pts.length - 1; start += run, k++) {
      let d = '';
      const depths: number[] = [];
      for (let i = start; i < Math.min(start + run, pts.length - 1); i++) {
        const seg = clipSegment(toCamera(this.cam, pts[i]), toCamera(this.cam, pts[i + 1]));
        if (!seg) continue;
        const [a, b] = seg;
        const [pa, pb] = [onFrame(this.cam, a), onFrame(this.cam, b)];
        d += capsulePath(pa, pb, (this.cam.f * radius) / a[2], (this.cam.f * radius) / b[2]);
        depths.push((a[2] + b[2]) / 2);
      }
      if (d) this.drawn.push({ rank: 2, depth: depths.reduce((s, x) => s + x, 0) / depths.length - 0.001, element: path(`${id}-${k}`, d + d, style, cites, why) });
    }
  }

  /** Beads (small round marks) at world points, as one shape, drawn just in front of the tube they ride on. */
  beads(id: string, pts: readonly V3[], radius: number, style: StyleRef, cites: Cites, why: string): void {
    let d = '';
    const depths: number[] = [];
    for (const p of pts) {
      const c = toCamera(this.cam, p);
      if (c[2] < 0.1) continue;
      const [x, y] = onFrame(this.cam, c);
      const r = Math.max(1.2, (this.cam.f * radius) / c[2]);
      d += `M${r2(x - r)} ${r2(y)}A${r2(r)} ${r2(r)} 0 1 0 ${r2(x + r)} ${r2(y)}A${r2(r)} ${r2(r)} 0 1 0 ${r2(x - r)} ${r2(y)}Z`;
      depths.push(c[2]);
    }
    if (d) this.drawn.push({ rank: 2, depth: Math.min(...depths) - 0.05, element: path(id, d, style, cites, why) });
  }

  /** A line on the floor or in the air, open or closed, drawn by its outline only. */
  outline(id: string, pts: readonly V3[], style: StyleRef, cites: Cites, why: string, closed = true): void {
    const on = pts.map((p) => this.project(p));
    if (on.some((p) => !p)) return;
    const q = on as Pt[];
    if (!inView(q)) return;
    let d = `M${r2(q[0][0])} ${r2(q[0][1])}`;
    for (let i = 1; i < q.length; i++) d += `L${r2(q[i][0])} ${r2(q[i][1])}`;
    if (closed) d += 'Z';
    this.drawn.push({ rank: 2, depth: this.depth(pts) - 0.01, element: path(id, d, style, cites, why) });
  }

  /** A label's anchor: the point on the frame above a world point. */
  anchor(p: V3, lift = 0): Pt | null {
    const q = this.project([p[0], p[1] + lift, p[2]]);
    return q ? [r2(q[0]), r2(q[1])] : null;
  }

  /** Every piece in drawing order: grounds, then shadows, then far to near. */
  elements(): SceneElement[] {
    return [...this.drawn].sort((a, b) => a.rank - b.rank || (a.rank === 2 ? b.depth - a.depth : 0)).map((d) => d.element);
  }
}

/** A ground plane reaching to the horizon, in the `far` or `mid` role. */
export function groundPlane(space: Space, id: string, half: number, role: ColorRole, cites: Cites, why: string, at: V3 = [0, 0, 0]): void {
  const [x, , z] = at;
  space.face(id, [[x - half, 0, z + half], [x + half, 0, z + half], [x + half, 0, z - half], [x - half, 0, z - half]], [0, 1, 0], { role, material: 'shaded', facing: 'lit' }, cites, why, 0);
}

/** A circle on the frame, for a 2D mark placed in a spatial view (not used in the scenes themselves). */
export const dot2 = (id: string, c: Pt, r: number, style: StyleRef, cites: Cites, why: string): SceneElement =>
  shape(id, { type: 'circle', cx: r2(c[0]), cy: r2(c[1]), r: r2(r) }, style, cites, why);
