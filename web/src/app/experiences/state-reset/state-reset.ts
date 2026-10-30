import { Component, OnDestroy, computed, input, output, signal } from '@angular/core';

import { RATINGS, STATE_RESET } from '../../../content';
import { Experience, StepOutcome } from '../../flow/step-outcome';
import { RatingScale } from '../../shared/rating-scale';
import { Phase, Variant, buildSchedule } from './schedule';
import { SetResult, TrackingGame } from './tracking-game';

/**
 * State Reset (variant "image": hold the anticipated study image while playing) and its
 * game-only control (same game, same timing, no image). Plan §3 and §4.2 phase 2.
 */
@Component({
  selector: 'app-state-reset',
  imports: [RatingScale, TrackingGame],
  template: `
    <h2>{{ content.title }}</h2>
    @switch (phase().kind) {
      @case ('intro') {
        <p>{{ texts().intro }}</p>
        <p>{{ content.game.instructions }}</p>
        <button type="button" (click)="next()">Begin</button>
      }
      @case ('rating') {
        @if (ratingWhen() === 'pre') {
          <p>{{ texts().intro }}</p>
        }
        <app-rating-scale [item]="ratingItems.image_vividness" [(value)]="vividness" />
        <app-rating-scale [item]="ratingItems.image_emotionality" [(value)]="emotionality" />
        <button type="button" [disabled]="vividness() === null || emotionality() === null" (click)="saveRating()">
          Continue
        </button>
      }
      @case ('hold') {
        <p class="cue" role="status">{{ texts().hold }}</p>
        <p class="countdown">{{ remaining() }} s</p>
      }
      @case ('rest') {
        <p class="cue" role="status">{{ texts().rest }}</p>
        <p class="countdown">{{ remaining() }} s</p>
      }
      @case ('play') {
        <p class="cue" role="status">{{ texts().during_play }} (set {{ setNumber() }} of {{ content.timing.sets }})</p>
        <!-- Rest phases sit between sets, so each set gets a fresh game instance. -->
        <app-tracking-game
          [seconds]="playSeconds()"
          [speed]="speed"
          [ringRadius]="content.game.ring_radius"
          (finished)="onSetFinished($event)"
        />
      }
    }
    <button type="button" class="stop" (click)="stopped.emit()">{{ content.stop_label }}</button>
  `,
  styles: `
    .cue { font-size: 1.2rem; font-weight: 600; }
    .countdown { font-size: 2rem; font-variant-numeric: tabular-nums; margin: 0.5rem 0 1rem; }
    .stop { margin-top: 1.5rem; }
  `,
})
export class StateReset implements Experience, OnDestroy {
  readonly variant = input.required<Variant>();
  readonly completed = output<StepOutcome>();
  readonly stopped = output<void>();

  protected readonly content = STATE_RESET;
  protected readonly ratingItems = RATINGS.items;
  protected readonly speed = prefersReducedMotion()
    ? STATE_RESET.game.reduced_motion_speed
    : STATE_RESET.game.speed;

  protected readonly vividness = signal<number | null>(null);
  protected readonly emotionality = signal<number | null>(null);
  protected readonly remaining = signal(0);

  private readonly phases = computed(() => buildSchedule(this.content.timing, this.variant()));
  private readonly index = signal(0);
  protected readonly phase = computed<Phase>(() => this.phases()[this.index()]);
  protected readonly texts = computed(() =>
    this.variant() === 'image' ? this.content.image_variant : this.content.game_only_variant,
  );
  protected readonly ratingWhen = computed(() => {
    const p = this.phase();
    return p.kind === 'rating' ? p.when : null;
  });
  protected readonly setNumber = computed(() => {
    const p = this.phase();
    return p.kind === 'play' ? p.set : 0;
  });
  protected readonly playSeconds = computed(() => {
    const p = this.phase();
    return p.kind === 'play' ? p.seconds : 0;
  });

  private readonly sets: SetResult[] = [];
  private readonly ratings: Record<string, number> = {};
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.clearTimer();
  }

  protected next(): void {
    this.clearTimer();
    const nextIndex = this.index() + 1;
    if (nextIndex >= this.phases().length) {
      this.finish();
      return;
    }
    this.index.set(nextIndex);
    const p = this.phases()[nextIndex];
    if (p.kind === 'hold' || p.kind === 'rest') this.countDown(p.seconds);
  }

  protected saveRating(): void {
    const when = this.ratingWhen();
    const vividness = this.vividness();
    const emotionality = this.emotionality();
    if (when === null || vividness === null || emotionality === null) return;
    this.ratings[`image_vividness_${when}`] = vividness;
    this.ratings[`image_emotionality_${when}`] = emotionality;
    this.vividness.set(null);
    this.emotionality.set(null);
    this.next();
  }

  protected onSetFinished(result: SetResult): void {
    this.sets.push(result);
    this.next();
  }

  private countDown(seconds: number): void {
    const endAt = performance.now() + seconds * 1000;
    this.remaining.set(seconds);
    this.timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt - performance.now()) / 1000));
      this.remaining.set(left);
      if (left === 0) this.next();
    }, 200);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private finish(): void {
    const ratios = this.sets.map((s) => s.on_target_ratio);
    const mean = ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 0;
    this.completed.emit({
      result: {
        variant: this.variant(),
        timing: this.content.timing,
        speed: this.speed,
        sets: this.sets,
        mean_on_target: Math.round(mean * 1000) / 1000,
      },
      ratings: { ...this.ratings },
    });
  }
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
