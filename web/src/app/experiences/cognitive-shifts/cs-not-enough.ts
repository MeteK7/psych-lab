import { Component, computed, inject, input, output, signal } from '@angular/core';

import { CS_NOT_ENOUGH, fill } from '../../../content';
import { StepId } from '../../flow/conditions';
import { Experience, StepOutcome } from '../../flow/step-outcome';
import { RatingScale } from '../../shared/rating-scale';
import { CardPick } from './card-pick';
import { fitNote, offersPlan } from './cs-logic';
import { CsStore, Pick } from './cs-store';

/**
 * CS3 · Not enough to go on (cs3-redesign-proposal.md, revision 2): name the first reading, check
 * which other readings the facts of the moment could also fit, then decide whether and how to
 * find out. Own texts stay in CsStore; only ids, the choice and the two ratings are reported.
 */
@Component({
  selector: 'app-cs-not-enough',
  imports: [CardPick, RatingScale],
  template: `
    @switch (stage()) {
      @case ('cs3_situation') {
        <p class="safety">{{ c.safety }}</p>
        <fieldset class="choice">
          <legend>{{ c.situation.ask }}</legend>
          @for (scenario of c.situation.scenarios; track scenario.id) {
            <label class="option" [class.chosen]="choice() === scenario.id">
              <input type="radio" name="cs3-situation" [checked]="choice() === scenario.id" (change)="choice.set(scenario.id)" />
              <span>{{ scenario.text }}</span>
            </label>
          }
          <label class="option" [class.chosen]="choice() === 'own'">
            <input type="radio" name="cs3-situation" [checked]="choice() === 'own'" (change)="choice.set('own')" />
            <span>{{ c.situation.own_choice }}</span>
          </label>
        </fieldset>
        @if (choice() === 'own') {
          <label class="field">
            <span>{{ c.situation.own_label }}</span>
            <input type="text" maxlength="120" [value]="ownSituation()" (input)="ownSituation.set(value($event))" />
          </label>
        }
        <button type="button" [disabled]="!choice() || (choice() === 'own' && !ownSituation().trim())" (click)="submitSituation()">
          {{ c.next_label }}
        </button>
      }
      @case ('cs3_first') {
        <p class="quote">{{ store.scenario()?.text }}</p>
        <app-card-pick [legend]="c.first.ask" [cards]="readings()" [ownChoice]="c.first.own_choice"
                       [ownLabel]="c.first.own_label" [(value)]="pick" />
        <app-rating-scale [item]="c.first.certainty" [(value)]="certainty" />
        <button type="button" [disabled]="!pick() || certainty() === null" (click)="submitFirst()">{{ c.next_label }}</button>
      }
      @case ('cs3_fit') {
        <!-- The facts of the moment sit next to the question: this checks whether the facts can
             tell readings apart, unlike CS1's board, which sorts readings by how well they fit. -->
        <section class="facts" aria-labelledby="cs3-facts">
          <h3 id="cs3-facts">{{ c.fit.facts_label }}</h3>
          <p class="fact">{{ store.scenario()?.text }}</p>
          <p class="mine">{{ say(c.fit.your_reading, { reading: store.cs3First()?.text ?? '' }) }}</p>
        </section>
        <fieldset class="choice">
          <legend>{{ c.fit.ask }}</legend>
          <p class="hint">{{ c.fit.hint }}</p>
          @for (reading of others(); track reading.id) {
            <label class="check">
              <input type="checkbox" [checked]="ticked(reading.id)" (change)="toggle(reading.id)" />
              {{ reading.text }}
            </label>
          }
          @if (store.cs3Own(); as own) {
            <label class="check">
              <input type="checkbox" checked disabled />
              {{ own.text }}
            </label>
          }
          <label class="check">
            <input type="checkbox" [checked]="store.cs3SomethingElse()" (change)="store.cs3SomethingElse.set(!store.cs3SomethingElse())" />
            {{ c.fit.something_else }}
          </label>
        </fieldset>
        @if (!store.cs3Own()) {
          <form class="own" (submit)="$event.preventDefault(); addOwn()">
            <label class="field">
              <span>{{ c.fit.own_prompt }}</span>
              <span class="sub">{{ c.fit.own_label }}</span>
              <input type="text" maxlength="120" [value]="ownText()" (input)="ownText.set(value($event))" />
            </label>
            <button type="submit" [disabled]="!ownText().trim()">{{ c.fit.add }}</button>
          </form>
        }
        @if (noteShown()) {
          <div class="note" role="status">
            <p>{{ say(c.fit[note().key], { n: note().n }) }}</p>
            @if (store.cs3SomethingElse()) {
              <p>{{ c.fit.note_something }}</p>
            }
            <p>{{ c.fit.note_always }}</p>
          </div>
          <button type="button" (click)="submitFit()">{{ c.next_label }}</button>
        } @else {
          <button type="button" (click)="noteShown.set(true)">{{ c.fit.done }}</button>
        }
      }
      @case ('cs3_find') {
        <p>{{ c.find.intro }}</p>
        <p class="decide">{{ c.find.decide }}</p>
        <fieldset class="choice">
          <legend>{{ c.find.ask }}</legend>
          @for (option of c.find.options; track option.id) {
            <label class="check">
              <input type="radio" name="cs3-find" [value]="option.id" [checked]="store.cs3Find() === option.id"
                     (change)="store.cs3Find.set(option.id)" />
              {{ option.label }}
            </label>
          }
        </fieldset>
        @if (follow(); as text) {
          <p class="note" role="status">{{ text }}</p>
        }
        <button type="button" [disabled]="!store.cs3Find()" (click)="done({ choice: store.cs3Find() })">{{ c.next_label }}</button>
      }
      @case ('cs3_after') {
        <p class="quote">{{ say(c.after.reading, { reading: store.cs3First()?.text ?? '' }) }}</p>
        <app-rating-scale [item]="c.first.certainty" [(value)]="certainty" />
        <section class="keep" aria-labelledby="cs3-keep">
          <h3 id="cs3-keep">{{ c.after.keep_heading }}</h3>
          <ol>
            @for (question of c.after.keep; track question) {
              <li>{{ question }}</li>
            }
          </ol>
        </section>
        @if (plan()) {
          <p class="note">{{ c.after.plan_prompt }}</p>
        }
        <button type="button" [disabled]="certainty() === null" (click)="finish()">{{ c.finish_label }}</button>
      }
    }
  `,
  styles: `
    .safety { border-left: 4px solid var(--accent); padding-left: 0.75rem; }
    .quote { font-size: 1.1rem; }
    .choice { border: 0; padding: 0; margin: 0 0 1rem; }
    .choice legend { font-weight: 600; margin-bottom: 0.5rem; }
    .option { display: flex; gap: 0.6rem; align-items: flex-start; padding: 0.6rem 0.75rem; margin-bottom: 0.5rem;
              border: 1px solid var(--border); border-radius: 8px; cursor: pointer; }
    .option.chosen { border-color: var(--accent); border-width: 2px; padding: calc(0.6rem - 1px) calc(0.75rem - 1px); }
    .option input { margin-top: 0.25rem; }
    .check { display: flex; gap: 0.5rem; align-items: flex-start; margin-bottom: 0.4rem; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; max-width: 32rem; }
    .field input { padding: 0.4rem; font: inherit; }
    .sub { font-size: 0.875rem; color: var(--muted); }
    .own { display: flex; gap: 0.75rem; align-items: flex-end; flex-wrap: wrap; }
    .facts { margin: 0 0 1rem; padding: 0.75rem 0.875rem; border: 1px solid var(--border); border-radius: 8px;
             background: color-mix(in srgb, var(--text) 4%, transparent); }
    .facts h3 { margin: 0 0 0.25rem; font-size: 0.95rem; }
    .facts p { margin: 0; }
    .fact { font-size: 1.05rem; }
    .mine { margin-top: 0.5rem !important; color: var(--muted); }
    .hint { margin: 0 0 0.6rem; color: var(--muted); font-size: 0.95rem; }
    .decide { color: var(--muted); }
    .note { border-left: 4px solid var(--accent); padding-left: 0.75rem; }
    .note p { margin: 0 0 0.4rem; }
    .keep { margin: 1rem 0; }
    .keep h3 { font-size: 1rem; margin: 0 0 0.25rem; }
    .keep ol { margin: 0; padding-left: 1.25rem; }
  `,
})
export class CsNotEnough implements Experience {
  readonly stage = input.required<StepId>();
  readonly completed = output<StepOutcome>();

