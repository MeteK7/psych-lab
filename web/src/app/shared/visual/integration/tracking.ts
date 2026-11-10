import { Component, computed, input, viewChild } from '@angular/core';

import { PreviewInput, TRACKING, TrackingInput, trackingFrame, trackingPreviewFrame } from '../instruments/tracking/tracking';
import { CanvasBackend } from '../rendering/canvas/canvas-backend';
import { SurfaceScheme, SvgBackend } from '../rendering/svg/svg-backend';

/**
 * S9 Integration: the dot game on the Visual System (instruments/tracking). The exercise keeps its
 * canvas, its timing, scoring and input, and puts the canvas inside this surface; each frame it
 * asks the surface to draw the game's state.
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
    this.backend().draw(canvas, trackingFrame(state));
  }
}

/** S9 Integration: "How the game works", drawn from the game's own parts. The exercise gives the text alternative. */
@Component({
  selector: 'app-vis-tracking-preview',
  imports: [SvgBackend],
  template: `<app-vis-svg [frame]="frame()" [scheme]="scheme()" />`,
  styles: `:host { display: block; }`,
})
export class TrackingPreview {
  readonly scheme = input<SurfaceScheme>('auto');
  readonly ringRadius = input.required<number>();
  readonly labels = input.required<PreviewInput['labels']>();

  protected readonly frame = computed(() => trackingPreviewFrame({ ringRadius: this.ringRadius(), labels: this.labels() }));
}
