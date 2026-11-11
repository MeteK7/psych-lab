import { Polyline, flattenPath } from '../generation/curves';
import { deriveSeed } from '../generation/random';
import { generate, generateEdge } from '../generation/registry';
import { resolveLabel, resolveStyle } from '../styling/resolve';
import { LABEL_CLEARANCE, LINE_HEIGHT, TYPE_EXTENT, textWidth, wrapText } from '../styling/type';
import { PLANE_ROLES } from '../styling/vocabulary';
import type { Box } from './bounds';
import { SceneDefinition, SceneElement, TextLookup } from './scene';

type Label = Extract<SceneElement, { kind: 'label' }>;
type Form = Exclude<SceneElement, { kind: 'label' }>;
type Pt = readonly [number, number];

/**
 * The box a label's glyphs take: its lines as wrapped by S1 (styling/type.ts), from the capitals of
 * the first line to the descenders of the last.
 */
export function labelBox(label: Label, text: TextLookup): Box {
  const { size } = resolveLabel(label.tone);
  const lines = wrapText(text(label.text) ?? '', size, label.width, label.weight);
  const width = Math.max(...lines.map((l) => textWidth(l, size, label.weight)));
  const [x, y] = label.at;
  const left = label.align === 'start' ? x : label.align === 'end' ? x - width : x - width / 2;
  const top = y - TYPE_EXTENT.ascent * size;
  const height = (TYPE_EXTENT.ascent + TYPE_EXTENT.descent) * size + (lines.length - 1) * size * LINE_HEIGHT;
  return { x: left, y: top, width, height };
}

/** A form's outline as polylines, as drawn: a plane drawn by its top edge counts only that edge. */
function outline(scene: SceneDefinition, form: Form): Polyline[] {
  const seed = deriveSeed(scene.seed ?? scene.id, form.id);
  if (form.style.edge === 'top') {
    if (form.kind === 'generated') {
      const edge = generateEdge(form.generator, form.params, seed);
      return edge ? flattenPath(edge) : [];
    }
    if (form.geometry.type === 'rect') {
      const { x, y, width } = form.geometry;
      return [{ points: [[x, y], [x + width, y]], closed: false }];
    }
  }
  if (form.kind === 'generated') return flattenPath(generate(form.generator, form.params, seed));
  const g = form.geometry;
  switch (g.type) {
    case 'line':
      return [{ points: [[g.x1, g.y1], [g.x2, g.y2]], closed: false }];
    case 'rect': {
      const r = Math.min(g.rx ?? 0, g.width / 2, g.height / 2);
      if (!r) return [{ points: [[g.x, g.y], [g.x + g.width, g.y], [g.x + g.width, g.y + g.height], [g.x, g.y + g.height]], closed: true }];
      const { x, y, width: w, height: h } = g;
      return flattenPath(
        `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} ` +
          `H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`,
      );
    }
    case 'circle':
      return flattenPath(`M${g.cx - g.r} ${g.cy} A${g.r} ${g.r} 0 1 0 ${g.cx + g.r} ${g.cy} A${g.r} ${g.r} 0 1 0 ${g.cx - g.r} ${g.cy} Z`);
    case 'ellipse':
      return flattenPath(`M${g.cx - g.rx} ${g.cy} A${g.rx} ${g.ry} 0 1 0 ${g.cx + g.rx} ${g.cy} A${g.rx} ${g.ry} 0 1 0 ${g.cx - g.rx} ${g.cy} Z`);
    case 'path':
      return flattenPath(g.d);
  }
}

function pointToSegment(p: Pt, a: Pt, b: Pt): number {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length)) : 0;
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function pointToBox(p: Pt, b: Box): number {
  const dx = Math.max(b.x - p[0], 0, p[0] - (b.x + b.width));
  const dy = Math.max(b.y - p[1], 0, p[1] - (b.y + b.height));
  return Math.hypot(dx, dy);
}

/** Whether two segments properly cross. Touching (an end on the other, or collinear overlap) is caught by the distances. */
function crosses(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const side = (p: Pt, q: Pt, r: Pt) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
}

