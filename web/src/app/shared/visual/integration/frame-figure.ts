import { Component, input } from '@angular/core';

import { CanvasFigure } from '../rendering/canvas/canvas-figure';
import type { ResolvedFrame, ResolvedTimeline } from '../rendering/frame';
import { SurfaceScheme, SvgBackend } from '../rendering/svg/svg-backend';

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
      <app-vis-svg [frame]="frame()" [timeline]="timeline()" [scheme]="scheme()" />
    } @else {
      <app-vis-canvas-figure [frame]="frame()" [timeline]="timeline()" [scheme]="scheme()" />
    }
  `,
  styles: `:host { display: block; }`,
})
export class FrameFigure {
  readonly backend = input.required<BackendId>();
  readonly frame = input.required<ResolvedFrame>();
  readonly timeline = input<ResolvedTimeline>([]);
  readonly scheme = input<SurfaceScheme>('auto');
}
