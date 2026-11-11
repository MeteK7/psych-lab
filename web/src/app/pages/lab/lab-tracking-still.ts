import { Component, ElementRef, afterNextRender, input, viewChild } from '@angular/core';

import { TrackingInput } from '../../shared/visual/instruments/tracking/tracking';
import { SurfaceScheme } from '../../shared/visual/integration/scene-figure';
import { TrackingSurface } from '../../shared/visual/integration/tracking';

/** One still frame of the dot game, drawn by the canvas backend as the game draws it, for review in the Lab. */
@Component({
  selector: 'app-lab-tracking-still',
  imports: [TrackingSurface],
  template: `
    <app-vis-tracking-surface [scheme]="scheme()">
      <canvas #canvas [width]="state().size.width" [height]="state().size.height"></canvas>
    </app-vis-tracking-surface>
  `,
  styles: `canvas { display: block; width: 100%; aspect-ratio: 3 / 2; border: 1px solid var(--border); border-radius: 8px; }`,
})
export class LabTrackingStill {
  readonly state = input.required<TrackingInput>();
  readonly scheme = input<SurfaceScheme>('auto');
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly surface = viewChild.required(TrackingSurface);

  constructor() {
    afterNextRender(() => this.surface().draw(this.canvas().nativeElement, this.state()));
  }
}
