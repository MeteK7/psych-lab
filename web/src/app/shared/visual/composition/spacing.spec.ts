import { CS_WHY_IT_HAPPENED, STATE_RESET } from '../../../../content';
import { flattenPath } from '../generation/curves';
import { composeCauseMap } from '../instruments/cause-map/cause-map';
import { composeRounds } from '../instruments/rounds/rounds';
import { composeTrackingPreview } from '../instruments/tracking/tracking';
import { buildComposedFrame } from '../integration/pipeline';
import { SCENES } from '../scenes';
import { LINE_HEIGHT, TYPE_EXTENT, textWidth } from '../styling/type';
import { lookupOf } from './compose';
import { SceneDefinition, SceneElement, TextLookup } from './scene';
import { labelBox, spacingWarnings } from './spacing';
import { validateScene } from './validate';

const P = { serves: ['understanding'], why: 'Test element.' } as const;
const TEXT: TextLookup = (key) => ({ alt: 'A picture.', word: 'Word', long: 'one two three four five six' })[key];

type Label = Extract<SceneElement, { kind: 'label' }>;
const label = (extra: Partial<Label> = {}): Label => ({ kind: 'label', id: 'label', text: 'word', at: [100, 100], align: 'start', purpose: P, ...extra });

function scene(elements: SceneElement[], visible = elements.map((e) => e.id)): SceneDefinition {
  return {
    id: 'test.spacing',
    version: 1,
    theme: 'action',
    frame: 'wide',
    layers: [{ id: 'all', plane: 'subject', elements }],
    states: { initial: 'a', states: { a: { visible } } },
    alt: { a: 'alt' },
  };
}

const circle = (id: string, cx: number, cy: number, r: number, material?: 'tonal'): SceneElement => ({
  kind: 'shape',
  id,
  geometry: { type: 'circle', cx, cy, r },
  style: { role: 'subject', ...(material ? { material } : {}) },
  purpose: P,
});

describe('flattenPath', () => {
  it('flattens arcs onto their circle', () => {
    const [ring] = flattenPath('M90 50 A40 40 0 1 0 170 50 A40 40 0 1 0 90 50 Z');
    expect(ring.closed).toBe(true);
    for (const [x, y] of ring.points) expect(Math.hypot(x - 130, y - 50)).toBeCloseTo(40, 1);
  });

  it('reads relative commands, curves and several subpaths', () => {
    const lines = flattenPath('M0 0 l10 0 l0 10 z M20 0 Q30 -10 40 0 M50 0 C50 10 60 10 60 0');
    expect(lines).toHaveLength(3);
    expect(lines[0].points).toEqual([[0, 0], [10, 0], [10, 10]]);
    expect(lines[1].points.at(-1)).toEqual([40, 0]);
    expect(Math.min(...lines[1].points.map((p) => p[1]))).toBeCloseTo(-5, 1);
    expect(lines[2].points.at(-1)).toEqual([60, 0]);
  });
});

describe('labelBox', () => {
  it('places the glyphs by alignment, from the capitals to the descenders', () => {
    const w = textWidth('Word', 14);
    expect(labelBox(label(), TEXT)).toMatchObject({ x: 100, width: w, y: 100 - TYPE_EXTENT.ascent * 14 });
    expect(labelBox(label({ align: 'middle' }), TEXT).x).toBeCloseTo(100 - w / 2, 6);
    expect(labelBox(label({ align: 'end' }), TEXT).x).toBeCloseTo(100 - w, 6);
  });

  it('grows by 1.2 lines per wrapped line', () => {
    const one = labelBox(label({ text: 'long' }), TEXT);
    const wrapped = labelBox(label({ text: 'long', width: 60 }), TEXT);
    expect(wrapped.width).toBeLessThanOrEqual(60);
    const lines = Math.round((wrapped.height - one.height) / (14 * LINE_HEIGHT)) + 1;
    expect(lines).toBeGreaterThan(1);
    expect(wrapped.height).toBeCloseTo(one.height + (lines - 1) * 14 * LINE_HEIGHT, 6);
  });
});

