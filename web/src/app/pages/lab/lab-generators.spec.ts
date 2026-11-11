import { lookupOf } from '../../shared/visual/composition/compose';
import { validateScene } from '../../shared/visual/composition/validate';
import { GENERATORS } from '../../shared/visual/generation/registry';
import { buildComposedFrame } from '../../shared/visual/integration/pipeline';
import { LAYOUTS, referenceCompositions } from './lab-generators';

describe('Visual Lab: generator reference compositions', () => {
  it('shows every generator, and every reference composition is valid and draws', () => {
    const all = referenceCompositions();
    expect(new Set(all.map((c) => c.scene.id))).toEqual(new Set(Object.keys(GENERATORS).map((id) => `reference.${id}`)));
    for (const composed of all) {
      expect(validateScene(composed.scene, lookupOf(composed)), composed.scene.id).toEqual([]);
      const [form] = buildComposedFrame(composed).items;
      expect(form.kind === 'shape' && form.shape.type === 'path' && form.shape.d.length > 20).toBe(true);
    }
  });

  it('changes a seeded form with the seed, and repeats it for the same seed', () => {
    const [a, again, b] = [referenceCompositions('one'), referenceCompositions('one'), referenceCompositions('two')];
    a.forEach((composed, i) => {
      expect(buildComposedFrame(again[i])).toEqual(buildComposedFrame(composed));
      const element = composed.scene.layers[0].elements[0];
      if (element.kind !== 'generated') throw new Error('a reference composition shows one generated form');
      // Seeded generators vary with the seed, unless their randomness is turned off (no wobble, no jitter).
      const varies = GENERATORS[element.generator].seeded && element.params['wobble'] !== 0 && element.params['jitter'] !== 0;
      const differs = JSON.stringify(buildComposedFrame(composed)) !== JSON.stringify(buildComposedFrame(b[i]));
      expect(differs, composed.scene.id).toBe(varies);
    });
  });

  it('shows every layout as a valid composition, with every item placed and drawn', () => {
    expect(LAYOUTS.map((l) => l.id)).toEqual(['grid', 'radial', 'flow', 'pack']);
    for (const { composed } of LAYOUTS) {
      expect(validateScene(composed.scene, lookupOf(composed)), composed.scene.id).toEqual([]);
      expect(buildComposedFrame(composed).items.length).toBeGreaterThan(4);
    }
  });
});