  protected readonly c = CS_NOT_ENOUGH;
  protected readonly store = inject(CsStore);

  protected readonly choice = signal<string | null>(null);
  protected readonly ownSituation = signal('');
  protected readonly pick = signal<Pick | null>(null);
  protected readonly certainty = signal<number | null>(null);
  protected readonly ownText = signal('');
  protected readonly noteShown = signal(false);

  /** The chosen scenario's readings, or the general ones for an own situation. */
  protected readonly readings = computed(
    () =>
      this.c.situation.scenarios.find((s) => s.id === this.store.scenario()?.id)?.readings ??
      this.c.situation.own_readings,
  );
  /** Every reading other than the person's first one; all are shown, none chosen in advance. */
  protected readonly others = computed(() => this.readings().filter((r) => r.id !== this.store.cs3First()?.id));
  protected readonly note = computed(() => fitNote(this.store.cs3Fits().length + (this.store.cs3Own() ? 1 : 0)));
  protected readonly follow = computed(() => this.c.find.options.find((o) => o.id === this.store.cs3Find())?.follow);
  protected readonly plan = computed(() => offersPlan(this.store.cs3Find()));

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected say(text: string, values: Record<string, string | number>): string {
    return fill(text, values);
  }

  protected ticked(id: string): boolean {
    return this.store.cs3Fits().includes(id);
  }

  protected toggle(id: string): void {
    this.store.cs3Fits.update((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  protected addOwn(): void {
    const text = this.ownText().trim();
    if (!text) return;
    this.store.cs3Own.set({ id: 'own', text });
    this.ownText.set('');
  }

  protected done(result: Record<string, unknown>): void {
    this.completed.emit({ result });
  }

  protected submitSituation(): void {
    const id = this.choice();
    if (!id) return;
    const scenario = this.c.situation.scenarios.find((s) => s.id === id);
    this.store.scenario.set(scenario ? { id, text: scenario.text } : { id: 'own', text: this.ownSituation().trim() });
    this.done({ scenario: scenario ? id : 'own' });
  }

  protected submitFirst(): void {
    const pick = this.pick();
    if (!pick) return;
    this.store.cs3First.set(pick);
    this.completed.emit({ result: { first: pick.id }, ratings: { cs3_certainty_pre: this.certainty()! } });
  }

  protected submitFit(): void {
    const order = this.others().map((r) => r.id);
    this.done({
      fits: order.filter((id) => this.ticked(id)),
      own_added: this.store.cs3Own() !== null,
      something_else: this.store.cs3SomethingElse(),
    });
  }

  protected finish(): void {
    this.completed.emit({
      result: {},
      ratings: { cs3_certainty_post: this.certainty()! },
      next: this.plan() ? { label: this.c.after.plan_link, exercise: 'action_bridge' } : undefined,
    });
  }
}
