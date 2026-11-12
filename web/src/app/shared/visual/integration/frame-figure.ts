import { Component, DestroyRef, inject, input } from '@angular/core';

import { CanvasFigure } from '../rendering/canvas/canvas-figure';
import type { ResolvedFrame, ResolvedTimeline } from '../rendering/frame';
import { SurfaceScheme, SvgBackend } from '../rendering/svg/svg-backend';
import { FrameStats, FrameWatch } from './frame-watch';

/** The frame clock both backends draw on, and the frame types, for pages that draw frames (the Lab's parity page). */
export { FRAME_CLOCK } from '../rendering/frame-clock';
export type { FrameClock } from '../rendering/frame-clock';
export type { FrameItem, ResolvedFrame, ResolvedTimeline } from '../rendering/frame';

/** The backends a resolved frame can be drawn with. */
export type BackendId = 'svg' | 'canvas';

/**
 * S9 Integration: a resolved frame and its timeline, drawn by the backend named (milestone M6). The
 * parity suite and the Visual Lab draw the same frame with both, side by side; figures in exercises
 * keep drawing with SVG through the scene figure, and the dot game through its own canvas.
 */
@Component({
  selector: 'app-vis-frame',
  imports: [SvgBackend, CanvasFigure],
  template: `
    @if (backend() === 'svg') {
      <app-vis-svg [frame]="frame()" [timeline]="timeline()" [scheme]="scheme()" [observer]="stats" />
    } @else {
      <app-vis-canvas-figure [frame]="frame()" [timeline]="timeline()" [scheme]="scheme()" [observer]="stats" />
    }
  `,
  styles: `:host { display: block; }`,
})
export class FrameFigure {
  readonly backend = input.required<BackendId>();
  readonly frame = input.required<ResolvedFrame>();
  readonly timeline = input<ResolvedTimeline>([]);
  readonly scheme = input<SurfaceScheme>('auto');
  /** How its changes are drawn, for the Lab's overlay (M6); this component plays what it's given, at any tier. */
  protected readonly stats = new FrameStats();

  constructor() {
    const backend = () => this.backend();
    const theme = () => this.frame().theme;
    const stop = inject(FrameWatch).watch({
      label: () => `parity frame, ${theme()}`,
      get backend() {
        return backend();
      },
      stats: this.stats,
    });
    inject(DestroyRef).onDestroy(stop);
  }
}
