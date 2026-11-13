import { MCII } from '../../../../../content';
import { sceneFor } from '../../../../experiences/mcii/mcii-scenes';
import { MciiStage } from '../../../../experiences/mcii/mcii-logic';
import { Geometry } from '../../composition/scene';
import { buildFrame, buildTimeline, contentText } from '../../integration/pipeline';
import { movers } from '../../motion/plan-motion';
import { resolveState } from '../../state/resolve-state';
import { frameSize } from '../../styling/vocabulary';
import { MCII_PATH } from './mcii-path.scene';

/**
 * Scene policy for mcii.path (docs/mcii-design.md §5, docs/visual-policy.md §8), as assertions
 * against the scene. A change that breaks one of these needs the scene policy changed first.
 */
const text = contentText({ mcii: MCII });
const STATES = ['future', 'contrast', 'plan', 'aside'];
const STAGES: MciiStage[] = ['mcii_wish', 'mcii_outcome', 'mcii_obstacle', 'mcii_decide', 'mcii_plan', 'mcii_close'];
const element = (id: string) => MCII_PATH.layers.flatMap((l) => l.elements).find((e) => e.id === id)!;
const geometry = (id: string) => (element(id) as { geometry: Geometry }).geometry;
const paint = (state: string, id: string) => {
  const item = buildFrame(MCII_PATH, state, text).items.find((i) => i.id === id);
  return item?.kind === 'shape' ? item.paint : undefined;
};

