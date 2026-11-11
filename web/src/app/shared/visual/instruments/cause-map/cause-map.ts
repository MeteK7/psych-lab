import { Composed, composeScene } from '../../composition/compose';
import type { Geometry, Layer, Purpose, SceneElement } from '../../composition/scene';
import type { StyleRef, ThemeId } from '../../styling/vocabulary';

/**
 * The CS2 cause map (docs/cs2-visual-proposal.md), the Visual System's first instrument
 * (docs/visual-system.md §7, tier 2): a plain map with two scales on which each cause sits at
 * its answers. The exercise's sliders set the answers; the map shows them. Its frame is built
 * from the exercise's data, because the number of causes and their places come from the person.
 *
 * It gets numbers and places only, never the cause texts: those stay in the page list under the
 * figure. It is a composition built from data (composition/compose.ts), drawn through the same
 * pipeline as every scene. Policy assertions: `cause-map.policy.spec.ts`.
 */
export const CAUSE_MAP = { id: 'cs2.cause-map', version: 1, theme: 'cognitive' as ThemeId } as const;

export interface CauseMapInput {
  /** Each cause's answers on the two charted scales, 1–5, in list order. */
  causes: readonly { who: number; time: number }[];
  /** The 1-based number of the cause being placed, or 0 when none is. */
  placing: number;
  /** The scale ends, in the exercise's own words. */
  axes: { left: string; right: string; top: string; bottom: string };
}

/** Causes that share both answers: drawn as one mark listing their numbers, in list order. */
export interface Place {
  who: number;
  time: number;
  numbers: number[];
}

// Design size, in CSS px at the chart's usual width (1 unit = 1 px), so labels and numbers render
// at their S1 sizes. The left margin holds the vertical scale's labels, so they're never cut off.
const WIDTH = 416;
const HEIGHT = 284;
export const PLOT = { left: 124, top: 10, right: 404, bottom: 250 };
const INSET = { x: 26, y: 22 };
const R = 13; // a mark's radius
const SPACING = 16; // between numbers in a shared mark

export function groupByPlace(causes: CauseMapInput['causes']): Place[] {
  const places: Place[] = [];
  causes.forEach(({ who, time }, i) => {
    const place = places.find((p) => p.who === who && p.time === time);
    if (place) place.numbers.push(i + 1);
    else places.push({ who, time, numbers: [i + 1] });
  });
  return places;
}

/** Where answers (1–5 each) sit on the map. */
export function pointOf(who: number, time: number): { x: number; y: number } {
  const x0 = PLOT.left + INSET.x;
  const y0 = PLOT.top + INSET.y;
  return {
    x: x0 + ((who - 1) / 4) * (PLOT.right - INSET.x - x0),
    y: y0 + ((time - 1) / 4) * (PLOT.bottom - INSET.y - y0),
  };
}

/** A shared mark grows sideways; it stays inside the map and always covers its place. */
function markShape(x: number, y: number, count: number): { shape: Geometry; left: number } {
  if (count === 1) return { shape: { type: 'circle', cx: x, cy: y, r: R }, left: x - R };
  const width = 2 * R + (count - 1) * SPACING;
  const left = Math.min(Math.max(x - width / 2, PLOT.left + 3), PLOT.right - 3 - width);
  return { shape: { type: 'rect', x: left, y: y - R, width, height: 2 * R, rx: R }, left };
}

const PURPOSE = (id: string): Purpose => CAUSE_MAP_PURPOSES.find((p) => p.id === id)!.purpose;

