import { Component, OnDestroy, computed, input, output, signal } from '@angular/core';

import { RATINGS, STATE_RESET, fill } from '../../../content';
import { Experience, StepOutcome } from '../../flow/step-outcome';
import { RatingScale } from '../../shared/rating-scale';
import { GamePreview } from './game-preview';
import { Phase, Variant, buildSchedule } from './schedule';
import { SetResult, TrackingGame } from './tracking-game';

type PracticeStage = 'preview' | 'running' | 'done';

/**
 * State Reset (variant "image": hold a chosen picture in mind while playing) and its
 * game-only control (same game, same timing and practice, no picture). Plan §3 and §4.2
 * phase 2. The picture description is shown back during the exercise and never saved.
 */
@Component({
  selector: 'app-state-reset',
  imports: [GamePreview, RatingScale, TrackingGame],
  template: `
    @switch (phase().kind) {
      @case ('intro') {
        <p>{{ texts().about_intro }}</p>
        <ol>
          @for (part of texts().about_parts; track part) {
            <li>{{ part }}</li>
          }
        </ol>
        <p>{{ texts().about_duration }}</p>
        <button type="button" (click)="next()">{{ content.next_label }}</button>
      }
      @case ('picture') {
        <h3>{{ content.picture.heading }}</h3>
        <p>{{ content.picture.invitation }}</p>
        <ul>
          @for (example of content.picture.examples; track example) {
            <li>{{ example }}</li>
          }
        </ul>
        @if (assigned()) {
          <p>{{ content.picture.experiment_note }}</p>
        }
        <p class="safety">{{ content.picture.safety }}</p>
        <form (submit)="$event.preventDefault(); picturePicked()">
          <label class="field">
            <span>{{ content.picture.field_label }}</span>
            <input type="text" maxlength="120" [placeholder]="content.picture.field_placeholder"
                   [value]="picture()" (input)="picture.set(value($event))"
                   aria-describedby="picture-hint" required />
          </label>
          <p id="picture-hint" class="hint">{{ content.picture.field_hint }}</p>
          <button type="submit" [disabled]="!picture().trim()">{{ content.next_label }}</button>
        </form>
      }
      @case ('rating') {
        @if (ratingWhen() === 'pre') {
          <h3>{{ say(content.picture.rating_heading) }}</h3>
          <p>{{ content.picture.rating_before }}</p>
        } @else {
          <p>{{ say(content.picture.rating_after) }}</p>
        }
        <app-rating-scale [item]="ratingItems.image_vividness" [(value)]="vividness" />
        <app-rating-scale [item]="ratingItems.image_emotionality" [(value)]="emotionality" />
        <button type="button" [disabled]="vividness() === null || emotionality() === null" (click)="saveRating()">
          {{ ratingWhen() === 'pre' ? content.next_label : content.continue_label }}
        </button>
      }
      @case ('practice') {
        <h3>{{ content.how_it_works.heading }}</h3>
        @if (practice() === 'running') {
          <p class="cue">{{ content.how_it_works.practice_heading }}</p>
          <app-tracking-game
            [seconds]="content.timing.practice_seconds"
            [speed]="speed"
            [ringRadius]="content.game.ring_radius"
            (finished)="onPracticeFinished($event)"
          />
        } @else {
          <app-game-preview [ringRadius]="content.game.ring_radius" />
          <p>{{ content.how_it_works.text }}</p>
          <ul>
            <li>{{ content.how_it_works.mouse }}</li>
            <li>{{ content.how_it_works.keyboard }}</li>
          </ul>
          <p>{{ texts().practice }}</p>
          @if (practice() === 'preview') {
            <button type="button" (click)="startPractice()">{{ content.how_it_works.start_practice }}</button>
          } @else {
            <p role="status">{{ content.how_it_works.practice_done }}</p>
            <div class="actions">
              <button type="button" (click)="startPractice()">{{ content.how_it_works.practise_again }}</button>
              <button type="button" (click)="next()">{{ content.how_it_works.ready }}</button>
            </div>
          }
        }
      }
      @case ('hold') {
        <p class="cue" role="status">{{ say(texts().hold) }}</p>
        <p class="countdown" aria-hidden="true">{{ say(texts().hold_countdown, { seconds: remaining() }) }}</p>
      }
      @case ('rest') {
        <!-- The visible text counts down; screen readers hear it once, not every second. -->
        <p class="cue" aria-hidden="true">{{ say(texts().rest, { next: restNext(), seconds: remaining() }) }}</p>
        <p class="sr-only" role="status">{{ say(texts().rest, { next: restNext(), seconds: content.timing.rest_seconds }) }}</p>
      }
      @case ('play') {
        <h3>{{ say(texts().round_heading, { round: setNumber(), seconds: content.timing.set_seconds }) }}</h3>
        <p class="cue" role="status">{{ say(texts().round) }}</p>
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
    .countdown { font-size: 1.5rem; font-variant-numeric: tabular-nums; margin: 0.5rem 0 1rem; }
    .stop { display: block; margin-top: 1.5rem; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.25rem; }
    .field input { padding: 0.4rem; font: inherit; max-width: 32rem; }
    .hint { color: var(--muted); margin-top: 0; }
    .safety { border-left: 4px solid var(--accent); padding-left: 0.75rem; }
    .actions { display: flex; gap: 0.75rem; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  `,
})
export class StateReset implements Experience, OnDestroy {
  readonly variant = input.required<Variant>();
  /** True when the experiment assigned this exercise; adds the "today's learning" note. */
  readonly assigned = input(false);
  readonly completed = output<StepOutcome>();
  readonly stopped = output<void>();

  protected readonly content = STATE_RESET;
  protected readonly ratingItems = RATINGS.items;
  protected readonly speed = prefersReducedMotion()
    ? STATE_RESET.game.reduced_motion_speed
    : STATE_RESET.game.speed;

  /** Shown back during the exercise only; never part of the emitted result. */
  protected readonly picture = signal('');
  protected readonly vividness = signal<number | null>(null);
  protected readonly emotionality = signal<number | null>(null);
  protected readonly remaining = signal(0);
  protected readonly practice = signal<PracticeStage>('preview');

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
  protected readonly restNext = computed(() => {
    const p = this.phase();
    return p.kind === 'rest' ? p.afterSet + 1 : 0;
  });
  protected readonly playSeconds = computed(() => {
    const p = this.phase();
    return p.kind === 'play' ? p.seconds : 0;
  });

  private readonly sets: SetResult[] = [];
  private readonly practiceRuns: SetResult[] = [];
  private readonly ratings: Record<string, number> = {};
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.clearTimer();
  }

  /** A content string with the picture, set count and any extra values filled in. */
  protected say(text: string, values: Record<string, string | number> = {}): string {
    return fill(text, { picture: this.picture().trim(), sets: this.content.timing.sets, ...values });
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
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

  protected picturePicked(): void {
    if (this.picture().trim()) this.next();
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

  protected startPractice(): void {
    this.practice.set('running');
  }

  protected onPracticeFinished(result: SetResult): void {
    this.practiceRuns.push(result);
    this.practice.set('done');
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
        practice_runs: this.practiceRuns.length,
        practice: [...this.practiceRuns],
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
