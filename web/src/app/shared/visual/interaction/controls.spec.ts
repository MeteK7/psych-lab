import { SHOWN, composeScene, lookupOf } from '../composition/compose';
import { validateScene } from '../composition/validate';
import { press } from './controller';
import { controlsOf, sliderValue } from './controls';
import { targetsOf } from './regions';

const P = { serves: ['interaction'], why: 'Test target.' } as const;

/** Two regions choosing one value, and a mark on a points scale. */
const composed = composeScene(
  {
    id: 'test.controls',
    version: 1,
    theme: 'regulation',
    size: { width: 480, height: 200 },
    scales: { level: { kind: 'points', values: ['low', 'mid', 'high'], range: [60, 420] } },
    choices: { side: { label: 'side-label' } },
    layers: [
      {
        id: 'l',
        plane: 'subject',
        elements: [
          { kind: 'shape', id: 'left', geometry: { type: 'rect', x: 20, y: 100, width: 200, height: 80, rx: 8 }, style: { role: 'context' }, purpose: P, target: { kind: 'region', value: 'side', option: 'L', label: 'left-label' } },
          { kind: 'shape', id: 'right', geometry: { type: 'rect', x: 260, y: 100, width: 200, height: 80, rx: 8 }, style: { role: 'context' }, purpose: P, target: { kind: 'region', value: 'side', option: 'R', label: 'right-label' } },
          { kind: 'shape', id: 'mark', geometry: { type: 'circle', cx: 240, cy: 40, r: 10 }, style: { role: 'subject', material: 'tonal' }, purpose: P, target: { kind: 'handle', x: { scale: 'level', value: 'level' }, label: 'mark-label' } },
        ],
      },
    ],
    alt: 'A test.',
  },
  { 'side-label': 'Side', 'left-label': 'Left', 'right-label': 'Right', 'mark-label': 'Level' },
);
const { scene } = composed;
const targets = targetsOf(scene, SHOWN);

describe('S6 controls (M4 stage C)', () => {
  it('describes a figure as the controls it stands for, in reading order, with their words', () => {
    expect(validateScene(scene, lookupOf(composed))).toEqual([]);
    const controls = controlsOf(scene, targets, { side: 'R', level: 'mid' }, lookupOf(composed));
    expect(controls.map((c) => c.kind)).toEqual(['choice', 'slider']);
    const [choice, slider] = controls;
    expect(choice).toMatchObject({ kind: 'choice', value: 'side', label: 'Side' });
    if (choice.kind !== 'choice' || slider.kind !== 'slider') throw new Error('unexpected controls');
    expect(choice.options.map((o) => [o.label, o.checked])).toEqual([
      ['Left', false],
      ['Right', true],
    ]);
    // A points scale is a slider over its values' places, announced by the value itself.
    expect(slider).toMatchObject({ label: 'Level', now: 1, min: 0, max: 2, step: 1, text: 'mid' });
    expect(sliderValue(slider, 2)).toBe('high');
    expect(sliderValue(slider, 7)).toBe('high');
  });

  it('chooses a region with a press anywhere inside it', () => {
    expect(press(scene, targets, { values: { side: 'R' }, gesture: null }, [100, 140]).state.values).toEqual({ side: 'L' });
  });

  it('asks for the words of every choice', () => {
    const bare = { ...scene, choices: undefined };
    expect(validateScene(bare, lookupOf(composed))).toEqual(
      expect.arrayContaining(["element 'left': the choice 'side' needs its words ('choices')"]),
    );
    expect(validateScene({ ...scene, choices: { side: { label: 'nothing' } } }, lookupOf(composed))).toContain("choice 'side': no content for 'nothing'");
  });
});
