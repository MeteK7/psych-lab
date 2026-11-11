import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { CS_OTHER_READINGS, fill } from '../../../content';
import { StepId } from '../../flow/conditions';
import { Experience, StepOutcome } from '../../flow/step-outcome';
import { RatingScale } from '../../shared/rating-scale';
import { CardPick } from './card-pick';
import { Column, firstReadingClose } from './cs-logic';
import { CsStore, Pick } from './cs-store';

interface BoardCard {
  key: string;
  tag: string;
  text: string;
  card: string;
}

/**
 * CS1 · Other ways to read it (cognitive-shifts-design.md §3). One component, one screen
 * per step; the session runner shows the step heading. Free text stays in CsStore.
 */
@Component({
  selector: 'app-cs-other-readings',
  imports: [CardPick, NgTemplateOutlet, RatingScale],
  template: `
    @switch (stage()) {
      @case ('cs1_first') {
        <p class="safety">{{ c.safety }}</p>
        <p>{{ c.first.intro }}</p>
        <app-card-pick [legend]="c.first.ask" [cards]="c.first.cards" [ownChoice]="c.first.own_choice"
                       [ownLabel]="c.first.own_label" [(value)]="pick" />
        <button class="primary" type="button" [disabled]="!pick()" (click)="submitFirst()">{{ c.next_label }}</button>
      }
      @case ('cs1_feel_before') {
        <p class="quote">{{ reading() }}</p>
        <app-rating-scale [item]="c.feel.belief" [(value)]="belief" />
        <app-rating-scale [item]="c.feel.upset" [(value)]="upset" />
        <fieldset class="choice">
          <legend>{{ c.feel.control.question }}</legend>
          @for (option of c.feel.control.options; track option.id) {
            <label class="inline">
              <input type="radio" name="cs1-control" [value]="option.id" [checked]="control() === option.id"
                     (change)="control.set(option.id)" />
              {{ option.label }}
            </label>
          }
        </fieldset>
        <button class="primary" type="button" [disabled]="belief() === null || upset() === null || !control()" (click)="submitFeelBefore()">
          {{ c.next_label }}
        </button>
      }
      @case ('cs1_lenses') {
        <h3 class="lens" tabindex="-1" #lensHeading>
          {{ say(c.lenses.counter, { n: lensIndex() + 1, total: c.lenses.items.length, title: lens().title }) }}
        </h3>
        @for (line of lens().lead; track line) {
          <p class="lead">{{ line }}</p>
        }
        <app-card-pick [legend]="lens().prompt" [cards]="lens().cards" [ownChoice]="c.lenses.own_choice"
                       [ownLabel]="c.lenses.own_label" [(value)]="pick" />
        <div class="actions">
          <!-- Two equal answers: neither is filled, so neither is favoured ("every choice offers a way out"). -->
          <button type="button" [disabled]="!pick()" (click)="nextLens(pick())">
            {{ lensIndex() + 1 < c.lenses.items.length ? c.lenses.next_lens : c.next_label }}
          </button>
          <button type="button" (click)="nextLens(null)">{{ c.lenses.nothing }}</button>
        </div>
      }
      @case ('cs1_sort') {
        <p>{{ c.sort.intro }}</p>
        @if (unplaced().length) {
          <section class="tray" aria-labelledby="cs1-unplaced">
            <h3 id="cs1-unplaced">{{ c.sort.unplaced }}</h3>
            <ul class="cards">
              @for (card of unplaced(); track card.key) {
                <ng-container [ngTemplateOutlet]="boardCard" [ngTemplateOutletContext]="{ $implicit: card }" />
              }
            </ul>
          </section>
        }
        <div class="board">
          @for (column of c.sort.columns; track column.id) {
            <section class="column" [attr.aria-labelledby]="'cs1-col-' + column.id">
              <h3 [id]="'cs1-col-' + column.id">{{ column.label }}</h3>
              <ul class="cards">
                @for (card of inColumn(column.id); track card.key) {
                  <ng-container [ngTemplateOutlet]="boardCard" [ngTemplateOutletContext]="{ $implicit: card }" />
                }
              </ul>
            </section>
          }
        </div>
        <div class="actions">
          <button type="button" [attr.aria-pressed]="store.noneFit()" (click)="store.noneFit.set(!store.noneFit())">
            {{ c.sort.none_fit }}
          </button>
          <button class="primary" type="button" [disabled]="unplaced().length > 0 && !store.noneFit()" (click)="submitSort()">
            {{ c.next_label }}
          </button>
        </div>

        <ng-template #boardCard let-card>
          <li class="board-card">
            <p class="tag">{{ card.tag }}</p>
            <p>{{ card.text }}</p>
            <fieldset class="place">
              <legend class="sr-only">{{ c.sort.place_label }} {{ card.text }}</legend>
              @for (column of c.sort.columns; track column.id) {
                <label class="inline">
                  <input type="radio" [id]="'place-' + card.key + '-' + column.id" [name]="'place-' + card.key"
                         [checked]="store.placements()[card.key] === column.id" (change)="place(card.key, column.id)" />
                  {{ column.label }}
                </label>
              }
            </fieldset>
          </li>
        </ng-template>
      }
      @case ('cs1_feel_after') {
        <p class="quote">{{ say(c.after.reading, { reading: store.firstReading()?.text ?? '' }) }}</p>
        <p>{{ c.after.checked }}</p>
        <app-rating-scale [item]="c.after.belief" [(value)]="belief" />
        <app-rating-scale [item]="c.after.upset" [(value)]="upset" />
        <p>{{ c.after.no_direction }}</p>
        <!-- Shown only after rating, so the earlier numbers don't pull the new answers towards them. -->
        @if (belief() !== null && upset() !== null) {
          <div class="note" role="status">
            <p>{{ say(c.after.compared_belief, { before: store.beliefBefore() ?? 0, now: belief() ?? 0 }) }}</p>
            <p>{{ say(c.after.compared_upset, { before: store.upsetBefore() ?? 0, now: upset() ?? 0 }) }}</p>
            <p>{{ c.after.compared_means }}</p>
          </div>
        }
        <button class="primary" type="button" [disabled]="belief() === null || upset() === null" (click)="submitFeelAfter()">
          {{ c.next_label }}
        </button>
      }
      @case ('cs1_close') {
        @if (kept().length) {
          <p>{{ c.close.kept }}</p>
          <ul class="kept">
            @for (card of kept(); track card.key) {
              <li>{{ card.text }}</li>
            }
          </ul>
        } @else {
          <p>{{ c.close.none_kept }}</p>
        }
        @if (closeKey(); as key) {
          <p class="note">{{ c.close[key] }}</p>
        }
        @if (actionable()) {
          <p class="note">{{ c.close.control }}</p>
        }
        <button class="primary" type="button" (click)="finish()">{{ c.finish_label }}</button>
      }
    }
  `,
  styles: `
    .safety { border-left: 4px solid var(--accent); padding-left: 0.75rem; }
    .quote { font-size: 1.1rem; }
    .choice { border: 0; padding: 0; margin: 0 0 1.25rem; }
    .choice legend { font-weight: 600; margin-bottom: 0.5rem; }
    .inline { display: inline-flex; gap: 0.35rem; align-items: center; margin-right: 1rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem; }
    .lens { font-size: 1rem; }
    .board { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); }
    .column, .tray { background: color-mix(in srgb, var(--text) 4%, transparent); border-radius: 8px; padding: 0.5rem 0.75rem; }
    .tray { margin-bottom: 0.75rem; }
    .column h3, .tray h3 { font-size: 0.95rem; margin: 0.25rem 0 0.5rem; }
    .cards { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; min-height: 2rem; }
    .board-card { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 0.5rem 0.75rem; }
    .board-card p { margin: 0 0 0.25rem; }
    .tag { font-size: 0.8rem; color: var(--muted); }
    .place { border: 0; padding: 0; margin: 0.25rem 0 0; font-size: 0.875rem;
             display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; }
    /* WCAG 2.2 target size: at least 24 × 24 px per choice. */
    .place .inline { margin: 0; min-height: 1.75rem; }
    .place input { width: 1.5rem; height: 1.5rem; margin: 0; }
    .note { border-left: 4px solid var(--accent); padding-left: 0.75rem; }
    .note p { margin: 0 0 0.4rem; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  `,
})
export class CsOtherReadings implements Experience {
  readonly stage = input.required<StepId>();
  readonly completed = output<StepOutcome>();

