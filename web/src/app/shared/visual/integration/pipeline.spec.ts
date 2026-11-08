import { MCII } from '../../../../content';
import { MCII_PATH } from '../scenes/action/mcii-path.scene';
import { buildFrame, contentText } from './pipeline';

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

  it('applies emphasis through paint: focal is heavier, receded is neutral', () => {
    const wish = (state: string) => buildFrame(MCII_PATH, state, text).items.find((i) => i.id === 'wish');
    expect(wish('future')).toMatchObject({ paint: { width: 3 } });
    expect(wish('contrast')).toMatchObject({ paint: { width: 2.5, stroke: 'var(--vis-subject)' } });
    expect(wish('aside')).toMatchObject({ paint: { stroke: 'var(--vis-receded)' } });
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