export function composeCauseMap({ causes, placing, axes }: CauseMapInput): Composed {
  const text: Record<string, string> = {
    'axis.left': axes.left,
    'axis.right': axes.right,
    'axis.top': axes.top,
    'axis.bottom': axes.bottom,
  };
  const shape = (id: string, geometry: Geometry, style: StyleRef, purpose: Purpose): SceneElement => ({
    kind: 'shape',
    id,
    geometry,
    style,
    purpose,
  });
  const label = (id: string, key: string, x: number, y: number, align: 'start' | 'middle' | 'end', tone: 'label' | 'label-soft', purpose: Purpose, bold = false): SceneElement => ({
    kind: 'label',
    id,
    text: key,
    at: [x, y],
    align,
    tone,
    purpose,
    ...(bold ? { weight: 'bold' as const } : {}),
  });

  const line: StyleRef = { role: 'context', line: 'hair' };
  const { left, top, right, bottom } = PLOT;
  const mid = pointOf(3, 3);
  const scale: SceneElement[] = [
    shape('frame', { type: 'rect', x: left, y: top, width: right - left, height: bottom - top, rx: 6 }, line, PURPOSE('frame')),
    shape('mid-who', { type: 'line', x1: mid.x, y1: top, x2: mid.x, y2: bottom }, line, PURPOSE('mid-who, mid-time')),
    shape('mid-time', { type: 'line', x1: left, y1: mid.y, x2: right, y2: mid.y }, line, PURPOSE('mid-who, mid-time')),
    label('axis-left', 'axis.left', left, bottom + 24, 'start', 'label-soft', PURPOSE('axis-*')),
    label('axis-right', 'axis.right', right, bottom + 24, 'end', 'label-soft', PURPOSE('axis-*')),
    label('axis-top', 'axis.top', left - 10, top + 14, 'end', 'label-soft', PURPOSE('axis-*')),
    label('axis-bottom', 'axis.bottom', left - 10, bottom - 4, 'end', 'label-soft', PURPOSE('axis-*')),
  ];

  const marks: SceneElement[] = [];
  let focal: string | null = null;
  for (const place of groupByPlace(causes)) {
    const { x, y } = pointOf(place.who, place.time);
    const { shape: geometry, left: from } = markShape(x, y, place.numbers.length);
    const id = `mark-${place.numbers[0]}`;
    const current = place.numbers.includes(placing);
    if (current) focal = id;
    marks.push(shape(`${id}-back`, geometry, { role: 'ground', material: 'tonal' }, PURPOSE('mark-*-back')));
    marks.push(shape(id, geometry, { role: current ? 'subject' : 'context' }, current ? PURPOSE('placing') : PURPOSE('mark-*')));
    place.numbers.forEach((n, j) => {
      text[`num.${n}`] = String(n);
      marks.push(label(`${id}-num-${n}`, `num.${n}`, from + R + j * SPACING, y + 5, 'middle', 'label', PURPOSE('mark-*-num-*'), n === placing));
    });
  }

  const layers: Layer[] = [
    { id: 'scale', plane: 'annotation', elements: scale },
    { id: 'causes', plane: 'subject', elements: marks },
  ];
  return composeScene(
    {
      id: CAUSE_MAP.id,
      version: CAUSE_MAP.version,
      theme: CAUSE_MAP.theme,
      size: { width: WIDTH, height: HEIGHT },
      layers,
      ...(focal ? { emphasis: { [focal]: 'focal' as const } } : {}),
      alt: 'A map of the causes on two scales: about me or the situation, and lasting or just this time.',
    },
    text,
  );
}

/** Why each element is there (docs/visual-policy.md principle 6), for reviewers and the Visual Lab. */
export const CAUSE_MAP_PURPOSES: readonly { id: string; purpose: Purpose }[] = [
  { id: 'frame', purpose: { serves: ['understanding'], why: 'The extent of the scales: where "fully about me" and "fully about the situation" are.' } },
  { id: 'mid-who, mid-time', purpose: { serves: ['understanding'], why: "Which side of each scale a cause is on; step 5's notes are about sides. Solid, because a dash means \"intended\" on the platform." } },
  { id: 'axis-*', purpose: { serves: ['understanding'], why: "What the two directions mean, in the sliders' own words. Laid out inside the figure, so they're never cut off." } },
  { id: 'mark-*', purpose: { serves: ['concept', 'understanding'], why: 'Each cause as a separate thing in a place: most things have more than one cause. Causes in the same place share one mark listing their numbers, so none is hidden and none is moved off its answers.' } },
  { id: 'mark-*-back', purpose: { serves: ['understanding'], why: 'Keeps the numbers readable where a mark sits on a midline.' } },
  { id: 'mark-*-num-*', purpose: { serves: ['understanding'], why: "Which cause is which, matched to the list under the map." } },
  { id: 'placing', purpose: { serves: ['interaction', 'feedback'], why: "Which mark the sliders move: the Cognitive colour, a heavier line and a bold number, so it never depends on colour alone. The other causes stay neutral; no cause is coloured by where it is." } },
];
