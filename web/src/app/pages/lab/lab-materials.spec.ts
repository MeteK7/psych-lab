import { lookupOf } from '../../shared/visual/composition/compose';
import { validateScene } from '../../shared/visual/composition/validate';
import { buildComposedFrame } from '../../shared/visual/integration/pipeline';
import { MATERIALS_REFERENCES } from './lab-materials';

describe('Visual Lab: materials and light', () => {
  it('shows every material in valid reference compositions', () => {
    const used = new Set<string>();
    for (const { composed } of MATERIALS_REFERENCES) {
      expect(validateScene(composed.scene, lookupOf(composed)), composed.scene.id).toEqual([]);
      for (const layer of composed.scene.layers)
        for (const e of layer.elements) if (e.kind !== 'label') used.add(e.style.material ?? 'line');
      expect(buildComposedFrame(composed).items.length).toBeGreaterThan(1);
    }
    expect([...used].sort()).toEqual(['line', 'lit', 'overlap', 'shadow', 'solid', 'tonal', 'translucent']);
  });
});
