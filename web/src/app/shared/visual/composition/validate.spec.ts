import { SCENES } from '../scenes';
import { SceneDefinition, SceneElement, TextLookup } from './scene';
import { validateScene } from './validate';

const P = { serves: ['understanding'], why: 'Test element.' } as const;
const TEXT: TextLookup = (key) => ({ 'alt.a': 'A picture.', 'label.x': 'X' })[key];

function scene(overrides: Partial<SceneDefinition> = {}): SceneDefinition {
  return {
    id: 'test.scene',
    version: 1,
    theme: 'action',
    frame: 'banner',
    layers: [
      {
        id: 'near',
        plane: 'near',
        elements: [
          { kind: 'shape', id: 'ground', geometry: { type: 'rect', x: 0, y: 60, width: 480, height: 60 }, style: { role: 'near', material: 'tonal' }, purpose: P },
        ],
      },
      {
        id: 'subject',
        plane: 'subject',
        elements: [
          { kind: 'shape', id: 'dot', geometry: { type: 'circle', cx: 10, cy: 10, r: 4 }, style: { role: 'subject' }, purpose: P },
          { kind: 'shape', id: 'dot2', geometry: { type: 'circle', cx: 30, cy: 10, r: 4 }, style: { role: 'subject' }, purpose: P },
          { kind: 'label', id: 'label', text: 'label.x', at: [10, 30], align: 'middle', purpose: P },
        ],
      },
    ],
    states: { initial: 'a', states: { a: { visible: ['ground', 'dot', 'dot2', 'label'], emphasis: { dot: 'focal' } } } },
    alt: { a: 'alt.a' },
    ...overrides,
  };
}

/** The base scene plus one element, shown in state `a`. */
function withElement(element: SceneElement, plane: 'near' | 'subject' = 'subject'): SceneDefinition {
  const base = scene();
  return {
    ...base,
    layers: [...base.layers, { id: 'extra', plane, elements: [element] }],
    states: { initial: 'a', states: { a: { ...base.states.states['a'], visible: [...base.states.states['a'].visible, element.id] } } },
  };
}
const circle = { type: 'circle', cx: 0, cy: 0, r: 1 } as const;

describe('validateScene', () => {
  it('accepts a valid scene', () => {
    expect(validateScene(scene(), TEXT)).toEqual([]);
  });

  it('accepts every registered composition', () => {
    for (const { scene: s, text } of SCENES) expect(validateScene(s, text), s.id).toEqual([]);
  });

  it('requires a purpose for every element: nothing decorative', () => {
    const none = withElement({ kind: 'shape', id: 'flourish', geometry: circle, style: { role: 'subject' } } as unknown as SceneElement);
    expect(validateScene(none, TEXT)).toContain("element 'flourish': no purpose; every element needs one");
    const empty = withElement({ kind: 'shape', id: 'flourish', geometry: circle, style: { role: 'subject' }, purpose: { serves: [], why: 'x' } });
    expect(validateScene(empty, TEXT)).toContain("element 'flourish': no purpose; every element needs one");
    const odd = withElement({ kind: 'shape', id: 'flourish', geometry: circle, style: { role: 'subject' }, purpose: { serves: ['looks' as never], why: 'x' } });
    expect(validateScene(odd, TEXT)).toContain("element 'flourish': unknown purpose 'looks'");
  });

  it('rejects an element that no state shows', () => {
    const base = scene();
    const dead = { ...base, layers: [...base.layers, { id: 'extra', plane: 'subject' as const, elements: [{ kind: 'shape' as const, id: 'unused', geometry: circle, style: { role: 'subject' as const }, purpose: P }] }] };
    expect(validateScene(dead, TEXT)).toContain("element 'unused': no state shows it");
  });

  it('rejects unknown and duplicate ids', () => {
    const bad = scene({ states: { initial: 'a', states: { a: { visible: ['ground', 'dot', 'dot2', 'label', 'ghost'] } } } });
    expect(validateScene(bad, TEXT)).toContain("state 'a': unknown element 'ghost'");
    const dup = withElement({ kind: 'shape', id: 'dot', geometry: circle, style: { role: 'subject' }, purpose: P });
    expect(validateScene(dup, TEXT)).toContain("element 'dot': duplicate id");
  });

  it('requires a text alternative with content for every state', () => {
    expect(validateScene(scene({ alt: {} }), TEXT)).toContain("state 'a': no text alternative");
    expect(validateScene(scene({ alt: { a: 'alt.missing' } }), TEXT)).toContain("state 'a': no content for 'alt.missing'");
  });

  it('rejects unknown vocabulary', () => {
    const s = withElement({ kind: 'shape', id: 'odd', geometry: circle, style: { role: 'hero' as never, line: 'huge' as never, material: 'glass' as never }, purpose: P });
    expect(validateScene(s, TEXT)).toEqual(
      expect.arrayContaining(["element 'odd': unknown role 'hero'", "element 'odd': unknown line weight 'huge'", "element 'odd': unknown material 'glass'"]),
    );
  });

  it('allows one focal element unless the scene policy allows more', () => {
    const two = scene({ states: { initial: 'a', states: { a: { visible: ['ground', 'dot', 'dot2', 'label'], emphasis: { dot: 'focal', dot2: 'focal' } } } } });
    expect(validateScene(two, TEXT)).toContain("state 'a': 2 focal elements; the scene allows 1");
    expect(validateScene({ ...two, policy: { maxFocal: 2 } }, TEXT)).toEqual([]);
  });

  it('keeps emphasis off planes, labels and hidden elements', () => {
    const s = scene({
      states: {
        initial: 'a',
        states: {
          a: { visible: ['ground', 'label'], emphasis: { ground: 'receded', label: 'focal', dot: 'focal' } },
          b: { visible: ['dot', 'dot2'] },
        },
      },
      alt: { a: 'alt.a', b: 'alt.a' },
    });
    expect(validateScene(s, TEXT)).toEqual(
      expect.arrayContaining([
        "state 'a': 'ground' can't take emphasis (labels and planes don't)",
        "state 'a': 'label' can't take emphasis (labels and planes don't)",
        "state 'a': emphasis on hidden element 'dot'",
      ]),
    );
  });

  it('rejects the two pairs that fail contrast on the near plane', () => {
    const line = withElement({ kind: 'shape', id: 'c', geometry: { type: 'line', x1: 0, y1: 0, x2: 1, y2: 1 }, style: { role: 'context' }, purpose: P }, 'near');
    expect(validateScene(line, TEXT)).toContain("element 'c': the 'context' role isn't allowed on the near plane");
    const soft = withElement({ kind: 'label', id: 's', text: 'label.x', at: [0, 0], align: 'start', tone: 'label-soft', purpose: P }, 'near');
    expect(validateScene(soft, TEXT)).toContain("element 's': soft labels aren't allowed on the near plane");
  });

  it('rejects raw colour values anywhere', () => {
    const s = withElement({ kind: 'shape', id: 'p', geometry: { type: 'path', d: 'M0 0 #ff0000' }, style: { role: 'subject' }, purpose: P });
    expect(validateScene(s, TEXT)).toContain('raw colour values found; use roles');
  });
});