describe('mcii.path scene policy', () => {
  it('has a state for every scene the exercise asks for', () => {
    expect(Object.keys(MCII_PATH.states.states).sort()).toEqual([...STATES].sort());
    for (const stage of STAGES)
      for (const choice of ['keep', 'set_aside', null] as const)
        expect(STATES).toContain(sceneFor(stage, choice).scene.replace('mcii.', ''));
  });

  it('keeps the existing text alternatives and labels (plan decision D12)', () => {
    for (const s of STATES) expect(MCII_PATH.alt[s]).toBe(`mcii.scenes.${s}.alt`);
  });

  it('shows the future without the obstacle or a plan, and nothing achieved', () => {
    const t = resolveState(MCII_PATH, 'future');
    for (const id of ['wall', 'bridge', 'label-obstacle', 'label-plan']) expect(t[id].visible, id).toBe(false);
  });

  it('gives the marker and the wall equal weight once the obstacle is shown', () => {
    for (const s of ['contrast', 'plan']) {
      const t = resolveState(MCII_PATH, s);
      expect(t['wish'].emphasis, s).toBe('normal');
      expect(t['wall'].emphasis, s).toBe('normal');
      expect(paint(s, 'wall'), s).toEqual(paint(s, 'wish'));
    }
  });

  it('keeps the wall low: at most a third of the frame height', () => {
    const wall = geometry('wall');
    if (wall.type !== 'rect') throw new Error('unexpected geometry');
    expect(wall.height).toBeLessThanOrEqual(frameSize(MCII_PATH.frame).height / 3);
  });

  it('draws the bridge dashed in every state that shows it, because a plan is not an achievement', () => {
    expect(element('bridge')).toMatchObject({ style: { dash: 'intended' } });
    for (const s of STATES) if (resolveState(MCII_PATH, s)['bridge'].visible) expect(paint(s, 'bridge')?.dash, s).toBe('7 7');
  });

  it('quietens the path when the wish is set aside, with no obstacle, plan or focus', () => {
    const t = resolveState(MCII_PATH, 'aside');
    for (const id of ['path', 'now']) expect(t[id].emphasis, id).toBe('receded');
    for (const id of ['wall', 'bridge']) expect(t[id].visible, id).toBe(false);
    expect(Object.values(t).some((x) => x.emphasis === 'focal')).toBe(false);
  });

  it('keeps the wish in its colour in every state, because it stands for hope (visual-policy.md §3.9)', () => {
    for (const s of STATES) {
      expect(resolveState(MCII_PATH, s)['wish'].emphasis, s).not.toBe('receded');
      expect(paint(s, 'wish')?.stroke, s).toContain('var(--vis-subject)');
      expect(paint(s, 'wish-centre')?.fill, s).toContain('var(--vis-subject)');
    }
  });

  it('contains only the elements the scene policy names: nothing decorative', () => {
    const ids = MCII_PATH.layers.flatMap((l) => l.elements.map((e) => e.id)).sort();
    expect(ids).toEqual(
      ['path', 'now', 'wish', 'wish-centre', 'wall', 'wall-courses', 'bridge', 'label-now', 'label-wish', 'label-obstacle', 'label-plan'].sort(),
    );
  });

  it('keeps every element in the same place in every state, so only the meaningful change shows', () => {
    const at = new Map<string, unknown>();
    for (const s of STATES)
      for (const item of buildFrame(MCII_PATH, s, text).items) {
        const where = item.kind === 'shape' ? item.shape : [item.x, item.y];
        if (at.has(item.id)) expect(where, `${item.id} in ${s}`).toEqual(at.get(item.id));
        else at.set(item.id, where);
      }
  });

  describe('motion', () => {
    /** The scene changes a run through the exercise makes, for each final choice. */
    const changes = () => {
      const seen = new Set<string>();
      for (const choice of ['keep', 'change', 'set_aside'] as const) {
        const scenes = STAGES.map((stage) => sceneFor(stage, choice).scene.replace('mcii.', ''));
        scenes.slice(1).forEach((to, i) => scenes[i] !== to && seen.add(`${scenes[i]} → ${to}`));
      }
      return [...seen].sort();
    };

    it('declares exactly the changes the exercise makes, so each one is reviewed', () => {
      expect((MCII_PATH.transitions ?? []).map(([a, b]) => `${a} → ${b}`).sort()).toEqual(changes());
    });

    it("doesn't move while the person decides: the decision step shows the obstacle step's picture, with no change", () => {
      for (const choice of ['keep', 'change', 'set_aside', null] as const)
        expect(sceneFor('mcii_decide', choice)).toEqual({ scene: sceneFor('mcii_obstacle', choice).scene });
    });

    it('asks only for the changes it declares: each step names the scene before it when that differs', () => {
      const asked = new Set<string>();
      for (const choice of ['keep', 'change', 'set_aside'] as const)
        for (const stage of STAGES) {
          const { scene, facets } = sceneFor(stage, choice);
          if (facets?.['from']) asked.add(`${facets['from'].replace('mcii.', '')} → ${scene.replace('mcii.', '')}`);
        }
      expect([...asked].sort()).toEqual(changes());
    });

    it('raises the wall into place, with its courses and label, when the obstacle appears', () => {
      const m = movers(MCII_PATH, 'future', 'contrast').find((x) => x.id === 'wall');
      expect(m).toMatchObject({ change: { kind: 'enter', effect: 'rise' }, with: ['wall-courses', 'label-obstacle'] });
    });

    it('draws the bridge in the reading direction, from this side of the wall to the far side', () => {
      expect(movers(MCII_PATH, 'contrast', 'plan')).toEqual([
        expect.objectContaining({ id: 'bridge', change: expect.objectContaining({ effect: 'draw' }), with: ['label-plan'] }),
      ]);
      const d = (element('bridge') as { geometry: { d: string } }).geometry.d;
      const xs = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map((n) => Number(n[0])).filter((_, i) => i % 2 === 0);
      expect(xs[0]).toBeLessThan(xs[xs.length - 1]);
    });

    it('only quietens the path when the wish is set aside: nothing new appears, the wish keeps its colour', () => {
      expect(movers(MCII_PATH, 'contrast', 'aside').map((m) => [m.id, m.change.kind])).toEqual([
        ['path', 'emphasis'],
        ['now', 'emphasis'],
      ]);
      for (const [from, to] of MCII_PATH.transitions ?? [])
        for (const t of buildTimeline(MCII_PATH, from, to, 'full'))
          if (t.id === 'wish' && t.property === 'paint') expect(t.to.stroke, `${from} → ${to}`).toContain('var(--vis-subject)');
    });

    it('shows the final state at once under reduced motion', () => {
      for (const [from, to] of MCII_PATH.transitions ?? []) expect(buildTimeline(MCII_PATH, from, to, 'reduced')).toEqual([]);
    });
  });
});
