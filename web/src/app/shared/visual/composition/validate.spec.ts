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

  describe('entrances and transitions', () => {
    /** The base scene with `extra` shown only in a second state `b`, entering as given. */
    function entering(extra: SceneElement, more: Partial<SceneDefinition> = {}): SceneDefinition {
      const base = withElement(extra);
      const a = base.states.states['a'];
      return {
        ...base,
        states: { initial: 'a', states: { a: { ...a, visible: a.visible.filter((id) => id !== extra.id) }, b: a } },
        alt: { a: 'alt.a', b: 'alt.a' },
        ...more,
      };
    }
    const line = { kind: 'shape', id: 'arc', geometry: { type: 'path', d: 'M0 0 Q5 -5 10 0' }, style: { role: 'ink' }, purpose: P } as const;

    it('accepts an element that moves on its own with a reason, and declared transitions', () => {
      const s = entering({ ...line, enter: { effect: 'draw', why: 'A plan being made.' } }, { transitions: [['a', 'b']] });
      expect(validateScene(s, TEXT)).toEqual([]);
    });

    it('requires a reason for motion, like any element', () => {
      const s = entering({ ...line, enter: { effect: 'rise', why: ' ' } });
      expect(validateScene(s, TEXT)).toContain("element 'arc': motion without a reason; an element that moves on its own says why");
    });

    it('rejects unknown effects, drawing labels and drawing filled shapes', () => {
      expect(validateScene(entering({ ...line, enter: { effect: 'spin' as never, why: 'x' } }), TEXT)).toContain("element 'arc': unknown motion effect 'spin'");
      const label = { kind: 'label', id: 'tag', text: 'label.x', at: [0, 0], align: 'middle', purpose: P, enter: { effect: 'draw', why: 'x' } } as const;
      expect(validateScene(entering(label), TEXT)).toContain("element 'tag': a label can't draw; it fades");
      const filled = { ...line, style: { role: 'subject', material: 'tonal' }, enter: { effect: 'draw', why: 'x' } } as const;
      expect(validateScene(entering(filled), TEXT)).toContain("element 'arc': only line shapes can draw");
    });

    it('lets an element enter with a lead, but not with an unknown element or through a chain', () => {
      expect(validateScene(entering({ ...line, enter: { with: 'ghost' } }), TEXT)).toContain("element 'arc': enters with unknown element 'ghost'");
      const base = entering({ ...line, enter: { with: 'dot' } });
      const chained = { ...base, layers: base.layers.map((l) => ({ ...l, elements: l.elements.map((e) => (e.id === 'dot' ? { ...e, enter: { with: 'dot2' } } : e)) })) };
      expect(validateScene(chained, TEXT)).toContain("element 'arc': enters with 'dot', which itself enters with another element");
    });

    it('flags an entrance on an element that is never hidden, and transitions between unknown states', () => {
      const one = withElement({ ...line, enter: { effect: 'fade', why: 'x' } });
      const two = { ...one, states: { initial: 'a', states: { a: one.states.states['a'], b: one.states.states['a'] } }, alt: { a: 'alt.a', b: 'alt.a' } };
      expect(validateScene(two, TEXT)).toContain("element 'arc': has an entrance but is shown in every state");
      // A figure built from data has one state: its entrance plays when the element is new in a change (M5).
      expect(validateScene(one, TEXT).filter((p) => p.includes('entrance'))).toEqual([]);
      expect(validateScene(scene({ transitions: [['a', 'z']] }), TEXT)).toContain("transition a → z: unknown state 'z'");
    });
  });

  it('rejects raw colour values anywhere', () => {
    const s = withElement({ kind: 'shape', id: 'p', geometry: { type: 'path', d: 'M0 0 #ff0000' }, style: { role: 'subject' }, purpose: P });
    expect(validateScene(s, TEXT)).toContain('raw colour values found; use roles');
  });

  describe('motion between values (M5)', () => {
    it('asks an element that moves for its reason', () => {
      expect(validateScene(withElement({ kind: 'shape', id: 'm', geometry: circle, style: { role: 'subject' }, purpose: P, moves: { why: ' ' } }), TEXT)).toContain(
        "element 'm': motion without a reason; an element that moves on its own says why",
      );
      expect(validateScene(withElement({ kind: 'shape', id: 'm', geometry: { type: 'circle', cx: 200, cy: 20, r: 4 }, style: { role: 'subject' }, purpose: P, moves: { why: 'It follows its value.' } }), TEXT)).toEqual([]);
    });

    it('keeps moves for figures built from data: a scene’s states don’t change shapes', () => {
      const one = withElement({ kind: 'shape', id: 'm', geometry: { type: 'circle', cx: 200, cy: 20, r: 4 }, style: { role: 'subject' }, purpose: P, moves: { why: 'x' } });
      const two = { ...one, states: { initial: 'a', states: { a: one.states.states['a'], b: one.states.states['a'] } }, alt: { a: 'alt.a', b: 'alt.a' } };
      expect(validateScene(two, TEXT)).toContain("element 'm': 'moves' is for figures built from data; a scene's states don't change shapes");
    });
  });
});
