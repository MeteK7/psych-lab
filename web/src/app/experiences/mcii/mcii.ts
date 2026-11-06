import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';

import { MCII, fill } from '../../../content';
import { Experience, StepOutcome } from '../../flow/step-outcome';
import { RatingScale } from '../../shared/rating-scale';
import { VISUAL_SOURCE } from '../../shared/visual/visual';
import { VisualSlot } from '../../shared/visual/visual-slot';
import { CardPick } from '../cognitive-shifts/card-pick';
import { Pick } from '../cognitive-shifts/cs-store';
import {
  DecideAnswers,
  Feeling,
  MciiStage,
  OUTSIDE,
  OWN,
  WishAnswers,
  WishChoice,
  canLeaveClose,
  canLeaveDecide,
  canLeavePlan,
  canLeaveWish,
  closeOutcome,
  decideOutcome,
  obstacleFrom,
  obstacleOutcome,
  planOutcome,
  planSentence,
  wishAfterDecide,
  wishOutcome,
} from './mcii-logic';
import { sceneFor } from './mcii-scenes';
import { MciiStore } from './mcii-store';
import { MciiBuiltInVisuals } from './mcii-visual-source';

/**
 * MCII · Your wish, and what's in the way (docs/mcii-design.md). Future first, then the obstacle,
 * then a decision, then an if-then plan for a wish the person keeps. Recreated for each step, so
 * anything that must survive a step lives in MciiStore. Own texts stay there; only ids, choices
 * and ratings are reported.
 */
