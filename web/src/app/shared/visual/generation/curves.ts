/**
 * S2 Generation: curves (docs/visual-language.md §8). Pure geometry, in scene units.
 * - Curves through points are centripetal Catmull-Rom (alpha 0.5) as cubic Béziers: tangent-
 *   continuous, with no loops or cusps.
 * - Soft constructed forms are superellipses, exponent 4 by default.
 * Path data uses at most two decimals, so the same input always gives the same string.
 */
export type Pt = readonly [number, number];

/** A number as path data: at most two decimals, no trailing zeros, never "-0". */
export function fmt(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/**
 * Bézier control points for the centripetal Catmull-Rom segment p1 → p2 (neighbours p0, p3).
 * Centripetal knots (alpha 0.5) are what keep the curve free of loops and cusps.
 */
function controls(p0: Pt, p1: Pt, p2: Pt, p3: Pt): [Pt, Pt] {
  const eps = 1e-6;
  const d1 = Math.max(Math.sqrt(dist(p0, p1)), eps);
  const d2 = Math.max(Math.sqrt(dist(p1, p2)), eps);
  const d3 = Math.max(Math.sqrt(dist(p2, p3)), eps);
  const c1: Pt = [
    (d1 * d1 * p2[0] - d2 * d2 * p0[0] + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1[0]) / (3 * d1 * (d1 + d2)),
    (d1 * d1 * p2[1] - d2 * d2 * p0[1] + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1[1]) / (3 * d1 * (d1 + d2)),
  ];
  const c2: Pt = [
    (d3 * d3 * p1[0] - d2 * d2 * p3[0] + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2[0]) / (3 * d3 * (d3 + d2)),
    (d3 * d3 * p1[1] - d2 * d2 * p3[1] + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2[1]) / (3 * d3 * (d3 + d2)),
  ];
  return [c1, c2];
}

/** A smooth path through the points: open (ends at the last point) or closed (back to the first). */
export function curveThrough(points: readonly Pt[], closed = false): string {
  if (points.length < 2) return '';
  if (points.length === 2 && !closed) return `M${fmt(points[0][0])} ${fmt(points[0][1])}L${fmt(points[1][0])} ${fmt(points[1][1])}`;
  const n = points.length;
  const at = (i: number): Pt => {
    if (closed) return points[((i % n) + n) % n];
    if (i < 0) return [2 * points[0][0] - points[1][0], 2 * points[0][1] - points[1][1]];
    if (i >= n) return [2 * points[n - 1][0] - points[n - 2][0], 2 * points[n - 1][1] - points[n - 2][1]];
    return points[i];
  };
  let d = `M${fmt(points[0][0])} ${fmt(points[0][1])}`;
  const segments = closed ? n : n - 1;
  for (let i = 0; i < segments; i++) {
    const [c1, c2] = controls(at(i - 1), at(i), at(i + 1), at(i + 2));
    const end = at(i + 1);
    d += `C${fmt(c1[0])} ${fmt(c1[1])} ${fmt(c2[0])} ${fmt(c2[1])} ${fmt(end[0])} ${fmt(end[1])}`;
  }
  return closed ? `${d}Z` : d;
}

/** Points around a superellipse: |x/rx|^n + |y/ry|^n = 1. Exponent 2 is an ellipse, 4 the soft square. */
export function superellipsePoints(cx: number, cy: number, rx: number, ry: number, exponent = 4, count = 32): Pt[] {
  const points: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    points.push([
      cx + rx * Math.sign(c) * Math.abs(c) ** (2 / exponent),
      cy + ry * Math.sign(s) * Math.abs(s) ** (2 / exponent),
    ]);
  }
  return points;
}

/** An arc of a circle, as path data; angles in degrees, 0 at three o'clock, clockwise. */
export function arc(cx: number, cy: number, r: number, from: number, to: number): string {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const sweep = to - from;
  const start: Pt = [cx + r * Math.cos(rad(from)), cy + r * Math.sin(rad(from))];
  const end: Pt = [cx + r * Math.cos(rad(to)), cy + r * Math.sin(rad(to))];
  const large = Math.abs(sweep) > 180 ? 1 : 0;
  const clockwise = sweep >= 0 ? 1 : 0;
  return `M${fmt(start[0])} ${fmt(start[1])}A${fmt(r)} ${fmt(r)} 0 ${large} ${clockwise} ${fmt(end[0])} ${fmt(end[1])}`;
}