  protected readonly c = CS_OTHER_READINGS;
  protected readonly store = inject(CsStore);
  private readonly injector = inject(Injector);
  private readonly lensHeading = viewChild<ElementRef<HTMLElement>>('lensHeading');

  protected readonly pick = signal<Pick | null>(null);
  protected readonly belief = signal<number | null>(null);
  protected readonly upset = signal<number | null>(null);
  protected readonly control = signal<'yes' | 'partly' | 'no' | null>(null);
  protected readonly lensIndex = signal(0);

  protected readonly lens = computed(() => this.c.lenses.items[this.lensIndex()]);
  protected readonly reading = computed(() =>
    fill(this.c.feel.reading, { reading: this.store.firstReading()?.text ?? '' }),
  );
  protected readonly board = computed<BoardCard[]>(() => {
    const first = this.store.firstReading();
    const cards: BoardCard[] = first ? [{ key: 'first', tag: this.c.sort.first_tag, text: first.text, card: first.id }] : [];
    this.store.lensReadings().forEach((r, i) => {
      if (r) cards.push({ key: this.c.lenses.items[i].id, tag: this.c.lenses.items[i].title, text: r.text, card: r.id });
    });
    return cards;
  });
  protected readonly unplaced = computed(() => this.board().filter((b) => !this.store.placements()[b.key]));
  protected readonly kept = computed(() => this.board().filter((b) => this.store.placements()[b.key] === 'fits'));
  protected readonly closeKey = computed(() => {
    const first = this.store.firstReading();
    return first ? firstReadingClose(first.kind, this.store.placements()['first'] ?? null) : null;
  });
  protected readonly actionable = computed(() => this.store.control() === 'yes' || this.store.control() === 'partly');

