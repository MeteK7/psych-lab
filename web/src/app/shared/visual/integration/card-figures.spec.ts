import { SCENES } from '../scenes';
import { CARD_STATE } from '../scenes/cards';
import { CARD_FIGURES, CardFigureSource } from './card-figures';

describe('card figures source', () => {
  it('maps each exercise to its registered card figure, and every card figure to its exercise', () => {
    const cards = SCENES.filter(({ scene }) => scene.id.startsWith('card.'));
    expect(cards).toHaveLength(Object.keys(CARD_FIGURES).length);
    for (const { scene } of cards) {
      const exercise = scene.alt[CARD_STATE].split('.')[2];
      expect(CARD_FIGURES[exercise], scene.id).toBe(scene.id);
    }
  });

  it("answers an exercise with its figure in the card state, with the card's text alternative", async () => {
    const visual = await new CardFigureSource().resolve({ scene: 'cs_camera_angle' });
    expect(visual.kind).toBe('component');
    if (visual.kind !== 'component') return;
    expect(visual.inputs?.['state']).toBe(CARD_STATE);
    expect((visual.inputs?.['scene'] as { id: string }).id).toBe('card.camera-angle');
    expect(visual.alt).toContain('stepped back');
  });

  it('shows nothing for an exercise without a card figure, or a name that is not an exercise', async () => {
    expect(await new CardFigureSource().resolve({ scene: 'not_an_exercise' })).toEqual({ kind: 'none' });
    expect(await new CardFigureSource().resolve({ scene: 'toString' })).toEqual({ kind: 'none' });
  });
});
