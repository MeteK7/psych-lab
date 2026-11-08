import { MCII } from '../../../../content';
import { MCII_PATH } from '../scenes/action/mcii-path.scene';
import { buildFrame, buildTimeline, contentText } from './pipeline';

const text = contentText({ mcii: MCII });

describe('buildFrame', () => {
  it('is deterministic: the same scene and state give the same frame', () => {
    expect(buildFrame(MCII_PATH, 'plan', text)).toEqual(buildFrame(MCII_PATH, 'plan', text));
  });

  it('includes only the visible elements, in layer order', () => {
    const ids = buildFrame(MCII_PATH, 'future', text).items.map((i) => i.id);
    expect(ids).toEqual(['path', 'now', 'wish', 'wish-centre', 'label-now', 'label-wish']);
  });

  it('resolves label text from content', () => {
    const label = buildFrame(MCII_PATH, 'plan', text).items.find((i) => i.id === 'label-plan');
    expect(label).toMatchObject({ kind: 'text', text: MCII.scene_labels.plan });
  });

  it('applies emphasis through paint: focal is heavier, receded is lighter', () => {
    const item = (state: string, id: string) => buildFrame(MCII_PATH, state, text).items.find((i) => i.id === id);
    expect(item('future', 'wish')).toMatchObject({ paint: { width: 3 } });
    expect(item('contrast', 'wish')).toMatchObject({ paint: { width: 2.5, stroke: 'var(--vis-subject)' } });
    expect(item('aside', 'path')).toMatchObject({ paint: { width: 1.5, stroke: 'var(--vis-context)' } });
  });

  it('resolves emphasis tracks into paint, so a backend never sees an emphasis level', () => {
    const wish = buildTimeline(MCII_PATH, 'future', 'contrast', 'full').find((t) => t.id === 'wish');
    expect(wish).toMatchObject({ property: 'paint', from: { width: 3 }, to: { width: 2.5, stroke: 'var(--vis-subject)' } });
    const rise = buildTimeline(MCII_PATH, 'future', 'contrast', 'full').filter((t) => t.id === 'wall');
    expect(rise.map((t) => t.property).sort()).toEqual(['offsetY', 'opacity']);
    expect(buildTimeline(MCII_PATH, 'future', 'contrast', 'reduced')).toEqual([]);
  });

  it('takes the frame size from the frame ratio', () => {
    expect(buildFrame(MCII_PATH, 'future', text)).toMatchObject({ width: 480, height: 120, theme: 'action' });
  });
});

describe('contentText', () => {
  it('finds nested strings and nothing else', () => {
    expect(text('mcii.scenes.future.alt')).toBe(MCII.scenes.future.alt);
    expect(text('mcii.scenes')).toBeUndefined();
    expect(text('mcii.nope.alt')).toBeUndefined();
    expect(text('constructor')).toBeUndefined();
  });
});
