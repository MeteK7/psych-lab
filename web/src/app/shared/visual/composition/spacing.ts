import { resolveLabel, resolveStyle } from '../styling/resolve';
import { LABEL_CLEARANCE, LINE_HEIGHT, TYPE_EXTENT, textWidth, wrapText } from '../styling/type';
import { PLANE_ROLES } from '../styling/vocabulary';
import type { Box } from './bounds';
import { Form, Pt, formOutline, insideOutline, pointToBox, pointToSegment } from './outline';
import { SceneDefinition, SceneElement, TextLookup } from './scene';

type Label = Extract<SceneElement, { kind: 'label' }>;

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

/**
 * How far a label's glyphs are from a form, in scene units: from the edge of its line (half the
 * line's width), or 0 when they touch or the label lies on a filled form. Planes are surfaces a
 * label may sit on, so only their lines count, and a label with a halo may cross a plane's edge.
 */
export function labelDistance(scene: SceneDefinition, label: Label, form: Form, text: TextLookup): number {
  const box = labelBox(label, text);
  const lines = formOutline(scene, form);
  const paint = resolveStyle(form.style);
  let d = Infinity;
  for (const { points, closed } of lines) {
    const n = closed ? points.length : points.length - 1;
    for (let k = 0; k < n; k++) d = Math.min(d, segmentToBox(points[k], points[(k + 1) % points.length], box));
  }
  const filled = paint.fill !== 'none' || !!paint.gradient;
  const plane = PLANE_ROLES.includes(form.style.role);
  if (filled && !plane && insideOutline([box.x + box.width / 2, box.y + box.height / 2], lines)) return 0;
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
    const lines = formOutline(scene, cover, false);
    return corners.every((c) => insideOutline(c, lines));
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