/**
 * The lens where two circles overlap, as a closed path: the arc of each circle that lies inside the
 * other. Empty when they don't overlap; the smaller circle when one holds the other. Used for the
 * `overlap` material: the shared part of two translucent forms, drawn as its own shape.
 */
export function lens(c1: Pt, r1: number, c2: Pt, r2: number): string {
  const d = Math.hypot(c2[0] - c1[0], c2[1] - c1[1]);
  if (d >= r1 + r2) return '';
  if (d <= Math.abs(r1 - r2)) {
    const [c, r] = r1 <= r2 ? [c1, r1] : [c2, r2];
    return `M${fmt(c[0] - r)} ${fmt(c[1])}A${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(c[0] + r)} ${fmt(c[1])}A${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(c[0] - r)} ${fmt(c[1])}Z`;
  }
  const u: Pt = [(c2[0] - c1[0]) / d, (c2[1] - c1[1]) / d];
  const n: Pt = [-u[1], u[0]];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const m: Pt = [c1[0] + a * u[0], c1[1] + a * u[1]];
  const p: Pt = [m[0] + h * n[0], m[1] + h * n[1]];
  const q: Pt = [m[0] - h * n[0], m[1] - h * n[1]];
  // Each arc bulges towards the other circle's centre; it is the long way round when that centre is
  // on the far side of the chord.
  const large1 = a < 0 ? 1 : 0;
  const large2 = d - a < 0 ? 1 : 0;
  return `M${fmt(p[0])} ${fmt(p[1])}A${fmt(r1)} ${fmt(r1)} 0 ${large1} 0 ${fmt(q[0])} ${fmt(q[1])}A${fmt(r2)} ${fmt(r2)} 0 ${large2} 0 ${fmt(p[0])} ${fmt(p[1])}Z`;
}

/**
 * The bounding box of absolute path data as the generators and the backends write it (M, L, H, V,
 * C, A, Z). Curves count their control points, which hold the curve; an arc counts its end point
 * and, conservatively, its radius around it. So the box may be a little larger than the form,
 * never smaller.
 */
