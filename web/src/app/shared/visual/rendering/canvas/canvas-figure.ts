import { Component, DestroyRef, ElementRef, afterNextRender, afterRenderEffect, computed, inject, input, viewChild } from '@angular/core';

import type { ResolvedFrame, ResolvedTimeline } from '../frame';
import { FRAME_CLOCK } from '../frame-clock';
import { SampledItem, carryOn, sampleTimeline, timelineEnd } from '../playback';
import type { SurfaceScheme } from '../svg/svg-backend';
import { paintOnCanvas } from './canvas-backend';
import { tokenColours } from './colour';

/**
 * S7 Rendering, the canvas backend as a figure (milestone M6): it draws a resolved frame and plays
 * its timeline as the SVG backend does, from the same timing core (rendering/playback.ts), so the
 * two give the same picture at every moment (the parity suite checks this). It sizes its own canvas
 * (its CSS size × the device pixel ratio, again when either changes), keeps lines at their CSS
 * width at any size, and draws frames only while something moves, on the frame clock. The surface
 * is hidden from assistive technology, like the SVG one; the integration layer gives the text.
 * The dot game keeps drawing through `CanvasBackend.draw`, unchanged.
 */
@Component({
  selector: 'app-vis-canvas-figure',
  host: { '[attr.data-vis-theme]': 'frame().theme', '[attr.data-vis-scheme]': 'scheme()' },
  template: `<canvas #canvas aria-hidden="true" [style.aspect-ratio]="aspect()"></canvas>`,
  styleUrls: ['../../styling/tokens.css'],
  styles: `
    :host { display: block; }
    canvas { display: block; width: 100%; height: auto; }
  `,
})
export class CanvasFigure {
  readonly frame = input.required<ResolvedFrame>();
  readonly scheme = input<SurfaceScheme>('auto');
  /** Tracks towards the frame's state; empty means show the frame as it is. */
  readonly timeline = input<ResolvedTimeline>([]);

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly clock = inject(FRAME_CLOCK);
  private readonly colour = tokenColours(this.host);
  private playing: { timeline: ResolvedTimeline; start: number; end: number } | null = null;
  private loop: number | null = null;
  private resolutionQuery: MediaQueryList | null = null;

  protected readonly aspect = computed(() => `${this.frame().width} / ${this.frame().height}`);

  constructor() {
    // A new timeline starts playing (picked up from the one before); a new frame or scheme repaints.
    afterRenderEffect(() => this.play(this.timeline()));
    afterRenderEffect(() => {
      this.frame();
      this.scheme();
      this.colour.forget();
      this.paintNow();
    });
    afterNextRender(() => {
      const canvas = this.canvas().nativeElement;
      if (typeof ResizeObserver === 'function') {
        const observer = new ResizeObserver(() => this.paintNow());
        observer.observe(canvas);
        this.destroyRef.onDestroy(() => observer.disconnect());
      }
      this.watchResolution();
    });
    this.destroyRef.onDestroy(() => {
      this.stopLoop();
      this.resolutionQuery?.removeEventListener('change', this.onResolution);
    });
  }

  private readonly destroyRef = inject(DestroyRef);

  /** The device pixel ratio changes when the window moves to another display: size again. */
  private readonly onResolution = () => {
    this.paintNow();
    this.watchResolution();
  };

  private watchResolution(): void {
    if (typeof matchMedia !== 'function') return;
    this.resolutionQuery?.removeEventListener('change', this.onResolution);
    this.resolutionQuery = matchMedia(`(resolution: ${globalThis.devicePixelRatio ?? 1}dppx)`);
    this.resolutionQuery.addEventListener?.('change', this.onResolution);
  }

  private play(timeline: ResolvedTimeline): void {
    const now = this.clock.now();
    const tracks = carryOn(this.playing, timeline, now);
    this.stopLoop();
    this.playing = tracks.length ? { timeline: tracks, start: now, end: timelineEnd(tracks) } : null;
    this.paintNow();
    if (!this.playing) return;
    this.loop = this.clock.request((t) => this.tick(t));
    // No frames to draw on: the final picture at once.
    if (this.loop === null) {
      this.playing = null;
      this.paintNow();
    }
  }

  private tick(time: number): void {
    this.loop = null;
    if (!this.playing) return;
    const ms = time - this.playing.start;
    this.paint(ms);
    if (ms < this.playing.end) this.loop = this.clock.request((t) => this.tick(t));
    if (this.loop === null) this.playing = null;
  }

  private stopLoop(): void {
    if (this.loop !== null) this.clock.cancel(this.loop);
    this.loop = null;
  }

  private paintNow(): void {
    this.paint(this.playing ? this.clock.now() - this.playing.start : Infinity);
  }

  /** Paints `ms` into the change, on a backing store sized to the canvas's CSS size × the device pixel ratio. */
  private paint(ms: number): void {
    const frame = this.frame();
    const items: SampledItem[] =
      this.playing && ms < this.playing.end
        ? sampleTimeline(frame, this.playing.timeline, ms)
        : frame.items.map((item) => ({ item, opacity: 1, offset: [0, 0], reveal: null, paint: null }));
    paintOnCanvas(this.canvas().nativeElement, frame, items, this.colour);
  }
}