@Component({
  selector: 'app-mcii',
  imports: [CardPick, RatingScale, VisualSlot],
  // The one place this exercise's visual source is chosen.
  providers: [{ provide: VISUAL_SOURCE, useClass: MciiBuiltInVisuals }],
  template: `
    @switch (stage()) {
      @case ('mcii_wish') {
        <p class="safety">{{ c.wish.safety }}</p>
        <app-visual-slot [request]="scene()" />
        <p>{{ c.wish.ask }}</p>
        <label class="field">
          <span>{{ c.wish.field_label }}</span>
          <span class="sub">{{ c.wish.example }}</span>
          <input type="text" maxlength="120" [value]="wish()" (input)="wish.set(value($event))" />
        </label>
        <fieldset class="choice">
          <legend>{{ c.wish.category_ask }}</legend>
          <div class="row">
            @for (category of c.wish.categories; track category.id) {
              <label class="inline">
                <input type="radio" name="mcii-category" [value]="category.id" [checked]="category_() === category.id"
                       (change)="category_.set(category.id)" />
                {{ category.label }}
              </label>
            }
          </div>
        </fieldset>
        <app-rating-scale [item]="c.wish.matter" [(value)]="matter" />
        <app-rating-scale [item]="c.wish.likely" [(value)]="likely" />
        <button type="button" [disabled]="!wishReady()" (click)="submitWish()">{{ c.next_label }}</button>
      }
      @case ('mcii_outcome') {
        <p class="quote">{{ say(c.outcome.your_wish, { wish: store.wish() }) }}</p>
        <app-visual-slot [request]="scene()" />
        <p>{{ c.outcome.ask }}</p>
        <label class="field">
          <span>{{ c.outcome.field_label }}</span>
          <input type="text" maxlength="120" [value]="outcome()" (input)="outcome.set(value($event))" />
        </label>
        @if (shown() && outcome().trim()) {
          <p class="note" role="status">{{ c.outcome.picture }}</p>
        }
        <button type="button" [disabled]="!outcome().trim()" (click)="shown() ? submitOutcome() : shown.set(true)">
          {{ shown() ? c.next_label : c.done_label }}
        </button>
      }
      @case ('mcii_obstacle') {
        <p class="quote">{{ say(c.obstacle.best_part, { outcome: store.outcome() }) }}</p>
        <app-visual-slot [request]="scene()" />
        <fieldset class="choice">
          <legend>{{ c.obstacle.ask }}</legend>
          @for (card of c.obstacle.cards; track card.id) {
            <label class="option" [class.chosen]="obstacleChoice() === card.id">
              <input type="radio" name="mcii-obstacle" [value]="card.id" [checked]="obstacleChoice() === card.id"
                     (change)="obstacleChoice.set(card.id)" />
              <span>{{ card.text }}</span>
            </label>
          }
          <label class="option" [class.chosen]="obstacleChoice() === own">
            <input type="radio" name="mcii-obstacle" [value]="own" [checked]="obstacleChoice() === own"
                   (change)="obstacleChoice.set(own)" />
            <span>{{ c.obstacle.own_choice }}</span>
          </label>
          <label class="option" [class.chosen]="obstacleChoice() === outsideId">
            <input type="radio" name="mcii-obstacle" [value]="outsideId" [checked]="obstacleChoice() === outsideId"
                   (change)="obstacleChoice.set(outsideId)" />
            <span>{{ c.obstacle.outside_choice }}</span>
          </label>
        </fieldset>
        @if (obstacleChoice() === own) {
          <label class="field">
            <span>{{ c.obstacle.own_label }}</span>
            <input type="text" maxlength="120" [value]="ownText()" (input)="ownText.set(value($event))" />
          </label>
        }
        @if (obstacleChoice() === outsideId) {
          <label class="field">
            <span>{{ c.obstacle.outside_label }}</span>
            <input type="text" maxlength="120" [value]="outsideText()" (input)="outsideText.set(value($event))" />
          </label>
        }
        @if (shown() && obstacle()) {
          <p class="note" role="status">{{ c.obstacle.picture }}</p>
        }
        <button type="button" [disabled]="!obstacle()" (click)="shown() ? submitObstacle() : shown.set(true)">
          {{ shown() ? c.next_label : c.done_label }}
        </button>
      }
      @case ('mcii_decide') {
        <p class="quote">{{ say(c.decide.your_wish, { wish: store.wish() }) }}</p>
        <p>{{ c.decide.lead }}</p>
        <app-visual-slot [request]="scene()" />
        <!-- The future comes first, then the obstacle: the order is part of the method. -->
        <div class="both">
          <section class="facts" aria-labelledby="mcii-best">
            <h3 id="mcii-best">{{ c.decide.best_part }}</h3>
            <p>{{ store.outcome() }}</p>
          </section>
          <section class="facts" aria-labelledby="mcii-way">
            <h3 id="mcii-way">{{ c.decide.in_the_way }}</h3>
            <p>{{ store.obstacle()?.text }}</p>
          </section>
        </div>
        @if (outside()) {
          <p class="note">{{ c.decide.outside_note }}</p>
        }
        <app-rating-scale [item]="c.decide.likely" [(value)]="likely" />
        <!-- Shown only after rating, so the earlier number doesn't pull the new answer towards it. -->
        @if (likely() !== null) {
          <p class="note" role="status">{{ compared() }}</p>
        }
        <fieldset class="choice">
          <legend>{{ c.decide.ask }}</legend>
          @for (option of c.decide.options; track option.id) {
            <label class="option" [class.chosen]="choice() === option.id">
              <input type="radio" name="mcii-decide" [value]="option.id" [checked]="choice() === option.id"
                     (change)="choice.set(option.id)" />
              <span><strong>{{ option.label }}.</strong> {{ option.hint }}</span>
            </label>
          }
        </fieldset>
        @if (choice() === 'change') {
          <label class="field">
            <span>{{ c.decide.new_wish_label }}</span>
            <input type="text" maxlength="120" [value]="newWish()" (input)="newWish.set(value($event))" />
          </label>
        }
        <p class="any">{{ c.decide.any_answer }}</p>
        <button type="button" [disabled]="!decideReady()" (click)="submitDecide()">{{ c.next_label }}</button>
      }
      @case ('mcii_plan') {
        @if (setAside()) {
          <p>{{ c.plan.set_aside[0] }}</p>
          <app-visual-slot [request]="scene()" />
          <p>{{ c.plan.set_aside[1] }}</p>
          <button type="button" (click)="completed.emit(noPlan())">{{ c.next_label }}</button>
        } @else {
          <p class="quote">{{ say(c.plan.your_wish, { wish: store.wish() }) }}</p>
          <p>{{ c.plan.lead }}</p>
          <app-visual-slot [request]="scene()" />
          <label class="field">
            <span>{{ c.plan.if_label }}</span>
            <input type="text" maxlength="160" [value]="ifText()" (input)="ifText.set(value($event))" />
          </label>
          <app-card-pick [legend]="c.plan.then_ask" [cards]="c.plan.then_cards" [ownChoice]="c.plan.own_choice"
                         [ownLabel]="c.plan.own_label" [(value)]="then" />
          @if (shown() && planReady()) {
            <div class="note" role="status">
              <p class="plan">{{ say(c.plan.read_back, { plan: sentence() }) }}</p>
              <p>{{ c.plan.rehearse }}</p>
            </div>
          }
          <button type="button" [disabled]="!planReady()" (click)="shown() ? submitPlan() : shown.set(true)">
            {{ shown() ? c.next_label : c.done_label }}
          </button>
        }
      }
      @case ('mcii_close') {
        <app-visual-slot [request]="scene()" />
        @if (store.plan(); as plan) {
          <section class="facts" aria-labelledby="mcii-plan">
            <h3 id="mcii-plan">{{ c.close.plan_heading }}</h3>
            <p>{{ plan }}</p>
          </section>
          <p class="copy">
            <button type="button" (click)="copy()">{{ c.close.copy }}</button>
            {{ c.close.copy_note }}
          </p>
          <p role="status">{{ copyMessage() }}</p>
          <app-rating-scale [item]="c.close.ready" [(value)]="ready" />
          <p class="any">{{ c.close.ready_means }}</p>
        }
        <fieldset class="choice">
          <legend>{{ c.close.feeling_ask }}</legend>
          <div class="row">
            @for (option of c.close.feelings; track option.id) {
              <label class="inline">
                <input type="radio" name="mcii-feeling" [value]="option.id" [checked]="feeling() === option.id"
                       (change)="feeling.set(option.id)" />
                {{ option.label }}
              </label>
            }
          </div>
        </fieldset>
        @if (feeling() === 'discouraged') {
          <p class="note" role="status">{{ c.close.discouraged_note }}</p>
        }
        <button type="button" [disabled]="!closeReady()" (click)="submitClose()">{{ c.finish_label }}</button>
      }
    }
  `,
  styles: `
    .safety { border-left: 4px solid var(--accent); padding-left: 0.75rem; }
    .quote { font-size: 1.1rem; }
    .both { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 0.75rem; margin: 0 0 1rem; }
    .facts { padding: 0.75rem 0.875rem; margin: 0 0 1rem; border: 1px solid var(--border); border-radius: 8px;
             background: color-mix(in srgb, var(--text) 4%, transparent); }
    .both .facts { margin: 0; }
    .facts h3 { margin: 0 0 0.25rem; font-size: 0.95rem; }
    .facts p { margin: 0; font-size: 1.05rem; }
    .note { border-left: 4px solid var(--accent); padding-left: 0.75rem; }
    .note p { margin: 0 0 0.4rem; }
    .plan { font-size: 1.1rem; }
    .choice { border: 0; padding: 0; margin: 0 0 1rem; }
    .choice legend { font-weight: 600; margin-bottom: 0.5rem; }
    .row { display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem; }
    .inline { display: inline-flex; gap: 0.4rem; align-items: center; }
    .option { display: flex; gap: 0.6rem; align-items: flex-start; padding: 0.6rem 0.75rem; margin-bottom: 0.5rem;
              border: 1px solid var(--border); border-radius: 8px; cursor: pointer; }
    .option.chosen { border-color: var(--accent); border-width: 2px; padding: calc(0.6rem - 1px) calc(0.75rem - 1px); }
    .option input { margin-top: 0.25rem; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; max-width: 32rem; }
    .field input { padding: 0.4rem; font: inherit; }
    .sub { font-size: 0.875rem; color: var(--muted); }
    .any { color: var(--muted); }
    .copy { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem; }
    [role='status']:empty { margin: 0; }
  `,
})
export class Mcii implements Experience {
  readonly stage = input.required<MciiStage>();
  readonly completed = output<StepOutcome>();

