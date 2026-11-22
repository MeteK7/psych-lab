import { Component, DestroyRef, afterNextRender, computed, effect, inject, input, signal, untracked } from '@angular/core';

import { FRAME_CLOCK, FrameFigure, ResolvedFrame } from '../../../shared/visual/integration/frame-figure';
import { FrameStats, FrameWatch } from '../../../shared/visual/integration/frame-watch';
import { buildComposedFrame } from '../../../shared/visual/integration/pipeline';
import { reducedMotion } from '../../../shared/visual/integration/reduced-motion';
import type { SurfaceScheme } from '../../../shared/visual/integration/scene-figure';
import { viewpointMoveMs } from '../../../shared/visual/styling/vocabulary';
import type { Figure } from './idioms/contract';
import { ease } from './kit/paths';

/**
 * STUDY CODE (Visual Lab only): a study figure. It composes its figure again at every frame and hands
 * the resolved frame to the integration layer's frame figure, which draws it with the canvas or the
 * SVG backend (rule 5: only integration imports a backend). A sequence plays once when asked and
 * never loops; a native slider scrubs it or moves the viewpoint (the proposed rule PL-1). Under
 * reduced motion a sequence shows its last frame and a viewpoint move cuts; the slider still works,
 * since it follows the person's own hand. Reports to the performance overlay: our work per frame is
 * composing and resolving; painting is the backend's, and shows in the frame rate.
 */
@Component({
  selector: 'app-study-figure',
  imports: [FrameFigure],
  host: { role: 'img', '[attr.aria-label]': 'label() ?? figure().alt' },
  styles: `
    :host { display: block; }
    .controls { display: flex; flex-wrap: wrap; gap: 0.4rem 0.75rem; align-items: center; margin-top: 0.4rem; font-size: 0.85rem; }
    .controls input[type='range'] { flex: 1 1 12rem; min-width: 10rem; }
  `,
  template: `
    <app-vis-frame [backend]="backend()" [frame]="frame()" [scheme]="scheme()" />
    @switch (figure().motion.kind) {
      @case ('timeline') {
        <div class="controls">
          <button type="button" (click)="play()" [attr.data-study-play]="tag()">{{ playing() ? 'Pause' : 'Play' }}</button>
          <label>Moment
            <input type="range" min="0" max="1000" step="1" [value]="at() * 1000" (input)="scrub($any($event.target).valueAsNumber / 1000)"
                   [attr.aria-valuetext]="stepAt()" />
          </label>
          <output>{{ stepAt() }}</output>
        </div>
      }
      @case ('viewpoint') {
        <div class="controls">
          @if (positions().length > 1) {
            <label>Where you look from
              <input type="range" min="0" [max]="positions().length - 1" step="1" [value]="target()" (input)="pick($any($event.target).valueAsNumber)"
                     [attr.aria-valuetext]="positions()[target()]" [attr.data-study-view]="tag()" />
            </label>
            <output>{{ positions()[target()] }}</output>
          } @else {
            <!-- One viewpoint: nothing to move between, so no slider; the view is named instead. -->
            <span [attr.data-study-one-view]="tag()">One viewpoint: {{ positions()[0] }}</span>
          }
        </div>
      }
    }
  `,
})
export class StudyFigure {
  readonly figure = input.required<Figure>();
  readonly scheme = input<SurfaceScheme>('auto');
  readonly backend = input<'canvas' | 'svg'>('canvas');
  /** Reduced motion from the page's switch, on top of the person's setting. */
  readonly reduce = input(false);
  /** Names the figure in the overlay and for the measurement script. */
  readonly tag = input.required<string>();
  /** Pass E: a sequence plays once by itself, and a viewpoint tours its positions once, when shown. */
  readonly autoplay = input(false);
  /** Pass E: the accessible name, when the text alternative would give the answer away. */
  readonly label = input<string | null>(null);

  private readonly system = reducedMotion();
  private readonly reduced = computed(() => this.reduce() || this.system());
  protected readonly at = signal(1);
  protected readonly target = signal(0);
  protected readonly playing = signal(false);
  protected readonly frame = signal<ResolvedFrame>({ width: 960, height: 540, theme: 'cognitive', items: [] });
  protected readonly positions = computed(() => (this.figure().motion.kind === 'viewpoint' ? (this.figure().motion as { positions: readonly string[] }).positions : []));
  protected readonly stepAt = computed(() => {
    const m = this.figure().motion;
    if (m.kind !== 'timeline') return '';
    return m.steps[Math.min(m.steps.length - 1, Math.floor(this.at() * m.steps.length))] ?? '';
  });