function segmentToBox(a: Pt, b: Pt, box: Box): number {
  if (pointToBox(a, box) === 0 || pointToBox(b, box) === 0) return 0;
  const corners: Pt[] = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x + box.width, box.y + box.height],
    [box.x, box.y + box.height],
  ];
  for (let k = 0; k < 4; k++) if (crosses(a, b, corners[k], corners[(k + 1) % 4])) return 0;
  return Math.min(pointToBox(a, box), pointToBox(b, box), ...corners.map((c) => pointToSegment(c, a, b)));
}

/** Even-odd: whether a point lies inside the closed polylines. */
function inside(p: Pt, lines: Polyline[]): boolean {
  let hit = false;
  for (const { points, closed } of lines) {
    if (!closed) continue;
    for (let k = 0, j = points.length - 1; k < points.length; j = k++) {
      const [a, b] = [points[k], points[j]];
      if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit;
    }
  }
  return hit;
}

/**
 * How far a label's glyphs are from a form, in scene units: from the edge of its line (half the
 * line's width), or 0 when they touch or the label lies on a filled form. Planes are surfaces a
 * label may sit on, so only their lines count, and a label with a halo may cross a plane's edge.
 */
export function labelDistance(scene: SceneDefinition, label: Label, form: Form, text: TextLookup): number {
  const box = labelBox(label, text);
  const lines = outline(scene, form);
  const paint = resolveStyle(form.style);
  let d = Infinity;
  for (const { points, closed } of lines) {
    const n = closed ? points.length : points.length - 1;
    for (let k = 0; k < n; k++) d = Math.min(d, segmentToBox(points[k], points[(k + 1) % points.length], box));
  }
  const filled = paint.fill !== 'none' || !!paint.gradient;
  const plane = PLANE_ROLES.includes(form.style.role);
  if (filled && !plane && inside([box.x + box.width / 2, box.y + box.height / 2], lines)) return 0;
  return Math.max(0, d - paint.width / 2);
}

/** Opaque materials: what they cover doesn't show through. */
const OPAQUE = new Set(['tonal', 'solid', 'lit']);

/**
 * Whether a form is hidden where the label is: an opaque form drawn after it, and before the label,
 * covers the whole label (e.g. the cause map's midlines under a mark that holds its number).
 */
function hidden(scene: SceneDefinition, label: Label, form: Form, forms: Form[], order: Map<string, number>, text: TextLookup): boolean {
  const box = labelBox(label, text);
  const corners: Pt[] = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x + box.width, box.y + box.height],
    [box.x, box.y + box.height],
  ];
  const [from, to] = [order.get(form.id)!, order.get(label.id)!];
  return forms.some((cover) => {
    const at = order.get(cover.id)!;
    if (at <= from || at >= to || !OPAQUE.has(cover.style.material ?? 'line')) return false;
    const lines = outline(scene, { ...cover, style: { ...cover.style, edge: undefined } } as Form);
    return corners.every((c) => inside(c, lines));
  });
}

/**
 * Labels closer than the clearance (8 units, visual-language.md §9) to a form they don't name, in
 * any state that shows both. Warnings, not errors: the Visual Lab lists them for review, and a
 * figure still draws. Forms without a line (the ground), and planes under a label with a halo,
 * don't count.
 */
export function spacingWarnings(scene: SceneDefinition, text: TextLookup): string[] {
  const elements = scene.layers.flatMap((l) => l.elements);
  const labels = elements.filter((e): e is Label => e.kind === 'label');
  const forms = elements.filter((e): e is Form => e.kind !== 'label');
  const states = Object.values(scene.states.states);
  const order = new Map(elements.map((e, i) => [e.id, i]));
  const warnings: string[] = [];
  for (const label of labels)
    for (const form of forms) {
      if (label.names?.includes(form.id)) continue;
      if (hidden(scene, label, form, forms, order, text)) continue;
      if (!states.some((s) => s.visible.includes(label.id) && s.visible.includes(form.id))) continue;
      const paint = resolveStyle(form.style);
      const plane = PLANE_ROLES.includes(form.style.role);
      if (plane && (label.halo || paint.width === 0)) continue;
      if (paint.width === 0 && paint.fill === 'none' && !paint.gradient) continue;
      const d = labelDistance(scene, label, form, text);
      if (d < LABEL_CLEARANCE)
        warnings.push(`label '${label.id}' is ${d.toFixed(1)} units from the form '${form.id}', which it doesn't name (at least ${LABEL_CLEARANCE})`);
    }
  return warnings;
}