  protected say(text: string, values: Record<string, string | number>): string {
    return fill(text, values);
  }

  protected inColumn(column: Column): BoardCard[] {
    return this.board().filter((b) => this.store.placements()[b.key] === column);
  }

  protected submitFirst(): void {
    const pick = this.pick();
    if (!pick) return;
    const card = this.c.first.cards.find((k) => k.id === pick.id);
    this.store.firstReading.set({ ...pick, kind: card ? card.kind : 'own' });
    this.completed.emit({ result: { first: pick.id } });
  }

  protected submitFeelBefore(): void {
    this.store.control.set(this.control());
    this.store.beliefBefore.set(this.belief());
    this.store.upsetBefore.set(this.upset());
    this.completed.emit({
      result: { control: this.control() },
      ratings: { cs1_belief_pre: this.belief()!, cs1_upset_pre: this.upset()! },
    });
  }

  protected nextLens(pick: Pick | null): void {
    const readings = [...this.store.lensReadings()];
    readings[this.lensIndex()] = pick;
    this.store.lensReadings.set(readings);
    this.pick.set(null);
    if (this.lensIndex() + 1 < this.c.lenses.items.length) {
      this.lensIndex.update((i) => i + 1);
      afterNextRender(() => this.lensHeading()?.nativeElement.focus(), { injector: this.injector });
      return;
    }
    this.completed.emit({
      result: {
        lenses: this.c.lenses.items.map((l, i) => ({ lens: l.id, reading: readings[i]?.id ?? null })),
      },
    });
  }

  protected place(key: string, column: Column): void {
    this.store.placements.update((p) => ({ ...p, [key]: column }));
    // The card moves to another column; keep keyboard focus on its choice.
    afterNextRender(() => document.getElementById(`place-${key}-${column}`)?.focus(), { injector: this.injector });
  }

  protected submitSort(): void {
    this.completed.emit({
      result: {
        placements: this.board().map((b) => ({ reading: b.key, card: b.card, column: this.store.placements()[b.key] ?? null })),
        none_fit: this.store.noneFit(),
      },
    });
  }

  protected submitFeelAfter(): void {
    this.completed.emit({
      result: {},
      ratings: { cs1_belief_post: this.belief()!, cs1_upset_post: this.upset()! },
    });
  }

  protected finish(): void {
    this.completed.emit({
      result: { first_fits: this.store.placements()['first'] === 'fits', kept: this.kept().length },
      next: this.actionable() ? { label: this.c.close.plan_link, exercise: 'action_bridge' } : undefined,
    });
  }
}
