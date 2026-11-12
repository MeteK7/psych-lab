import { Composed, composeScene } from '../../shared/visual/composition/compose';
import { Purpose, SceneElement } from '../../shared/visual/composition/scene';
import { radialLayout } from '../../shared/visual/generation/layouts';

/**
 * Motion references (milestone M5): figures built from data that change, as an exercise would
 * draw them again from new data. Shown in the Visual Lab for review; participants never see them.
 */
const REFERENCE = (why: string): Purpose => ({ serves: ['understanding'], why: `Motion reference: ${why}` });

/** Value sets the bars step through, each 1–5. */
export const BAR_SETS: readonly (readonly [number, number, number])[] = [
  [2, 4, 3],
  [5, 1, 3],
  [3, 3, 5],
  [1, 5, 2],
];
const BASE = 170;
const UNIT = 28;

/** Three bars whose heights are their values: they glide when the values change. */
export function barsFigure(values: readonly [number, number, number]): Composed {
  const elements: SceneElement[] = [
    {
      kind: 'shape',
      id: 'base',
      geometry: { type: 'line', x1: 60, y1: BASE, x2: 420, y2: BASE },
      style: { role: 'context' },
      purpose: REFERENCE('the line the bars stand on.'),
    },
  ];
  const text: Record<string, string> = {};
  values.forEach((v, i) => {
    const x = 90 + i * 120;
    const top = BASE - v * UNIT;
    elements.push(
      {
        kind: 'shape',
        id: `bar-${i + 1}`,
        geometry: { type: 'rect', x, y: top, width: 60, height: v * UNIT, rx: 4 },
        style: { role: 'subject', material: 'tonal' },
        purpose: REFERENCE('a value, as a height.'),
        moves: { why: 'Its height is its value: it glides, so a person can follow the change.' },
      },
      {
        kind: 'label',
        id: `value-${i + 1}`,
        text: `value-${i + 1}`,
        at: [x + 30, top - 10],
        align: 'middle',
        names: [`bar-${i + 1}`],
        purpose: REFERENCE('the value in words, on its bar.'),
      },
      {
        kind: 'label',
        id: `name-${i + 1}`,
        text: `name-${i + 1}`,
        at: [x + 30, BASE + 22],
        align: 'middle',
        tone: 'label-soft',
        names: [`bar-${i + 1}`],
        purpose: REFERENCE('which bar it is.'),
      },
    );
    text[`value-${i + 1}`] = String(v);
    text[`name-${i + 1}`] = ['A', 'B', 'C'][i];
  });
  return composeScene(
    {
      id: 'reference.motion.bars',
      version: 1,
      theme: 'attention',
      size: { width: 480, height: 200 },
      layers: [{ id: 'bars', plane: 'subject', elements }],
      alt: `Reference: three bars, A at ${values[0]}, B at ${values[1]} and C at ${values[2]}, out of 5`,
    },
    text,
  );
}

export const SET_SIZES = { min: 3, max: 8 } as const;

/** A set of members on a ring, with its outline: adding or removing one makes the others move. */
export function setFigure(count: number): Composed {
  const places = radialLayout({ count, cx: 240, cy: 120, r: 80 });
  const outline = `M${places.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L')} Z`;
  const elements: SceneElement[] = [
    {
      kind: 'shape',
      id: 'outline',
      geometry: { type: 'path', d: outline },
      style: { role: 'context', line: 'hair' },
      purpose: REFERENCE('shows the members as one set.'),
      moves: { why: 'The set’s outline follows its members; with a corner more or less, it crossfades.' },
    },
    ...places.map(
      ([cx, cy], i): SceneElement => ({
        kind: 'shape',
        id: `member-${i + 1}`,
        geometry: { type: 'circle', cx, cy, r: 12 },
        style: { role: 'subject', material: 'tonal' },
        purpose: REFERENCE('one member of the set.'),
        moves: { why: 'Each member keeps its identity while the set makes room.' },
        enter: { effect: 'fade', why: 'A new member appears where the set made room for it.' },
      }),
    ),
  ];
  return composeScene({
    id: 'reference.motion.set',
    version: 1,
    theme: 'regulation',
    size: { width: 480, height: 240 },
    layers: [{ id: 'set', plane: 'subject', elements }],
    alt: `Reference: a set of ${count} members on a ring`,
  });
}