  readonly stats = new FrameStats();
  private readonly clock = inject(FRAME_CLOCK);
  private loop: number | null = null;
  private run: { kind: 'play'; start: number; from: number } | { kind: 'move'; start: number; from: number; to: number; duration: number } | null = null;
  private view = 0;
  /** Our work for the last frame: composing and resolving, ms. */
  private lastWork = 0;
  private tourTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const destroy = inject(DestroyRef);
    const watch = inject(FrameWatch);
    let unwatch = () => undefined as void;
    afterNextRender(() => {
      const backend = () => this.backend();
      unwatch = watch.watch({
        label: () => this.tag(),
        get backend() {
          return backend();
        },
        stats: this.stats,
      });
      if (this.autoplay()) this.begin();
    });
    // A new figure: drawn where it stands.
    effect(() => {
      this.figure();
      untracked(() => this.paint());
    });
    destroy.onDestroy(() => {
      this.endTour();
      this.stop();
      unwatch();
    });
  }

  private current(): number {
    return this.figure().motion.kind === 'viewpoint' ? this.view : this.at();
  }

  /** Composes the figure where it is now and hands the frame to the backend. */
  private paint(): void {
    const began = performance.now();
    this.frame.set(buildComposedFrame(this.figure().compose(this.current())));
    this.lastWork = performance.now() - began;
  }

  protected play(): void {
    const m = this.figure().motion;
    if (m.kind !== 'timeline') return;
    if (this.playing()) {
      this.stop();
      return;
    }
    if (this.reduced()) {
      this.at.set(1);
      this.paint();
      return;
    }
    const from = this.at() >= 1 ? 0 : this.at();
    this.at.set(from);
    this.start({ kind: 'play', start: this.clock.now(), from });
  }

  /** Autoplay: a sequence from its start; a viewpoint held, then moved through each position in turn. */
  private begin(): void {
    const m = this.figure().motion;
    if (m.kind === 'timeline') {
      this.at.set(0);
      this.paint();
      this.play();
    } else if (m.kind === 'viewpoint') this.tour(1);
  }

  private tour(k: number): void {
    const hold = 1600;
    this.tourTimer = setTimeout(() => {
      this.tourTimer = null;
      if (k >= this.positions().length) return;
      this.goTo(k);
      this.tour(k + 1);
    }, k === 1 ? hold : hold + (this.reduced() ? 0 : viewpointMoveMs(1)));
  }

  private endTour(): void {
    if (this.tourTimer !== null) clearTimeout(this.tourTimer);
    this.tourTimer = null;
  }

  /** The person's own hand on the slider ends a tour. */
  protected pick(position: number): void {
    this.endTour();
    this.goTo(position);
  }

  protected scrub(u: number): void {
    this.stop();
    this.at.set(u);
    this.paint();
  }

  protected goTo(position: number): void {
    this.target.set(position);
    this.stop();
    const from = this.view;
    if (this.reduced() || this.stats.dropped || Math.abs(position - from) < 1e-3) {
      this.view = position;
      this.paint();
      return;
    }
    this.start({ kind: 'move', start: this.clock.now(), from, to: position, duration: viewpointMoveMs(position - from) });
  }

  private start(run: NonNullable<StudyFigure['run']>): void {
    this.run = run;
    this.playing.set(run.kind === 'play');
    this.stats.begin(run.start);
    this.loop = this.clock.request((t) => this.tick(t));
  }

  private tick(time: number): void {
    this.loop = null;
    const r = this.run;
    if (!r) return;
    let done = false;
    if (r.kind === 'play') {
      const m = this.figure().motion as { duration: number };
      const u = Math.min(1, r.from + (time - r.start) / m.duration);
      this.at.set(u);
      done = u >= 1;
    } else {
      const u = Math.min(1, Math.max(0, (time - r.start) / r.duration));
      this.view = r.from + (r.to - r.from) * ease.move(u);
      done = u >= 1;
    }
    this.paint();
    this.stats.frame(time, this.lastWork);
    if (done || this.stats.dropped) {
      if (r.kind === 'move') this.view = r.to;
      if (this.stats.dropped) this.paint();
      this.run = null;
      this.playing.set(false);
      return;
    }
    this.loop = this.clock.request((t) => this.tick(t));
  }

  private stop(): void {
    if (this.loop !== null) this.clock.cancel(this.loop);
    this.loop = null;
    this.run = null;
    this.playing.set(false);
  }
}
