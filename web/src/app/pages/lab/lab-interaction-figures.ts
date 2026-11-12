import { Composed, composeScene } from '../../shared/visual/composition/compose';
import { Purpose, SceneElement } from '../../shared/visual/composition/scene';

/**
 * Interaction references (milestone M4): figures built from a value, as an exercise would build
 * them, with handles, tracks and regions. Shown in the Visual Lab for review; participants never
 * see them (docs/visual-system.md §5.2).
 */
const REFERENCE = (why: string, serves: Purpose['serves'] = ['interaction']): Purpose => ({ serves, why: `Interaction reference: ${why}` });

const label = (id: string, x: number, y: number, align: 'start' | 'middle' | 'end', names: string[] = [], tone?: 'label-soft'): SceneElement => ({
  kind: 'label',
  id,
  text: id,
  at: [x, y],
  align,
  names,
  ...(tone ? { tone } : {}),
  purpose: REFERENCE('says what a part stands for.', ['understanding']),
});

export const RATING = { scale: { kind: 'linear', domain: [1, 5], range: [60, 420], step: 1 } } as const;

/** A mark on a 1–5 scale: drag it, or click the line to place it. */
export function ratingFigure(rating: number): Composed {
  const x = 60 + ((rating - 1) / 4) * 360;
  const ticks = [1, 2, 3, 4, 5].map((n) => 60 + (n - 1) * 90);
  return composeScene(
    {
      id: 'reference.interaction.rating',
      version: 1,
      theme: 'action',
      size: { width: 480, height: 100 },
      scales: { rating: RATING.scale },
      layers: [
        {
          id: 'scale',
          plane: 'annotation',
          elements: [
            {
              kind: 'shape',
              id: 'track',
              geometry: { type: 'line', x1: 60, y1: 44, x2: 420, y2: 44 },
              style: { role: 'context' },
              purpose: REFERENCE('the line the mark moves along; a click on it places the mark there.'),
            },
            {
              kind: 'shape',
              id: 'ticks',
              geometry: { type: 'path', d: ticks.map((t) => `M${t} 38 V50`).join(' ') },
              style: { role: 'context', line: 'hair' },
              purpose: REFERENCE('where the five values are.', ['understanding']),
            },
            ...ticks.map((t, i) => label(`n${i + 1}`, t, 80, 'middle', ['ticks'], 'label-soft')),
          ],
        },
        {
          id: 'mark',
          plane: 'subject',
          elements: [
            {
              kind: 'shape',
              id: 'mark',
              geometry: { type: 'circle', cx: x, cy: 44, r: 11 },
              style: { role: 'subject', material: 'tonal' },
              purpose: REFERENCE('the value, which a person moves.'),
              target: { kind: 'handle', x: { scale: 'rating', value: 'rating' }, track: 'track', label: 'mark-label' },
            },
          ],
        },
      ],
      alt: `Reference: a mark at ${rating} on a scale from 1 to 5`,
    },
    { n1: '1', n2: '2', n3: '3', n4: '4', n5: '5', 'mark-label': 'Rating' },
  );
}

export const FIELD = {
  x: { kind: 'linear', domain: [1, 5], range: [150, 410], step: 1 },
  y: { kind: 'linear', domain: [1, 5], range: [250, 30], step: 1 },
} as const;

/** A mark placed in a field with two axes, like the cause map: drag it, or click where it goes. */
export function fieldFigure(across: number, up: number): Composed {
  const at = (v: number, [r0, r1]: readonly [number, number]) => r0 + ((v - 1) / 4) * (r1 - r0);
  return composeScene(
    {
      id: 'reference.interaction.field',
      version: 1,
      theme: 'cognitive',
      size: { width: 480, height: 300 },
      scales: { across: FIELD.x, up: FIELD.y },
      layers: [
        {
          id: 'field',
          plane: 'annotation',
          elements: [
            {
              kind: 'shape',
              id: 'field',
              geometry: { type: 'rect', x: 130, y: 10, width: 300, height: 260, rx: 6 },
              style: { role: 'context', line: 'hair' },
              purpose: REFERENCE('the area the mark moves in; a click places the mark there.'),
            },
            label('x-low', 150, 292, 'middle'),
            label('x-high', 410, 292, 'middle'),
            label('y-low', 118, 255, 'end'),
            label('y-high', 118, 35, 'end'),
          ],
        },
        {
          id: 'mark',
          plane: 'subject',
          elements: [
            {
              kind: 'shape',
              id: 'mark',
              geometry: { type: 'circle', cx: at(across, FIELD.x.range), cy: at(up, FIELD.y.range), r: 13 },
              style: { role: 'subject', material: 'tonal' },
              purpose: REFERENCE('the place, which a person moves on both axes.'),
              target: { kind: 'handle', x: { scale: 'across', value: 'across' }, y: { scale: 'up', value: 'up' }, track: 'field', label: 'mark-label' },
            },
          ],
        },
      ],
      alt: `Reference: a mark at ${across} across and ${up} up, in a field from 1 to 5 each way`,
    },
    { 'x-low': '1', 'x-high': '5', 'y-low': '1', 'y-high': '5', 'mark-label': 'Place' },
  );
}

export const CHOICES = ['first', 'second', 'third'] as const;
const CHOICE_WORDS: Record<(typeof CHOICES)[number], string> = { first: 'First', second: 'Second', third: 'Third' };

/** One of three regions, chosen as a whole. */
export function choiceFigure(choice: (typeof CHOICES)[number]): Composed {
  const elements: SceneElement[] = CHOICES.flatMap((option, i): SceneElement[] => [
    {
      kind: 'shape',
      id: option,
      geometry: { type: 'rect', x: 30 + i * 150, y: 24, width: 120, height: 72, rx: 16 },
      style: option === choice ? { role: 'subject', material: 'tonal' } : { role: 'context' },
      purpose: REFERENCE('an option, chosen as a whole.'),
      target: { kind: 'region', value: 'choice', option, label: `${option}-label` },
    },
    label(`${option}-label`, 90 + i * 150, 65, 'middle', [option]),
  ]);
  return composeScene(
    {
      id: 'reference.interaction.choice',
      version: 1,
      theme: 'regulation',
      size: { width: 480, height: 120 },
      layers: [{ id: 'options', plane: 'subject', elements }],
      alt: `Reference: three options, ${CHOICE_WORDS[choice]} chosen`,
    },
    Object.fromEntries(CHOICES.map((o) => [`${o}-label`, CHOICE_WORDS[o]])),
  );
}
