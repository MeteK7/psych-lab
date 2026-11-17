import { Provider } from '@angular/core';

import { NO_VISUAL, VISUAL_SOURCE, Visual, VisualRequest, VisualSource } from '../visual';

/**
 * S9 Integration: the figures on the area pages' exercise cards (scenes/cards.ts). A page asks
 * for an exercise's card with `{ scene: <exercise id> }` in a visual slot, and gets its card
 * figure in the `card` state, or nothing for an exercise without one (the slot then holds no space).
 *
 * The map is plain strings, so the page carries only this file; the scenes and the renderer load
 * on the first request, in their own chunk (§3.4 rule 8). `card-figures.spec.ts` keeps it in step
 * with the registered card scenes.
 */
export const CARD_FIGURES: Readonly<Record<string, string>> = {
  cs_other_readings: 'card.other-readings',
  cs_why_it_happened: 'card.why-it-happened',
  cs_not_enough_to_go_on: 'card.not-enough',
  cs_camera_angle: 'card.camera-angle',
  action_bridge: 'card.first-step',
  goal_restatement: 'card.goal',
  'state_reset+action_bridge': 'card.picture-dot',
  'game_only+action_bridge': 'card.dot-plan',
  mcii: 'card.wish',
};

export class CardFigureSource implements VisualSource {
  readonly id = 'card-figures';

  async resolve({ scene: exercise }: VisualRequest): Promise<Visual> {
    const sceneId = Object.hasOwn(CARD_FIGURES, exercise) ? CARD_FIGURES[exercise] : null;
    if (!sceneId) return NO_VISUAL;
    const { sceneVisual } = await import('./scene-visual');
    return sceneVisual(sceneId, sceneId, { scene: `${sceneId}.card` }).visual;
  }
}

/** Gives a page its card figures, in its `providers`. */
export function provideCardFigures(): Provider {
  return { provide: VISUAL_SOURCE, useFactory: () => new CardFigureSource() };
}