  protected readonly c = MCII;
  protected readonly store = inject(MciiStore);
  protected readonly own = OWN;
  protected readonly outsideId = OUTSIDE;
  private readonly visualSource = inject(VISUAL_SOURCE);

  /** "Done" was pressed, so the picturing prompt or the plan read-back is on screen. */
  protected readonly shown = signal(false);

  // Step 1
  protected readonly wish = signal('');
  protected readonly category_ = signal<string | null>(null);
  protected readonly matter = signal<number | null>(null);
  protected readonly likely = signal<number | null>(null);
  private readonly wishAnswers = computed<WishAnswers>(() => ({
    wish: this.wish(),
    category: this.category_(),
    matter: this.matter(),
    likely: this.likely(),
  }));
  protected readonly wishReady = computed(() => canLeaveWish(this.wishAnswers()));

  // Step 2
  protected readonly outcome = signal('');

  // Step 3
  protected readonly obstacleChoice = signal<string | null>(null);
  protected readonly ownText = signal('');
  protected readonly outsideText = signal('');
  protected readonly obstacle = computed(() =>
    obstacleFrom(this.obstacleChoice(), this.c.obstacle.cards, this.ownText(), this.outsideText()),
  );

  // Step 4 (and the rating it shares with step 1)
  protected readonly choice = signal<WishChoice | null>(null);
  protected readonly newWish = signal('');
  private readonly decideAnswers = computed<DecideAnswers>(() => ({
    likely: this.likely(),
    choice: this.choice(),
    newWish: this.newWish(),
  }));
  protected readonly decideReady = computed(() => canLeaveDecide(this.decideAnswers()));
  protected readonly outside = computed(() => this.store.obstacle()?.id === OUTSIDE);
  protected readonly compared = computed(() =>
    fill(this.c.decide.compared, { before: this.store.likelyBefore() ?? 0, now: this.likely() ?? 0 }),
  );

