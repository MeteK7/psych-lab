import { MCII } from '../../../../../content';
import { sceneFor } from '../../../../experiences/mcii/mcii-scenes';
import { MciiStage } from '../../../../experiences/mcii/mcii-logic';
import { Geometry } from '../../composition/scene';
import { buildFrame, contentText } from '../../integration/pipeline';
import { resolveState } from '../../state/resolve-state';
import { FRAMES } from '../../styling/vocabulary';
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
    expect(wall.height).toBeLessThanOrEqual(FRAMES[MCII_PATH.frame].height / 3);
  });

  it('draws the bridge dashed in every state that shows it, because a plan is not an achievement', () => {
    expect(element('bridge')).toMatchObject({ style: { dash: 'intended' } });
    for (const s of STATES) if (resolveState(MCII_PATH, s)['bridge'].visible) expect(paint(s, 'bridge')?.dash, s).toBe('7 7');
  });

  it('recedes the route when the wish is set aside, with no obstacle, plan or focus', () => {
    const t = resolveState(MCII_PATH, 'aside');
    for (const id of ['path', 'now', 'wish', 'wish-centre']) expect(t[id].emphasis, id).toBe('receded');
    for (const id of ['wall', 'bridge']) expect(t[id].visible, id).toBe(false);
    expect(Object.values(t).some((x) => x.emphasis === 'focal')).toBe(false);
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
});
