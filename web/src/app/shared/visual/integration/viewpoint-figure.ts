import { Component, DestroyRef, ElementRef, afterNextRender, afterRenderEffect, computed, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';

import type { QualityTier } from '../motion/plan-motion';
import { CanvasBackend } from '../rendering/canvas/canvas-backend';
import { paintOnCanvas } from '../rendering/canvas/canvas-backend';
import { tokenColours } from '../rendering/canvas/colour';
import { FRAME_CLOCK } from '../rendering/frame-clock';
import type { SurfaceScheme } from '../rendering/svg/svg-backend';
import { easingOf } from '../rendering/timing';
import { MOTION, VIEWPOINT_MOVE, frameSize, viewpointMoveMs } from '../styling/vocabulary';
import { FrameStats, FrameWatch } from './frame-watch';
import { InstrumentName, composeInstrument } from './instruments';
import { buildComposedFrame } from './pipeline';
import { reducedMotion } from './reduced-motion';

/** The instruments that are spatial views: built from data with a continuous `view` (visual-policy.md §3.4). */
export type ViewpointInstrument = Extract<InstrumentName, 'room'>;

/**
 * S9 Integration: a spatial view, drawn from a moving viewpoint (2026-11-14, `camera-angle.room`).
 * The exercise holds the position (0 to the last, whole numbers) and a native slider beside the
 * figure; the figure takes the pointer only and is a picture named by its text alternative.
 * - **A new position** moves the viewpoint there as one movement of the whole view (visual-policy.md
 *   §3.12, `VIEWPOINT_MOVE`). At every frame of the move the view is composed again and painted by
 *   the canvas backend, on the frame clock, as the dot game is: straight onto the canvas, without
 *   a round of the page's change detection per frame. Idle otherwise. A new position mid-move
 *   carries on from where the view is.
 * - **A drag across the figure** moves the view with the pointer (right is further along the path);
 *   letting go settles on the nearest position and reports it, so the exercise's slider follows.
 * - **Reduced motion, the static tier, or the watchdog** (below 50 fps over a second of movement): the
 *   view cuts to the new position, and a drag shows only the position it settles on.
 * The figure reports to the Lab's overlay like every moving figure.
 */
@Component({
  selector: 'app-vis-viewpoint',
  imports: [CanvasBackend],
  host: {
    role: 'img',
    '[attr.aria-label]': 'alt()',
    '[style.cursor]': "dragging() ? 'grabbing' : 'grab'",
    '(pointerdown)': 'onDown($event)',
    '(pointermove)': 'onMove($event)',
    '(pointerup)': 'onUp()',
    '(pointercancel)': 'onUp()',
    '(lostpointercapture)': 'onUp()',
  },
  template: `
    <app-vis-canvas [theme]="theme()" [scheme]="scheme()">
      <canvas #canvas aria-hidden="true" [style.aspect-ratio]="aspect()"></canvas>
    </app-vis-canvas>
  `,
  styles: `
    /* Its own layer, with its paint contained: a frame of the move repaints the canvas, not the page around it. */
    :host { display: block; touch-action: none; user-select: none; -webkit-user-select: none; contain: layout paint; }
    canvas { display: block; width: 100%; height: auto; will-change: transform; }
  `,
})
export class ViewpointFigure {
  readonly instrument = input.required<ViewpointInstrument>();
  /** The instrument's inputs, without the viewpoint: the exercise's own words, never the person's. */
  readonly inputs = input.required<Record<string, unknown>>();
  /** The exercise's position on the path: 0 to `positions` − 1. */
  readonly position = input.required<number>();
  readonly positions = input(4);
  readonly scheme = input<SurfaceScheme>('auto');
  /** Defaults to the person's setting: reduced motion cuts to each position. */
  readonly tier = input<QualityTier | 'auto'>('auto');
  /** A drag that settled on a position. */
  readonly positionChange = output<number>();

  protected readonly dragging = signal(false);
  /** The position the view is nearest, for the text alternative: changes only as the view passes halfway. */
  private readonly nearest = signal(0);
  private readonly settled = computed(() => composeInstrument(this.instrument(), { ...this.inputs(), view: this.nearest() }));
  protected readonly alt = computed(() => this.settled().text['alt'] ?? '');
  protected readonly theme = computed(() => this.settled().scene.theme);
  protected readonly aspect = computed(() => {
    const { width, height } = frameSize(this.settled().scene.frame);
    return `${width} / ${height}`;
  });

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly surface = viewChild.required(CanvasBackend, { read: ElementRef });
  private colour: ((value: string) => string) & { forget(): void } = Object.assign((v: string) => v, { forget: () => undefined });
  private readonly clock = inject(FRAME_CLOCK);
  private readonly reduce = reducedMotion();
  /** How the moves are drawn: the watchdog's measure, and the Lab overlay's. */
  readonly stats = new FrameStats();
  private readonly ease = easingOf(MOTION.easing[VIEWPOINT_MOVE.easing]);
  /** Where the viewpoint is now: between positions while it moves. */
  private at = 0;
  private move: { from: number; to: number; start: number; duration: number } | null = null;
  private loop: number | null = null;
  private drag: { x: number; view: number; width: number } | null = null;
  private pending: number | null = null;
  private unwatchResolution: () => void = () => undefined;

  /** Where the viewpoint is now, between positions while it moves. */
  view(): number {
    return this.at;
  }

  constructor() {
    const destroy = inject(DestroyRef);
    const unwatch = inject(FrameWatch).watch({ label: () => this.settled().scene.id, backend: 'canvas', stats: this.stats });
    let first = true;
    effect(() => {
      const target = this.position();
      untracked(() => {
        if (first) {
          first = false;
          this.setView(this.clamp(target));
        } else if (!this.drag) this.goTo(this.clamp(target));
      });
    });
    afterNextRender(() => {
      this.colour = tokenColours(this.surface().nativeElement);
      if (typeof ResizeObserver === 'function') {
        const observer = new ResizeObserver(() => this.paint());
        observer.observe(this.canvas().nativeElement);
        destroy.onDestroy(() => observer.disconnect());
      }
      // The device pixel ratio changes when the window moves to another display, or the page is zoomed:
      // paint again at the new ratio (as the canvas figure does).
      const watch = () => {
        if (typeof matchMedia !== 'function') return;
        const query = matchMedia(`(resolution: ${globalThis.devicePixelRatio ?? 1}dppx)`);
        const changed = () => {
          query.removeEventListener('change', changed);
          this.paint();
          watch();
        };
        query.addEventListener?.('change', changed);
        this.unwatchResolution = () => query.removeEventListener?.('change', changed);
      };
      watch();
    });
    // A new scheme, theme or set of words: colours read again, and the view painted again.
    afterRenderEffect(() => {
      this.scheme();
      this.theme();
      this.inputs();
      this.colour.forget();
      this.paint();
    });
    destroy.onDestroy(() => {
      this.stop();
      unwatch();
      this.unwatchResolution();
    });
  }

  /** Composes the view where it is now and paints it straight onto the canvas. */
  private paint(): void {
    const canvas = this.canvas()?.nativeElement;
    if (!canvas) return;
    const frame = buildComposedFrame(composeInstrument(this.instrument(), { ...this.inputs(), view: this.at }));
    paintOnCanvas(canvas, frame, frame.items.map((item) => ({ item, opacity: 1, offset: [0, 0], reveal: null, paint: null })), this.colour);
  }

  /**
   * Moves the view. Only a settled view changes the text alternative: a screen reader hears where the
   * view comes to rest, and a move doesn't set off the page's change detection at every position it passes.
   */
  private setView(view: number, settled = true): void {
    this.at = view;
    if (!settled) return;
    const nearest = Math.round(view);
    if (nearest !== this.nearest()) this.nearest.set(nearest);
  }

  /** Whether moves are cut rather than played: reduced motion, the static tier, or the watchdog. */
  private cuts(): boolean {
    const tier = this.tier();
    return (tier !== 'auto' ? tier !== 'full' : this.reduce()) || this.stats.dropped;
  }

  private clamp(v: number): number {
    return Math.min(Math.max(v, 0), this.positions() - 1);
  }

  private goTo(target: number): void {
    this.stop();
    const from = this.at;
    if (this.cuts() || Math.abs(target - from) < 1e-3) {
      this.setView(target);
      this.paint();
      return;
    }
    const start = this.clock.now();
    this.move = { from, to: target, start, duration: viewpointMoveMs(target - from) };
    this.stats.begin(start);
    this.loop = this.clock.request((time) => this.tick(time));
    if (this.loop === null) {
      this.move = null;
      this.setView(target);
      this.paint();
    }
  }

  private tick(time: number): void {
    this.loop = null;
    const m = this.move;
    if (!m) return;
    const began = performance.now();
    const u = Math.min(1, Math.max(0, (time - m.start) / m.duration));
    this.setView(u >= 1 ? m.to : m.from + (m.to - m.from) * this.ease(u), u >= 1);
    this.paint();
    this.stats.frame(time, performance.now() - began);
    if (u >= 1) {
      this.move = null;
      return;
    }
    // The watchdog: a view that can't keep up cuts to where it is going.
    if (this.stats.dropped) {
      this.move = null;
      this.setView(m.to);
      this.paint();
      return;
    }
    this.loop = this.clock.request((next) => this.tick(next));
  }

  private stop(): void {
    if (this.loop !== null) this.clock.cancel(this.loop);
    this.loop = null;
    this.move = null;
  }

  protected onDown(event: PointerEvent): void {
    if (event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    this.stop();
    this.drag = { x: event.clientX, view: this.at, width: this.host.getBoundingClientRect().width || 960 };
    this.dragging.set(true);
    this.host.setPointerCapture?.(event.pointerId);
  }

  protected onMove(event: PointerEvent): void {
    if (!this.drag) return;
    // About a third of the figure's width per position: the whole path in one drag across it.
    const view = this.clamp(this.drag.view + (event.clientX - this.drag.x) / (this.drag.width / (this.positions() - 0.2)));
    this.pending = view;
    if (this.cuts()) return;
    this.setView(view, false);
    this.paint();
  }

  protected onUp(): void {
    if (!this.drag) return;
    this.drag = null;
    this.dragging.set(false);
    const settle = Math.round(this.pending ?? this.at);
    this.pending = null;
    this.goTo(settle);
    if (settle !== this.position()) this.positionChange.emit(settle);
  }
}
