import { InjectionToken, Provider, inject } from '@angular/core';

import { VISUAL_SOURCE, Visual, VisualRequest, VisualSource } from '../visual';

/**
 * S9 Integration (docs/visual-system.md §7): answers an exercise's requests with a registered
 * scene. A request names `<prefix>.<state>`, e.g. 'mcii.contrast' for the state `contrast`.
 * `facets.from` names the scene shown on the step before; the figure then plays the change from
 * that state when the step appears (S5; nothing moves under reduced motion). Any other request
 * shows nothing, which the slot already handles.
 *
 * The scene and the renderer load on the first request, in their own chunk (§3.4 rule 8), so the
 * exercise carries only this source: the slot holds the picture's space meanwhile, and shows
 * nothing if loading fails.
 *
 * Its id says exactly what was drawn, `scene:<scene>@<version>;theme:<theme>@<version>`, and the
 * exercise records it as its visual source (§9). Until a picture has loaded, nothing has been
 * drawn, and the id names only the scene.
 */
export class SceneSpecSource implements VisualSource {
  private drawn: string | null = null;

  constructor(
    private readonly sceneId: string,
    private readonly prefix: string,
  ) {}

  get id(): string {
    return this.drawn ?? `scene:${this.sceneId}`;
  }

  async resolve(request: VisualRequest): Promise<Visual> {
    const { sceneVisual } = await import('./scene-visual');
    const { id, visual } = sceneVisual(this.sceneId, this.prefix, request);
    this.drawn = id;
    return visual;
  }
}

/**
 * A source that replaces an exercise's scenes, provided above the exercise. Tests use it: an
 * exercise loads on demand, so its own component providers can't be overridden from outside.
 */
export const SCENE_SOURCE_OVERRIDE = new InjectionToken<VisualSource>('SCENE_SOURCE_OVERRIDE');

/** Binds an exercise's visual source to a registered scene, in its `providers`: `provideSceneVisuals('mcii.path', 'mcii')`. */
export function provideSceneVisuals(sceneId: string, prefix: string): Provider {
  return {
    provide: VISUAL_SOURCE,
    useFactory: () => inject(SCENE_SOURCE_OVERRIDE, { optional: true }) ?? new SceneSpecSource(sceneId, prefix),
  };
}