export function pathBounds(d: string): { x: number; y: number; width: number; height: number } | null {
  const tokens = d.match(/[MLHVCAZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  const xs: number[] = [];
  const ys: number[] = [];
  let i = 0;
  let command = '';
  let at: Pt = [0, 0];
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/^[a-z]$/i.test(tokens[i])) command = tokens[i++].toUpperCase();
    switch (command) {
      case 'M':
      case 'L':
        at = [num(), num()];
        xs.push(at[0]);
        ys.push(at[1]);
        break;
      case 'H':
        at = [num(), at[1]];
        xs.push(at[0]);
        break;
      case 'V':
        at = [at[0], num()];
        ys.push(at[1]);
        break;
      case 'C':
        for (let k = 0; k < 3; k++) {
          const p: Pt = [num(), num()];
          xs.push(p[0]);
          ys.push(p[1]);
          at = p;
        }
        break;
      case 'A': {
        const [rx, ry] = [num(), num()];
        i += 3; // rotation, large-arc and sweep flags
        at = [num(), num()];
        xs.push(at[0] - rx, at[0] + rx);
        ys.push(at[1] - ry, at[1] + ry);
        break;
      }
      case 'Z':
        break;
      default:
        i++;
    }
  }
  if (!xs.length || !ys.length) return null;
  const [x, y] = [Math.min(...xs), Math.min(...ys)];
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/** A path as polylines, one per subpath, with curves and arcs flattened. */
export interface Polyline {
  points: Pt[];
  closed: boolean;
}

/**
 * Path data flattened to polylines (every SVG command, absolute or relative): curves and arcs into
 * segments about `step` units long. Used to measure how far a label is from a form (milestone M3).
 */
export function flattenPath(d: string, step = 2): Polyline[] {
  const tokens = d.match(/[MLHVCSQTAZ]|[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/gi) ?? [];
  const out: Polyline[] = [];
  let line: Polyline | null = null;
  let at: Pt = [0, 0];
  let start: Pt = [0, 0];
  let lastControl: Pt | null = null;
  let lastQuad: Pt | null = null;
  let command = '';
  let i = 0;
  const num = () => Number(tokens[i++]);
  const isCommand = (t: string | undefined) => !!t && /^[a-z]$/i.test(t);
  const segments = (length: number) => Math.max(2, Math.min(64, Math.ceil(length / step)));
  const push = (p: Pt) => {
    line ??= { points: [at], closed: false };
    if (!out.includes(line)) out.push(line);
    line.points.push(p);
    at = p;
  };
  const cubic = (c1: Pt, c2: Pt, end: Pt) => {
    const p0 = at;
    const n = segments(dist(p0, c1) + dist(c1, c2) + dist(c2, end));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      const u = 1 - t;
      push([
        u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * end[0],
        u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * end[1],
      ]);
    }
  };
  const quad = (c: Pt, end: Pt) => {
    const p0 = at;
    const n = segments(dist(p0, c) + dist(c, end));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      const u = 1 - t;
      push([u * u * p0[0] + 2 * u * t * c[0] + t * t * end[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * end[1]]);
    }
  };
  // SVG's endpoint-to-centre conversion (SVG 1.1, appendix F.6.5).
  const arcTo = (rx: number, ry: number, rotation: number, large: boolean, sweep: boolean, end: Pt) => {
    if (!rx || !ry) return push(end);
    const phi = (rotation * Math.PI) / 180;
    const [cos, sin] = [Math.cos(phi), Math.sin(phi)];
    const dx = (at[0] - end[0]) / 2;
    const dy = (at[1] - end[1]) / 2;
    const x1 = cos * dx + sin * dy;
    const y1 = -sin * dx + cos * dy;
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    const scale = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
    if (scale > 1) {
      rx *= Math.sqrt(scale);
      ry *= Math.sqrt(scale);
    }
    const num2 = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
    const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
    const k = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num2 / den));
    const cx1 = (k * rx * y1) / ry;
    const cy1 = (-k * ry * x1) / rx;
    const cx = cos * cx1 - sin * cy1 + (at[0] + end[0]) / 2;
    const cy = sin * cx1 + cos * cy1 + (at[1] + end[1]) / 2;
    const angle = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    const theta = angle(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
    let delta = angle((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
    if (!sweep && delta > 0) delta -= 2 * Math.PI;
    if (sweep && delta < 0) delta += 2 * Math.PI;
    const n = segments(Math.abs(delta) * Math.max(rx, ry));
    for (let s = 1; s <= n; s++) {
      const a = theta + (delta * s) / n;
      const [ex, ey] = [rx * Math.cos(a), ry * Math.sin(a)];
      push(s === n ? end : [cos * ex - sin * ey + cx, sin * ex + cos * ey + cy]);
    }
  };
  while (i < tokens.length) {
    if (isCommand(tokens[i])) command = tokens[i++];
    else if (!command) {
      i++;
      continue;
    }
    const rel = command === command.toLowerCase();
    const o: Pt = rel ? at : [0, 0];
    const pt = (): Pt => [o[0] + num(), o[1] + num()];
    const upper = command.toUpperCase();
    let control: Pt | null = null;
    let quadControl: Pt | null = null;
    switch (upper) {
      case 'M':
        at = pt();
        start = at;
        line = { points: [at], closed: false };
        // Further pairs after a move are lines.
        command = rel ? 'l' : 'L';
        break;
      case 'L':
        push(pt());
        break;
      case 'H':
        push([(rel ? at[0] : 0) + num(), at[1]]);
        break;
      case 'V':
        push([at[0], (rel ? at[1] : 0) + num()]);
        break;
      case 'C': {
        const c1 = pt();
        const c2 = pt();
        const end = pt();
        cubic(c1, c2, end);
        control = c2;
        break;
      }
      case 'S': {
        const c1: Pt = lastControl ? [2 * at[0] - lastControl[0], 2 * at[1] - lastControl[1]] : at;
        const c2 = pt();
        const end = pt();
        cubic(c1, c2, end);
        control = c2;
        break;
      }
      case 'Q': {
        const c = pt();
        const end = pt();
        quad(c, end);
        quadControl = c;
        break;
      }
      case 'T': {
        const c: Pt = lastQuad ? [2 * at[0] - lastQuad[0], 2 * at[1] - lastQuad[1]] : at;
        quad(c, pt());
        quadControl = c;
        break;
      }
      case 'A': {
        const [rx, ry, rotation, large, sweep] = [num(), num(), num(), num(), num()];
        arcTo(rx, ry, rotation, !!large, !!sweep, pt());
        break;
      }
      case 'Z':
        if (line) {
          line.closed = true;
          if (!out.includes(line)) out.push(line);
        }
        at = start;
        line = null;
        break;
      default:
        i++;
    }
    lastControl = control;
    lastQuad = quadControl;
    // A closing command takes no numbers: don't repeat it on the next number.
    if (upper === 'Z' && !isCommand(tokens[i])) command = '';
  }
  return out.filter((l) => l.points.length > 1 || l.closed);
}
