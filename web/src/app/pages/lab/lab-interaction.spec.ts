import { SHOWN, lookupOf } from '../../shared/visual/composition/compose';
import { spacingWarnings } from '../../shared/visual/composition/spacing';
import { validateScene } from '../../shared/visual/composition/validate';
import { hitTest, placeAt, targetsOf } from '../../shared/visual/interaction/regions';
import { CHOICES, choiceFigure, fieldFigure, ratingFigure } from './lab-interaction-figures';

describe('Visual Lab: interaction references (M4)', () => {
  it('are valid for every value, with labels clear of what they do not name', () => {
    const figures = [
      ...[1, 2, 3, 4, 5].map((v) => ratingFigure(v)),
      ...[1, 3, 5].flatMap((a) => [1, 3, 5].map((u) => fieldFigure(a, u))),
      ...CHOICES.map((c) => choiceFigure(c)),
    ];
    for (const composed of figures) {
      expect(validateScene(composed.scene, lookupOf(composed)), composed.text['alt']).toEqual([]);
      expect(spacingWarnings(composed.scene, lookupOf(composed)), composed.text['alt']).toEqual([]);
    }
  });

  it('place a handle where a click lands, in the figure’s own values', () => {
    const field = fieldFigure(2, 4);
    const targets = targetsOf(field.scene, SHOWN);
    const hit = hitTest(targets, [345, 85]);
    expect(hit?.kind).toBe('track');
    if (hit?.kind !== 'track') return;
    expect(placeAt(field.scene, hit.target, [345, 85])).toEqual({ across: 4, up: 4 });
    // Drawn at that value, the mark sits where the click was, give or take half a step.
    const moved = targetsOf(fieldFigure(4, 4).scene, SHOWN).find((t) => t.hit.kind === 'handle')!;
    expect(hitTest([moved], [345, 85])?.kind).toBe('handle');
  });

  it('choose a region as a whole', () => {
    const targets = targetsOf(choiceFigure('first').scene, SHOWN);
    expect(hitTest(targets, [390, 60])).toMatchObject({ kind: 'region', target: { value: 'choice', option: 'third' } });
  });
});
