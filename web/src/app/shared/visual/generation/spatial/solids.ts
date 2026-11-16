import { fmt } from '../curves';
import type { Pt, V3 } from './camera';

/**
 * S2 Generation, spatial: the solids a constructed space is made of, as geometry only. A face is a
 * flat polygon with its outward normal; a part is a tapered capsule between two points; drawing
 * order is in `order.ts`.
 */
export interface Face {
  pts: readonly V3[];
  normal: V3;
}

/** A box's six faces, each with its outward normal; `tiles` cuts its top into tiles (a large top sorts better). */
export function boxFaces(min: V3, max: V3, tiles = 1): Face[] {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  const faces: Face[] = [
    { pts: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], normal: [0, 0, -1] },
    { pts: [[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]], normal: [0, 0, 1] },
    { pts: [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]], normal: [-1, 0, 0] },
    { pts: [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], normal: [1, 0, 0] },
    { pts: [[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]], normal: [0, -1, 0] },
  ];
  for (let i = 0; i < tiles; i++)
    for (let j = 0; j < tiles; j++) {
      const ax = x0 + ((x1 - x0) * i) / tiles;
      const bx = x0 + ((x1 - x0) * (i + 1)) / tiles;
      const az = z0 + ((z1 - z0) * j) / tiles;
      const bz = z0 + ((z1 - z0) * (j + 1)) / tiles;
      faces.push({ pts: [[ax, y1, az], [bx, y1, az], [bx, y1, bz], [ax, y1, bz]], normal: [0, 1, 0] });
    }
  return faces;
}

/** Points around an ellipse lying on a horizontal plane at height `y` (a shadow on the floor). */
export function floorEllipse(x: number, z: number, rx: number, rz: number, y = 0.004, count = 20): V3[] {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    return [x + Math.cos(a) * rx, y, z + Math.sin(a) * rz];
  });
}

export function polygonPath(points: readonly Pt[]): string {
  if (!points.length) return '';
  let d = `M${fmt(points[0][0])} ${fmt(points[0][1])}`;
  for (let i = 1; i < points.length; i++) d += `L${fmt(points[i][0])} ${fmt(points[i][1])}`;
  return `${d}Z`;
}

/**
 * A tapered capsule between two points on the frame, with its own radius at each end: two
 * half-circles joined by straight sides, as one closed path. A limb drawn this way grows and
 * shrinks with distance, which a line of fixed width can't.
 */
export function capsulePath(p: Pt, q: Pt, rp: number, rq: number): string {
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const len = Math.hypot(dx, dy);
  const P = (x: number, y: number) => `${fmt(x)} ${fmt(y)}`;
  if (len < 0.01) {
    const r = Math.max(rp, rq);
    return `M${P(p[0] - r, p[1])}A${fmt(r)} ${fmt(r)} 0 1 0 ${P(p[0] + r, p[1])}A${fmt(r)} ${fmt(r)} 0 1 0 ${P(p[0] - r, p[1])}Z`;
  }
  const nx = -dy / len;
  const ny = dx / len;
  return (
    `M${P(p[0] + nx * rp, p[1] + ny * rp)}` +
    `L${P(q[0] + nx * rq, q[1] + ny * rq)}` +
    `A${fmt(rq)} ${fmt(rq)} 0 0 0 ${P(q[0] - nx * rq, q[1] - ny * rq)}` +
    `L${P(p[0] - nx * rp, p[1] - ny * rp)}` +
    `A${fmt(rp)} ${fmt(rp)} 0 0 0 ${P(p[0] + nx * rp, p[1] + ny * rp)}Z`
  );
}
