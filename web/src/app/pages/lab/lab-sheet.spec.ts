import { lookupOf } from '../../shared/visual/composition/compose';
import { spacingWarnings } from '../../shared/visual/composition/spacing';
import { validateScene } from '../../shared/visual/composition/validate';
import { buildComposedFrame } from '../../shared/visual/integration/pipeline';
import { LINE_ORDER, MATERIALS, THEMES } from '../../shared/visual/styling/vocabulary';
import { AREAS, depthFigure, linesFigure, materialsFigure, typeFigure } from './lab-sheet-figures';

describe('Visual Lab: the visual-language review sheet (M3 stage C)', () => {
  const figures = [linesFigure(), typeFigure(), ...AREAS.flatMap((a) => [materialsFigure(a.theme), depthFigure(a.theme)])];

  it('covers every area', () => {
    expect(AREAS.map((a) => a.theme).sort()).toEqual(Object.keys(THEMES).sort());
  });

  it('draws valid figures from the real pipeline', () => {
    for (const composed of figures) {
      expect(validateScene(composed.scene, lookupOf(composed)), composed.scene.id).toEqual([]);
      expect(buildComposedFrame(composed).items.length, composed.scene.id).toBeGreaterThan(2);
    }
  });

  it('shows every line weight, both dashes and every material', () => {
    const lines = linesFigure().scene.layers.flatMap((l) => l.elements).filter((e) => e.kind === 'shape');
    expect(lines.map((e) => (e.kind === 'shape' ? e.style.line : null)).slice(0, LINE_ORDER.length)).toEqual([...LINE_ORDER]);
    expect(lines.map((e) => (e.kind === 'shape' ? e.style.dash : null)).filter(Boolean)).toEqual(['intended', 'tentative']);
    const used = new Set<string>();
    for (const composed of [materialsFigure('action'), depthFigure('action')])
      for (const e of composed.scene.layers.flatMap((l) => l.elements)) if (e.kind !== 'label') used.add(e.style.material ?? 'line');
    expect([...used].sort()).toEqual([...MATERIALS].sort());
  });

  it('keeps every label clear of forms it does not name, except the type figure\'s example without a halo', () => {
    for (const composed of figures) {
      const warnings = spacingWarnings(composed.scene, lookupOf(composed));
      if (composed.scene.id === 'reference.sheet.type') expect(warnings).toEqual(["label 'no-halo' is 0.0 units from the form 'near', which it doesn't name (at least 8)"]);
      else expect(warnings, composed.scene.id).toEqual([]);
    }
  });

  it('wraps the long label in the type figure', () => {
    const wrapped = buildComposedFrame(typeFigure()).items.find((i) => i.id === 'wrapped');
    expect(wrapped?.kind === 'text' && wrapped.lines!.length).toBeGreaterThan(1);
    expect(buildComposedFrame(typeFigure()).items.find((i) => i.id === 'halo')).toHaveProperty('halo');
  });
});