describe('spacingWarnings: 8 units from any form a label does not name (visual-language.md §9)', () => {
  it('warns for a label closer than 8 units to a form it does not name', () => {
    // The label's glyphs end a couple of units above the circle's line.
    const warnings = spacingWarnings(scene([circle('mark', 120, 120, 14), label()]), TEXT);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/^label 'label' is \d+\.\d units from the form 'mark', which it doesn't name \(at least 8\)$/);
  });

  it("doesn't warn for a form the label names, or one far enough away", () => {
    expect(spacingWarnings(scene([circle('mark', 120, 120, 14), label({ names: ['mark'] })]), TEXT)).toEqual([]);
    expect(spacingWarnings(scene([circle('mark', 120, 140, 14), label()]), TEXT)).toEqual([]);
  });

  it('counts a label on a filled form as touching it, and one inside a ring by its distance to the line', () => {
    expect(spacingWarnings(scene([circle('disc', 115, 96, 40, 'tonal'), label()]), TEXT)[0]).toContain("is 0.0 units from the form 'disc'");
    // Inside a line-only ring, far from its line: no warning.
    expect(spacingWarnings(scene([circle('ring', 115, 96, 60), label()]), TEXT)).toEqual([]);
  });

  it("doesn't count a form hidden under an opaque form that holds the label", () => {
    const midline: SceneElement = { kind: 'shape', id: 'midline', geometry: { type: 'line', x1: 0, y1: 96, x2: 300, y2: 96 }, style: { role: 'context' }, purpose: P };
    const back: SceneElement = { kind: 'shape', id: 'back', geometry: { type: 'circle', cx: 115, cy: 96, r: 30 }, style: { role: 'ground', material: 'tonal' }, purpose: P };
    expect(spacingWarnings(scene([midline, back, label({ names: ['back'] })]), TEXT)).toEqual([]);
    // Without the back, the midline runs through the label.
    expect(spacingWarnings(scene([midline, label()]), TEXT)).toHaveLength(1);
  });

  it('lets a label sit on a plane, warns where the edge runs through it, and not with a halo', () => {
    const plane = (y: number): SceneElement => ({
      kind: 'shape',
      id: 'near',
      geometry: { type: 'rect', x: 0, y, width: 640, height: 100 },
      style: { role: 'near', material: 'tonal', edge: 'top' },
      purpose: P,
    });
    expect(spacingWarnings(scene([plane(60), label()]), TEXT)).toEqual([]);
    expect(spacingWarnings(scene([plane(96), label()]), TEXT)).toHaveLength(1);
    expect(spacingWarnings(scene([plane(96), label({ halo: true })]), TEXT)).toEqual([]);
  });

  it('only compares a label and a form shown in the same state', () => {
    const s = scene([circle('mark', 120, 120, 14), label()]);
    const apart = { ...s, states: { initial: 'a', states: { a: { visible: ['mark'] }, b: { visible: ['label'] } } }, alt: { a: 'alt', b: 'alt' } };
    expect(spacingWarnings(apart, TEXT)).toEqual([]);
  });
});

describe('the validator on labels (M3 stage C)', () => {
  it('needs a positive wrap width, and names that are forms in the scene', () => {
    const problems = validateScene(scene([circle('mark', 120, 120, 14), label({ width: 0, names: ['mark', 'nothing', 'label'] })]), TEXT);
    expect(problems).toContain("element 'label': a wrap width must be positive");
    expect(problems).toContain("element 'label': names unknown form 'nothing'");
    expect(problems).toContain("element 'label': names unknown form 'label'");
    expect(problems.filter((p) => p.includes("names unknown form 'mark'"))).toEqual([]);
  });
});

describe('the spacing of the figures in use', () => {
  const axes = CS_WHY_IT_HAPPENED.map.axes;
  const words = { left: axes[0].low, right: axes[0].high, top: axes[1].low, bottom: axes[1].high };

  it('has no warnings in the scenes, the cause map or the rounds', () => {
    for (const { scene: s, text } of SCENES) expect(spacingWarnings(s, text), s.id).toEqual([]);
    const sets = [
      { causes: [{ who: 3, time: 3 }, { who: 3, time: 3 }, { who: 3, time: 3 }], placing: 1 },
      { causes: [{ who: 1, time: 2 }, { who: 5, time: 5 }, { who: 2, time: 5 }], placing: 0 },
      { causes: Array.from({ length: 6 }, () => ({ who: 5, time: 1 })), placing: 0 },
    ];
    for (const set of sets) {
      const composed = composeCauseMap({ ...set, axes: words });
      expect(spacingWarnings(composed.scene, lookupOf(composed))).toEqual([]);
    }
    const rounds = composeRounds({ total: 8, current: 4 });
    expect(spacingWarnings(rounds.scene, lookupOf(rounds))).toEqual([]);
  });

  it('keeps the preview’s labels clear of the frame: a long one wraps within it', () => {
    const preview = composeTrackingPreview({ ringRadius: STATE_RESET.game.ring_radius, labels: STATE_RESET.how_it_works.labels });
    expect(spacingWarnings(preview.scene, lookupOf(preview))).toEqual([]);
    const ring = buildComposedFrame(preview).items.find((i) => i.id === 'label-ring');
    expect(ring?.kind === 'text' && ring.lines).toEqual(['the ring: keep your pointer', 'inside it']);
  });
});
