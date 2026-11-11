import { Component, input, viewChild } from '@angular/core';

import { TRACKING, TrackingInput, composeTracking } from '../instruments/tracking/tracking';
import { CanvasBackend } from '../rendering/canvas/canvas-backend';
import { SurfaceScheme } from '../rendering/svg/svg-backend';
import { buildComposedFrame } from './pipeline';

/**
 * S9 Integration: the dot game on the Visual System (instruments/tracking). The exercise keeps its
 * canvas, its timing, scoring and input, and puts the canvas inside this surface; each frame it
 * asks the surface to draw the game's state, which goes through the same pipeline as every scene.
 * The preview, "How the game works", is the `tracking-preview` instrument (integration/instruments).
 */
@Component({
  selector: 'app-vis-tracking-surface',
  imports: [CanvasBackend],
  template: `<app-vis-canvas [theme]="theme" [scheme]="scheme()"><ng-content /></app-vis-canvas>`,
  styles: `:host { display: block; }`,
})
export class TrackingSurface {
  /** Pinned in the Visual Lab; follows the page elsewhere. */
  readonly scheme = input<SurfaceScheme>('auto');
  protected readonly theme = TRACKING.theme;
  private readonly backend = viewChild.required(CanvasBackend);

  draw(canvas: HTMLCanvasElement, state: TrackingInput): void {
    this.backend().draw(canvas, buildComposedFrame(composeTracking(state)));
  }
}
