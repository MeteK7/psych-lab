import { Composed, composeScene } from '../../shared/visual/composition/compose';
import { SceneElement } from '../../shared/visual/composition/scene';
import { LINE_HEIGHT } from '../../shared/visual/styling/type';
import { DASHES, DashPattern, LABEL_SIZES, LINE_ORDER, LINE_WEIGHTS, MaterialId, ThemeId } from '../../shared/visual/styling/vocabulary';
import { depth } from './lab-materials';

/**
 * The visual-language review sheet's figures (milestone M3 stage C): reference compositions drawn
 * by the real pipeline from the real tokens, for the review of visual-language.md (R1). Participants
 * never see them (docs/visual-system.md §5.2).
 */
const REFERENCE = { serves: ['identity' as const], why: 'Review sheet: shows a token of the visual language for review; participants never see it.' };

export const AREAS: readonly { theme: ThemeId; name: string }[] = [
  { theme: 'action', name: 'Action and growth' },
  { theme: 'cognitive', name: 'Cognitive shifts' },
  { theme: 'attention', name: 'Attention' },
  { theme: 'regulation', name: 'Emotional regulation' },
  { theme: 'recovery', name: 'Recovery after setbacks' },
];

const label = (id: string, x: number, y: number, names: string[], extra: Partial<Extract<SceneElement, { kind: 'label' }>> = {}): SceneElement => ({
  kind: 'label',
  id,
  text: id,
  at: [x, y],
  align: 'start',
  names,
  purpose: REFERENCE,
  ...extra,
});

/** Every line weight, then the two dashes, each in the subject role and named with its value. */
export function linesFigure(): Composed {
  const elements: SceneElement[] = [];
  const text: Record<string, string> = {};
  const row = (i: number, id: string, words: string, line: (typeof LINE_ORDER)[number], dash?: DashPattern) => {
    const y = 24 + i * 24;
    elements.push({ kind: 'shape', id, geometry: { type: 'line', x1: 170, y1: y, x2: 460, y2: y }, style: { role: 'subject', line, ...(dash ? { dash } : {}) }, purpose: REFERENCE });
    elements.push(label(`${id}-name`, 16, y + 5, [id]));
    text[`${id}-name`] = words;
  };
  LINE_ORDER.forEach((w, i) => row(i, `line-${w}`, `${w} · ${LINE_WEIGHTS[w]} px`, w));
  row(5, 'dash-intended', `intended · dash ${DASHES.intended}`, 'regular', 'intended');
  row(6, 'dash-tentative', 'tentative · dotted', 'regular', 'tentative');
  return composeScene(
    { id: 'reference.sheet.lines', version: 1, theme: 'action', size: { width: 480, height: 192 }, layers: [{ id: 'lines', plane: 'subject', elements }], alt: 'Review sheet: the five line weights and the two dashes' },
    text,
  );
}

/** Every material on one form each, named, in one area; translucent forms with their defined overlap. */
export function materialsFigure(theme: ThemeId): Composed {
  const form = (id: string, cx: number, material: MaterialId, r = 28): SceneElement => ({
    kind: 'shape',
    id,
    geometry: { type: 'circle', cx, cy: 64, r },
    style: { role: 'subject', material },
    purpose: REFERENCE,
  });
  const name = (id: string, x: number, names: string[]) => label(`${id}-name`, x, 124, names, { align: 'middle' });
  return composeScene(
    {
      id: `reference.sheet.materials.${theme}`,
      version: 1,
      theme,
      size: { width: 480, height: 140 },
      layers: [
        {
          id: 'forms',
          plane: 'subject',
          elements: [
            form('line', 48, 'line'),
            form('tonal', 128, 'tonal'),
            form('solid', 196, 'solid', 10),
            form('lit', 264, 'lit'),
            form('left', 356, 'translucent'),
            form('right', 396, 'translucent'),
            {
              kind: 'generated',
              id: 'both',
              generator: 'curve.lens',
              params: { x1: 356, y1: 64, r1: 28, x2: 396, y2: 64, r2: 28 },
              style: { role: 'subject', material: 'overlap' },
              purpose: REFERENCE,
              overlapOf: ['left', 'right'],
            },
          ],
        },
        {
          id: 'names',
          plane: 'annotation',
          elements: [
            name('line', 48, ['line']),
            name('tonal', 128, ['tonal']),
            name('solid', 196, ['solid']),
            name('lit', 264, ['lit']),
            name('translucent', 376, ['left', 'right', 'both']),
          ],
        },
      ],
      alt: `Review sheet: the materials in the ${theme} area`,
    },
    { 'line-name': 'line', 'tonal-name': 'tonal', 'solid-name': 'solid', 'lit-name': 'lit', 'translucent-name': 'translucent + overlap' },
  );
}

/** Depth in one area: far, middle and near planes by their top edge, and a lit subject with its contact shadow. */
export function depthFigure(theme: ThemeId): Composed {
  return depth(`sheet.depth.${theme}`, `planes in depth with a lit subject, in the ${theme} area`, false, theme);
}

/** The wrap width in the type figure, in scene units. */
export const WRAP_WIDTH = 200;

/**
 * Type in figures (§9): the two tones and bold, a label wrapped within a width, and a label over a
 * plane's edge without and with its halo. The one without is the spacing check's example: it's
 * listed as a warning under the figure.
 */
export function typeFigure(): Composed {
  const near: SceneElement = {
    kind: 'shape',
    id: 'near',
    geometry: { type: 'rect', x: -8, y: 168, width: 496, height: 48 },
    style: { role: 'near', material: 'tonal', edge: 'top' },
    purpose: REFERENCE,
  };
  return composeScene(
    {
      id: 'reference.sheet.type',
      version: 1,
      theme: 'action',
      size: { width: 480, height: 208 },
      layers: [
        { id: 'near', plane: 'near', elements: [near] },
        {
          id: 'type',
          plane: 'annotation',
          elements: [
            label('tone-label', 16, 32, []),
            label('tone-soft', 16, 60, [], { tone: 'label-soft' }),
            label('tone-bold', 16, 88, [], { weight: 'bold' }),
            label('wrapped', 264, 32, [], { width: WRAP_WIDTH }),
            label('no-halo', 16, 173, []),
            label('halo', 264, 173, [], { halo: true }),
          ],
        },
      ],
      alt: 'Review sheet: label tones, a wrapped label, and labels over a plane edge without and with a halo',
    },
    {
      'tone-label': `label · ${LABEL_SIZES.label} px`,
      'tone-soft': `label-soft · ${LABEL_SIZES['label-soft']} px`,
      'tone-bold': 'bold · the one current value',
      wrapped: `A label can wrap within a set width (here ${WRAP_WIDTH} units), at spaces, with lines ${LINE_HEIGHT} apart.`,
      'no-halo': 'Without a halo: the edge cuts it',
      halo: 'With a halo: the label reads',
    },
  );
}
