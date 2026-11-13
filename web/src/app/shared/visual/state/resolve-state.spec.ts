import { MCII_PATH } from '../scenes/action/mcii-path.scene';
import { resolveState } from './resolve-state';

describe('resolveState', () => {
  it('gives every element a target, hidden unless listed', () => {
    const t = resolveState(MCII_PATH, 'future');
    expect(t['wish']).toEqual({ visible: true, emphasis: 'focal' });
    expect(t['wall']).toEqual({ visible: false, emphasis: 'normal' });
    expect(Object.keys(t)).toHaveLength(MCII_PATH.layers.flatMap((l) => l.elements).length);
  });

  it('defaults emphasis to normal', () => {
    expect(resolveState(MCII_PATH, 'contrast')['wall']).toEqual({ visible: true, emphasis: 'normal' });
  });

  it('rejects an unknown state', () => {
    expect(() => resolveState(MCII_PATH, 'celebrate')).toThrow("Scene 'mcii.path' has no state 'celebrate'");
  });
});