  // Step 5
  protected readonly setAside = computed(() => this.store.choice() === 'set_aside');
  protected readonly ifText = linkedSignal(() => this.store.obstacle()?.ifText ?? '');
  protected readonly then = signal<Pick | null>(null);
  protected readonly planReady = computed(() => canLeavePlan(this.ifText(), this.then()?.text));
  protected readonly sentence = computed(() => planSentence(this.ifText(), this.then()?.text ?? ''));

  // Step 6
  protected readonly ready = signal<number | null>(null);
  protected readonly feeling = signal<Feeling | null>(null);
  protected readonly copyMessage = signal('');
  protected readonly closeReady = computed(() => canLeaveClose(!!this.store.plan(), this.ready(), this.feeling()));

  /** Reads the store's choice, not this screen's: the picture doesn't react until it's decided. */
  protected readonly scene = computed(() => sceneFor(this.stage(), this.store.choice()));

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected say(text: string, values: Record<string, string | number>): string {
    return fill(text, values);
  }

  protected noPlan(): StepOutcome {
    return planOutcome(null);
  }

  protected submitWish(): void {
    this.store.wish.set(this.wish().trim());
    this.store.likelyBefore.set(this.likely());
    this.completed.emit(wishOutcome(this.wishAnswers(), this.visualSource.id));
  }

  protected submitOutcome(): void {
    this.store.outcome.set(this.outcome().trim());
    this.completed.emit({ result: {} });
  }

  protected submitObstacle(): void {
    const obstacle = this.obstacle();
    if (!obstacle) return;
    this.store.obstacle.set(obstacle);
    this.completed.emit(obstacleOutcome(obstacle));
  }

  protected submitDecide(): void {
    const answers = this.decideAnswers();
    this.store.wish.set(wishAfterDecide(this.store.wish(), answers));
    this.store.choice.set(answers.choice);
    this.completed.emit(decideOutcome(answers));
  }

  protected submitPlan(): void {
    this.store.plan.set(this.sentence());
    this.completed.emit(planOutcome(this.then()?.id ?? null));
  }

  /** Goes to the clipboard only when the person asks, and is never sent anywhere. */
  protected async copy(): Promise<void> {
    const { copy_wish, copy_best_part, copy_plan, copied, copy_failed } = this.c.close;
    const text = [
      fill(copy_wish, { wish: this.store.wish() }),
      fill(copy_best_part, { outcome: this.store.outcome() }),
      fill(copy_plan, { plan: this.store.plan() }),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      this.copyMessage.set(copied);
    } catch {
      this.copyMessage.set(copy_failed);
    }
  }

  protected submitClose(): void {
    this.completed.emit(closeOutcome(!!this.store.plan(), this.ready(), this.feeling()));
  }
}
